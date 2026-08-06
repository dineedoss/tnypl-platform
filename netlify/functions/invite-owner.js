const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = (process.env.SITE_URL || "https://tnypl.in").replace(/\/+$/, "");

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json(500, { error: "Supabase server credentials are missing" });
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!accessToken) {
    return json(401, { error: "Admin authentication required" });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const { data: authData, error: authError } =
      await adminClient.auth.getUser(accessToken);

    if (authError || !authData?.user) {
      return json(401, { error: "Invalid or expired admin session" });
    }

    const { data: adminRow, error: adminError } = await adminClient
      .from("admin_users")
      .select("user_id, role")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (adminError || !adminRow) {
      return json(403, { error: "This account is not an authorized TNYPL administrator" });
    }

    const payload = JSON.parse(event.body || "{}");
    const ownerName = String(payload.owner_name || "").trim();
    const email = String(payload.email || "").trim().toLowerCase();
    const franchiseId = String(payload.franchise_id || "").trim();

    if (!ownerName || !email || !franchiseId) {
      return json(400, { error: "Owner name, email and franchise are required" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(400, { error: "Enter a valid email address" });
    }

    const { data: franchise, error: franchiseError } = await adminClient
      .from("franchises")
      .select("id, name, slug")
      .eq("id", franchiseId)
      .maybeSingle();

    if (franchiseError || !franchise) {
      return json(400, { error: "Selected franchise was not found" });
    }

    let invitedUser = null;
    let invitationSent = false;
    let existingUser = false;

    const { data: listedUsers, error: listError } =
      await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (listError) throw listError;

    invitedUser = listedUsers?.users?.find(
      (user) => String(user.email || "").toLowerCase() === email
    ) || null;

    if (invitedUser) {
      existingUser = true;
    } else {
      const { data: inviteData, error: inviteError } =
        await adminClient.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${SITE_URL}/owner-setup-password.html`,
          data: {
            owner_name: ownerName,
            franchise_id: franchise.id,
            franchise_name: franchise.name,
            role: "owner"
          }
        });

      if (inviteError) throw inviteError;
      invitedUser = inviteData?.user;
      invitationSent = true;
    }

    if (!invitedUser?.id) {
      throw new Error("Supabase did not return an owner user ID");
    }

    const { error: profileError } = await adminClient
      .from("owner_profiles")
      .upsert({
        user_id: invitedUser.id,
        owner_name: ownerName,
        franchise_id: franchise.id,
        role: "owner",
        is_active: true
      }, { onConflict: "user_id" });

    if (profileError) throw profileError;

    const { error: walletError } = await adminClient
      .from("franchise_wallets")
      .upsert({
        franchise_id: franchise.id
      }, { onConflict: "franchise_id", ignoreDuplicates: true });

    if (walletError) throw walletError;

    const { error: auditError } = await adminClient
      .from("owner_invites")
      .insert({
        owner_user_id: invitedUser.id,
        owner_name: ownerName,
        email,
        franchise_id: franchise.id,
        invited_by: authData.user.id,
        invitation_sent: invitationSent,
        status: existingUser ? "linked_existing_user" : "invited"
      });

    if (auditError) throw auditError;

    return json(200, {
      success: true,
      invitation_sent: invitationSent,
      existing_user: existingUser,
      owner: {
        user_id: invitedUser.id,
        owner_name: ownerName,
        email,
        franchise_id: franchise.id,
        franchise_name: franchise.name
      },
      message: invitationSent
        ? `Invitation sent to ${email}`
        : `${email} already existed and has been linked to ${franchise.name}`
    });
  } catch (error) {
    console.error("invite-owner error", error);
    return json(500, { error: error.message || "Unable to invite owner" });
  }
};
