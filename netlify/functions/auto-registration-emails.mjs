import { createClient } from "@supabase/supabase-js";

async function resendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) throw new Error("RESEND_API_KEY or EMAIL_FROM is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Email provider rejected the request.");
  return result;
}

function confirmationHtml(player) {
  return `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto">
    <h1 style="color:#09254d">Registration received</h1>
    <p>Dear ${player.parent_name || "Parent/Guardian"},</p>
    <p>We have received the TNYPL player draft registration for <strong>${player.full_name}</strong>.</p>
    <p>The age proof and payment receipt will be reviewed by the administration team. Registration does not guarantee selection. Approved players will enter the official live draft pool.</p>
    <p><strong>Registration status:</strong> Pending verification</p>
    <p><strong>Draft places:</strong> 104 across eight franchises</p>
    <p>Regards,<br>TNYPL Administration</p>
  </div>`;
}

export default async () => {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Supabase server configuration is missing.");
    return;
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const staleBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  await supabase
    .from("players")
    .update({ registration_email_claimed_at: null })
    .is("registration_email_sent_at", null)
    .lt("registration_email_claimed_at", staleBefore);

  const { data: candidates, error: candidateError } = await supabase
    .from("players")
    .select("id,full_name,parent_name,email,district,created_at")
    .is("registration_email_sent_at", null)
    .is("registration_email_claimed_at", null)
    .not("email", "is", null)
    .order("created_at", { ascending: true })
    .limit(10);

  if (candidateError) {
    console.error("Unable to load pending registration emails:", candidateError.message);
    return;
  }

  if (!candidates?.length) {
    console.log("No pending registration confirmation emails.");
    return;
  }

  const claimed = [];

  for (const player of candidates) {
    const { data: claim, error: claimError } = await supabase
      .from("players")
      .update({ registration_email_claimed_at: new Date().toISOString() })
      .eq("id", player.id)
      .is("registration_email_sent_at", null)
      .is("registration_email_claimed_at", null)
      .select("id")
      .maybeSingle();

    if (claimError) {
      console.error(`Unable to claim ${player.id}:`, claimError.message);
      continue;
    }

    if (claim) claimed.push(player);
  }

  const results = await Promise.allSettled(
    claimed.map(async (player) => {
      try {
        const provider = await resendEmail({
          to: player.email,
          subject: "TNYPL player registration received",
          html: confirmationHtml(player),
        });

        const sentAt = new Date().toISOString();

        const { error: updateError } = await supabase
          .from("players")
          .update({
            registration_email_sent_at: sentAt,
            registration_email_claimed_at: null,
          })
          .eq("id", player.id);

        if (updateError) {
          console.error(`Email sent but status update failed for ${player.id}:`, updateError.message);
          return;
        }

        const { error: logError } = await supabase.from("email_log").insert({
          player_id: player.id,
          email_type: "registration",
          recipient: player.email,
          provider_message_id: provider.id || null,
          status: "sent",
        });

        if (logError) console.warn(`Email log failed for ${player.id}:`, logError.message);
        console.log(`Registration confirmation sent for ${player.id}.`);
      } catch (error) {
        await supabase
          .from("players")
          .update({ registration_email_claimed_at: null })
          .eq("id", player.id)
          .is("registration_email_sent_at", null);

        console.error(`Registration confirmation failed for ${player.id}:`, error.message);
        throw error;
      }
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;
  console.log(`Automatic registration email run complete. Processed=${results.length} Sent=${sent} Failed=${failed}`);
};
