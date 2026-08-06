
(function(){
  window.TNYPL_PUBLIC_SAFE = {
    loading(container, message){
      if(!container) return;
      container.innerHTML = `
        <div class="tnypl-loading">
          <div>
            <div class="tnypl-spinner"></div>
            <div>${message || "Loading official TNYPL information…"}</div>
          </div>
        </div>`;
    },
    empty(container, icon, title, message){
      if(!container) return;
      container.innerHTML = `
        <div class="tnypl-empty">
          <div class="icon">${icon || "🏏"}</div>
          <h2>${title || "Coming Soon"}</h2>
          <p>${message || "Official information will appear here when published by TNYPL."}</p>
        </div>`;
    },
    safeError(container, title, message){
      console.error(title, message);
      this.empty(
        container,
        "🏆",
        title || "Tournament preparations are underway",
        message || "Please check back shortly. Official information will appear here after it is published."
      );
    }
  };
})();
