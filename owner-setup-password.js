const cfg = window.TNYPL_CONFIG;
const sb = supabase.createClient(
  cfg.SUPABASE_URL,
  cfg.SUPABASE_ANON_KEY,
  {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

function msg(text, ok = false) {
  const el = document.getElementById("setupMessage");
  el.hidden = false;
  el.textContent = text;
  el.className = "auction-alert" + (ok ? " auction-success" : "");
}

async function establishInviteSession() {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(location.search);

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  const code = query.get("code");

  if (accessToken && refreshToken) {
    const { error } = await sb.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    if (error) throw error;
  } else if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) throw error;
  }

  // Give supabase-js a moment to process detectSessionInUrl callbacks.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    if (data.session) return data.session;
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  throw new Error(
    "The invitation link is invalid, expired, or already used. Ask TNYPL Admin to send a new invitation."
  );
}

document.getElementById("activateOwner").onclick = async () => {
  const button = document.getElementById("activateOwner");

  try {
    const password = document.getElementById("newPassword").value;
    const confirmPassword =
      document.getElementById("confirmPassword").value;

    if (password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    button.disabled = true;
    button.textContent = "ACTIVATING…";

    await establishInviteSession();

    const { data, error } = await sb.auth.updateUser({ password });
    if (error) throw error;

    const user = data.user;

    if (user) {
      // These updates are best-effort because RLS may restrict one table.
      await Promise.allSettled([
        sb.from("franchise_members")
          .update({
            accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id),

        sb.from("owner_profiles")
          .update({ is_active: true })
          .eq("user_id", user.id)
      ]);
    }

    msg(
      "Password created successfully. Opening your franchise dashboard…",
      true
    );

    setTimeout(() => {
      window.location.replace("/owner-dashboard.html");
    }, 900);
  } catch (error) {
    msg(error.message || "Unable to activate the owner account.");
    button.disabled = false;
    button.textContent = "ACTIVATE OWNER ACCOUNT";
  }
};

window.addEventListener("load", async () => {
  try {
    await establishInviteSession();
    msg("Invitation verified. Create your private password below.", true);
  } catch (error) {
    msg(error.message);
  }
});
