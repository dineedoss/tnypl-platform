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

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return json(500, { error: "Supabase server configuration is missing." });

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  try {
    const body = JSON.parse(event.body || "{}");
    const type = body.type;
    const playerId = body.player_id;
    if (!type || !playerId) return json(400, { error: "type and player_id are required" });

    const { data: player, error: playerError } = await supabase
      .from("players").select("*").eq("id", playerId).single();
    if (playerError || !player) return json(404, { error: "Player not found" });

    let subject, html, update = {}, requireAdmin = false;

    if (type === "registration") {
      subject = "TNYPL player registration received";
      html = `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto">
          <h1 style="color:#09254d">Registration received</h1>
          <p>Dear ${player.parent_name || "Parent/Guardian"},</p>
          <p>We have received the TNYPL player draft registration for <strong>${player.full_name}</strong>.</p>
          <p>The age proof and payment receipt will be reviewed by the administration team. Registration does not guarantee selection. Approved players will enter the official live draft pool.</p>
          <p><strong>Registration status:</strong> Pending verification</p>
          <p><strong>Draft places:</strong> 104 across eight franchises</p>
          <p>Regards,<br>TNYPL Administration</p>
        </div>`;
      update.registration_email_sent_at = new Date().toISOString();
    } else if (type === "drafted") {
      requireAdmin = true;
      if (!player.drafted || !player.drafted_team) {
        return json(400, { error: "Player must be assigned to a franchise first." });
      }
      subject = `Congratulations! ${player.full_name} has been drafted by ${player.drafted_team}`;
      html = `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto">
          <h1 style="color:#b47a05">Congratulations!</h1>
          <p>Dear ${player.parent_name || "Parent/Guardian"},</p>
          <p>We are delighted to confirm that <strong>${player.full_name}</strong> has been selected in the TNYPL live player draft.</p>
          <h2 style="color:#09254d">${player.drafted_team}</h2>
          <p>The TNYPL administration and franchise team will contact you with the next steps, playing-kit information, reporting instructions and tournament details.</p>
          <p>Welcome to TNYPL Season 1.</p>
          <p>Regards,<br>TNYPL Administration</p>
        </div>`;
      update.drafted_email_sent_at = new Date().toISOString();
    } else {
      return json(400, { error: "Unsupported email type" });
    }

    if (requireAdmin) {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      const token = authHeader?.replace(/^Bearer\s+/i, "");
      if (!token) return json(401, { error: "Admin authentication required" });

      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authData.user) return json(401, { error: "Invalid admin session" });

      const { data: admin } = await supabase
        .from("admin_users").select("user_id").eq("user_id", authData.user.id).maybeSingle();
      if (!admin) return json(403, { error: "Not an authorized administrator" });
    }

    const result = await resendEmail({ to: player.email, subject, html });

    await supabase.from("players").update(update).eq("id", player.id);
    await supabase.from("email_log").insert({
      player_id: player.id,
      email_type: type,
      recipient: player.email,
      provider_message_id: result.id || null,
      status: "sent",
    });

    if (type === "registration" && process.env.ADMIN_NOTIFICATION_EMAIL) {
      await resendEmail({
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `New TNYPL registration: ${player.full_name}`,
        html: `<p>A new registration was received for <strong>${player.full_name}</strong> from ${player.district}.</p><p>Open the admin dashboard to review the documents.</p>`,
      });
    }

    return json(200, { ok: true, message_id: result.id });
  } catch (error) {
    return json(500, { error: error.message });
  }
};
