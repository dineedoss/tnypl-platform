const { createClient } = require("@supabase/supabase-js");

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, authorization",
  },
  body: JSON.stringify(body),
});

async function resendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) throw new Error("Email service is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Email provider rejected the request.");
  return result;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return json(500, { error: "Supabase server configuration is missing." });

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { error: "Admin authentication required" });

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return json(401, { error: "Invalid admin session" });

    const { data: admin } = await supabase
      .from("admin_users").select("user_id").eq("user_id", authData.user.id).maybeSingle();
    if (!admin) return json(403, { error: "Not an authorized administrator" });

    const body = JSON.parse(event.body || "{}");
    const limit = Math.max(1, Math.min(Number(body.limit || 20), 50));

    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id,full_name,parent_name,email,district,registration_email_sent_at,created_at")
      .is("registration_email_sent_at", null)
      .not("email", "is", null)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (playersError) throw playersError;

    const sent = [];
    const failed = [];

    for (const player of players || []) {
      try {
        const subject = "TNYPL player registration received";
        const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto">
          <h1 style="color:#09254d">Registration received</h1>
          <p>Dear ${player.parent_name || "Parent/Guardian"},</p>
          <p>We have received the TNYPL player draft registration for <strong>${player.full_name}</strong>.</p>
          <p>The age proof and payment receipt will be reviewed by the administration team. Registration does not guarantee selection. Approved players will enter the official live draft pool.</p>
          <p><strong>Registration status:</strong> Pending verification</p>
          <p><strong>Draft places:</strong> 104 across eight franchises</p>
          <p>Regards,<br>TNYPL Administration</p>
        </div>`;

        const result = await resendEmail({ to: player.email, subject, html });
        const sentAt = new Date().toISOString();

        const { error: updateError } = await supabase
          .from("players").update({ registration_email_sent_at: sentAt }).eq("id", player.id);
        if (updateError) throw updateError;

        await supabase.from("email_log").insert({
          player_id: player.id,
          email_type: "registration",
          recipient: player.email,
          provider_message_id: result.id || null,
          status: "sent",
        });

        sent.push({ id: player.id, email: player.email });
      } catch (error) {
        failed.push({ id: player.id, email: player.email, error: error.message });
      }
    }

    return json(200, {
      ok: true,
      processed: (players || []).length,
      sent: sent.length,
      failed: failed.length,
      failed_items: failed,
    });
  } catch (error) {
    return json(500, { error: error.message });
  }
};