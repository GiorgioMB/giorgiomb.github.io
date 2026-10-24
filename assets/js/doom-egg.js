// Easter egg: type "iddqd" anywhere (or tap the footer five times) to open the game page in an overlay.
(function () {
  "use strict";
  const script = document.currentScript;
  const url = script && script.dataset.url;
  if (!url) return;
  const CODE = "iddqd";
  let typed = "",
    taps = [],
    overlay = null,
    opener = null;

  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    if (opener) opener.focus();
  }
  function open() {
    if (overlay) return;
    opener = document.activeElement;
    overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Game");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem;";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Close";
    button.style.cssText =
      "align-self:flex-end;margin-bottom:.5rem;background:#fff;color:#000;border:0;border-radius:6px;padding:.35rem .9rem;font:inherit;cursor:pointer;";
    button.addEventListener("click", close);
    const frame = document.createElement("iframe");
    frame.src = url;
    frame.title = "Game";
    frame.allow = "fullscreen; autoplay";
    frame.style.cssText = "width:min(960px,100%);aspect-ratio:4/3;max-height:calc(100vh - 5rem);border:0;background:#000;";
    overlay.append(button, frame);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.body.appendChild(overlay);
    button.focus();
  }

  document.addEventListener("keydown", (e) => {
    if (overlay) {
      if (e.key === "Escape") close();
      return;
    }
    const t = e.target;
    if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1) return;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || (t.closest && t.closest("ninja-keys")))) return;
    typed = (typed + e.key.toLowerCase()).slice(-CODE.length);
    if (typed === CODE) {
      typed = "";
      open();
    }
  });
  const footer = document.querySelector("footer");
  if (footer)
    footer.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      const now = Date.now();
      taps = taps.filter((t) => now - t < 3000);
      taps.push(now);
      if (taps.length >= 5) {
        taps = [];
        open();
      }
    });
})();
