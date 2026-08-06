window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const isDummyMode = params.get("dummy") === "1";

  // Never expose developer/test controls on the normal public registration page.
  if (!isDummyMode) return;

  const form = document.getElementById("registrationForm");
  if (!form) return;

  const panel = document.createElement("div");
  panel.setAttribute("role", "status");
  panel.style.cssText = [
    "box-sizing:border-box",
    "width:100%",
    "margin:0 0 18px",
    "padding:14px 16px",
    "border:1px solid #b98c2d",
    "border-radius:10px",
    "background:#fff6d9",
    "color:#06132a",
    "font-family:Arial,sans-serif",
    "font-size:14px",
    "line-height:1.5"
  ].join(";");

  panel.innerHTML = `
    <strong style="display:block;margin-bottom:5px">
      TNYPL TEST MODE
    </strong>
    Safe dummy information will be loaded into the registration form.
    Required files must still be uploaded manually.
  `;

  form.parentNode.insertBefore(panel, form);

  function setField(name, value) {
    const field = form.elements[name];
    if (!field) return;

    if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = value;
    }

    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function loadDummyRegistration() {
    const stamp = Date.now().toString().slice(-6);

    setField("full_name", `TNYPL Dummy Player ${stamp}`);
    setField("date_of_birth", "2011-06-15");
    setField("district", "Chennai");
    setField("parent_name", "Dummy Parent");
    setField("parent_phone", "9000000000");
    setField("email", `tnypl.dummy.${stamp}@example.com`);
    setField("school", "TNYPL Test School");
    setField("academy", "TNYPL Test Cricket Academy");
    setField("cricheroes_url", "https://chshare.link/player/nfujyU");
    setField("primary_role", "All-rounder");
    setField("batting_style", "Right-hand");
    setField("bowling_style", "Right-arm medium");
    setField("tshirt_size", "M");
    setField("pant_size", "30");
    setField("guardian_relationship", "Father");
    setField("emergency_contact_name", "Dummy Parent");
    setField("emergency_contact_phone", "9000000000");
    setField("parent_signature", "Dummy Parent");
    setField("parent_consent", true);
    setField("waiver_acceptance", true);
    setField("information_accuracy", true);
    setField("waiver_signature", "Dummy Parent");

    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  loadDummyRegistration();
});
