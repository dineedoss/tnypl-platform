(function () {
  const config = window.TNYPL_CONFIG;
  if (!window.supabase || !config) return;

  const db = supabase.createClient(
    config.SUPABASE_URL,
    config.SUPABASE_ANON_KEY
  );

  let timer = null;

  function render(settings) {
    const box = document.getElementById("registrationCountdown");
    if (!box) return;

    if (!settings.show_registration_countdown) {
      box.hidden = true;
      return;
    }

    box.hidden = false;

    const submitButton = document.querySelector(
      "#registrationForm [type=submit]"
    );

    if (!settings.registration_open) {
      box.innerHTML =
        "<small>PLAYER REGISTRATION</small><h2>REGISTRATION CLOSED</h2>";
      if (submitButton) submitButton.disabled = true;
      return;
    }

    if (!settings.registration_deadline) {
      box.innerHTML =
        "<small>PLAYER REGISTRATION</small><h2>REGISTRATION OPEN</h2>";
      if (submitButton) submitButton.disabled = false;
      return;
    }

    const deadline = new Date(settings.registration_deadline);

    function tick() {
      const remaining = deadline.getTime() - Date.now();

      if (remaining <= 0) {
        box.innerHTML =
          "<small>PLAYER REGISTRATION</small><h2>REGISTRATION CLOSED</h2>";
        if (submitButton) submitButton.disabled = true;
        clearInterval(timer);
        return;
      }

      if (submitButton) submitButton.disabled = false;

      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      box.innerHTML = `
        <small>PLAYER REGISTRATION CLOSES IN</small>
        <div>
          <span><b>${days}</b>Days</span>
          <span><b>${String(hours).padStart(2, "0")}</b>Hours</span>
          <span><b>${String(minutes).padStart(2, "0")}</b>Minutes</span>
          <span><b>${String(seconds).padStart(2, "0")}</b>Seconds</span>
        </div>`;
    }

    tick();
    timer = setInterval(tick, 1000);
  }

  db.from("site_settings")
    .select(
      "registration_deadline,registration_open,show_registration_countdown"
    )
    .eq("id", 1)
    .maybeSingle()
    .then(({ data, error }) => {
      if (error) {
        console.warn("Registration countdown settings unavailable:", error);
        return;
      }
      if (data) render(data);
    });
})();
