// Easter eggs: the Konami code (arrow keys or WASD, then B A) opens an arcade screen, and ` or ~ opens a
// Source-style developer console. iddt lives in screening-demo.js, since it only means something on that page.
(function () {
  "use strict";
  const script = document.currentScript;
  const base = (script && script.dataset.base) || "";
  // Sounds load when the console first opens, so the first one plays without delay.
  const soundUrls = { fool: script && script.dataset.sfx, dryfire: script && script.dataset.sfxGod };
  const sounds = {};
  function loadSounds() {
    if (typeof Audio === "undefined") return;
    for (const name in soundUrls) {
      if (sounds[name] || !soundUrls[name]) continue;
      sounds[name] = new Audio(soundUrls[name]);
      sounds[name].preload = "auto";
      sounds[name].volume = 0.7;
    }
  }
  function play(name) {
    const sound = sounds[name];
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }
  let mapUrls = [];
  try {
    mapUrls = JSON.parse((script && script.dataset.maps) || "[]");
  } catch (e) {
    mapUrls = [];
  }
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Styles live here, so the eggs need nothing from the site's stylesheets.
  const style = document.createElement("style");
  style.textContent = `
.egg-overlay{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,0,.82)}
.egg-arcade{position:relative;overflow:hidden;width:min(560px,100%);padding:2rem 1.5rem 1.25rem;text-align:center;background:#06061a;border:4px solid #f0f;border-radius:10px;
  box-shadow:0 0 0 4px #0ff,0 0 40px #f0f;color:#fff;font:700 15px/1.5 ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace;letter-spacing:.08em;text-transform:uppercase;outline:none}
.egg-arcade::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 2px,transparent 2px 4px)}
.egg-arcade p{margin:0 0 .6rem}
.egg-arcade-lives{color:#ff0;font-size:1.6rem;text-shadow:0 0 10px #ff0}
.egg-arcade-title{color:#0ff;font-size:1.25rem;text-shadow:0 0 8px #0ff}
.egg-arcade-sub,.egg-arcade-hint{color:#aab;font-size:.75rem}
.egg-arcade-table{margin:.5rem auto 1.25rem;border-collapse:collapse}
.egg-arcade-table td{padding:.2rem .9rem;text-align:left}
.egg-arcade-table tr:first-child td{color:#ff0}
.egg-arcade-table td:last-child{text-align:right;color:#0f0}
.egg-arcade-coin{margin:0 0 .6rem;padding:.4rem .8rem;border:0;background:none;color:#f0f;font:inherit;letter-spacing:inherit;cursor:pointer;animation:egg-blink 1s steps(1) infinite}
.egg-arcade-coin:focus-visible{outline:2px solid #0ff;outline-offset:2px}
.egg-still .egg-arcade-coin{animation:none}
@keyframes egg-blink{50%{opacity:0}}
.egg-console{display:flex;flex-direction:column;width:min(720px,100%);height:min(420px,80vh);background:rgba(43,46,40,.97);border:1px solid #6b6e64;border-radius:4px;
  color:#dcdcd2;font:13px/1.45 ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace;box-shadow:0 8px 30px rgba(0,0,0,.5)}
.egg-console-title{padding:.35rem .6rem;border-bottom:1px solid #6b6e64;color:#fff;font-weight:700;font-family:Verdana,Tahoma,sans-serif;font-size:12px}
.egg-console-out{flex:1;overflow-y:auto;margin:.5rem;padding:.4rem .5rem;background:#1e201b;border:1px solid #4a4c45;white-space:pre-wrap;word-break:break-word}
.egg-console-row{display:flex;gap:.5rem;padding:0 .5rem .5rem}
.egg-console-in{flex:1;min-width:0;padding:.25rem .4rem;background:#1e201b;border:1px solid #6b6e64;color:#fff;font:inherit}
.egg-console-in:focus{outline:1px solid #c4b550}
.egg-console-submit{padding:.2rem .8rem;background:#4c5044;border:1px solid #7d8174;color:#fff;font:12px Verdana,Tahoma,sans-serif;cursor:pointer}
.egg-hud{position:fixed;inset:auto 0 0 0;z-index:1990;display:flex;justify-content:space-between;padding:0 1.25rem 1.1rem;pointer-events:none}
.egg-hud-box{display:flex;align-items:baseline;gap:.7rem;padding:.35rem .9rem .3rem;border-radius:9px;background:rgba(0,0,0,.42);color:#ffd23c;
  font-family:Verdana,Tahoma,sans-serif;font-weight:700;text-shadow:0 0 6px rgba(255,190,40,.55)}
.egg-hud-label{font-size:.8rem;letter-spacing:.06em}
.egg-hud-value{font-size:2.2rem;line-height:1}
.egg-noclip-tag{position:fixed;top:.75rem;left:50%;transform:translateX(-50%);z-index:1990;padding:.3rem .8rem;border-radius:6px;background:rgba(0,0,0,.6);
  color:#ffd23c;font:700 13px Verdana,Tahoma,sans-serif;letter-spacing:.04em;pointer-events:none}
html.egg-noclip body *{pointer-events:none;user-select:none;outline:1px solid rgba(255,140,0,.6);outline-offset:-1px}
html.egg-noclip body * *{outline-color:rgba(0,200,255,.6)}
html.egg-noclip body * * *{outline-color:rgba(255,60,200,.6)}
html.egg-noclip body * * * *{outline-color:rgba(120,230,60,.6)}
html.egg-noclip body * * * * *{outline-color:rgba(255,230,0,.6)}
html.egg-noclip body * * * * * *{outline-color:rgba(160,120,255,.6)}
html.egg-noclip .egg-overlay,html.egg-noclip .egg-overlay *{pointer-events:auto;user-select:auto;outline:revert}
html.egg-noclip .egg-hud,html.egg-noclip .egg-hud *,html.egg-noclip .egg-noclip-tag{outline:none}
.egg-echo{color:#8f9386}.egg-dim{color:#8f9386}.egg-err{color:#ff8a7a}.egg-breen{color:#c4b550;font-style:italic}
`;
  document.head.appendChild(style);

  // Typing into a field shouldn't trigger anything; radios, sliders and buttons still let codes through.
  function isTextEntry(t) {
    if (!t || !t.tagName) return false;
    if (t.isContentEditable || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return true;
    if (t.closest && t.closest("ninja-keys")) return true;
    if (t.tagName !== "INPUT") return false;
    return !/^(radio|checkbox|range|button|submit|reset|color|file|image)$/.test(t.type);
  }

  // ---- shared overlay ----
  let overlay = null,
    opener = null,
    onClose = null;
  function closeOverlay() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    if (onClose) onClose();
    onClose = null;
    if (opener && opener.focus) opener.focus();
  }
  function openOverlay(label, panel, focusTarget, cleanup) {
    closeOverlay();
    opener = document.activeElement;
    overlay = document.createElement("div");
    overlay.className = "egg-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", label);
    overlay.appendChild(panel);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOverlay();
    });
    document.body.appendChild(overlay);
    onClose = cleanup || null;
    (focusTarget || panel).focus();
  }
  function node(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  // ---- Konami code: up up down down left right left right B A ----
  const SEQUENCE = ["U", "U", "D", "D", "L", "R", "L", "R", "B", "A"];
  const TOKENS = { arrowup: ["U"], w: ["U"], arrowdown: ["D"], s: ["D"], arrowleft: ["L"], arrowright: ["R"], d: ["R"], b: ["B"], a: ["L", "A"] };
  let recent = [];
  function konamiStep(key) {
    const tokens = TOKENS[key];
    if (!tokens) {
      recent = [];
      return false;
    }
    recent = recent.concat([tokens]).slice(-SEQUENCE.length);
    return recent.length === SEQUENCE.length && SEQUENCE.every((t, i) => recent[i].includes(t));
  }

  function openArcade() {
    const panel = node("div", "egg-arcade" + (reduceMotion ? " egg-still" : ""));
    panel.tabIndex = -1;
    panel.append(
      node("p", "egg-arcade-lives", "+30 LIVES"),
      node("p", "egg-arcade-title", "HIGH SCORES"),
      node("p", "egg-arcade-sub", "TOP PLAYERS")
    );
    const table = node("table", "egg-arcade-table");
    [
      ["1ST", "GMB", "314159"],
      ["2ND", "ACE", "271828"],
      ["3RD", "YOU", "000000"],
    ].forEach((row) => {
      const tr = node("tr");
      row.forEach((cell) => tr.appendChild(node("td", "", cell)));
      table.appendChild(tr);
    });
    const close = node("button", "egg-arcade-coin", "INSERT COIN TO CONTINUE");
    close.type = "button";
    close.addEventListener("click", closeOverlay);
    panel.append(table, close, node("p", "egg-arcade-hint", "ESC TO QUIT"));
    openOverlay("High scores", panel, close);
  }

  // ---- Source-style console ----
  const cheats = { sv: false, god: false, noclip: false };
  const history = [];
  let consoleOut = null;

  const mapName = (url) => url.replace(/\/+$/, "").split("/").pop() || "about";
  const maps = mapUrls.map((url) => ({ name: mapName(url), url }));

  function print(text, cls) {
    if (!consoleOut) return;
    consoleOut.appendChild(node("div", cls || "", text));
    consoleOut.scrollTop = consoleOut.scrollHeight;
  }
  function needCheats(name) {
    if (cheats.sv) return true;
    print("Can't use cheat command " + name + " in multiplayer, unless the server has sv_cheats set to 1.", "egg-err");
    print("Freeman, you fool!", "egg-breen"); // also the caption for anyone with the sound off
    play("fool");
    return false;
  }
  // god: a HUD with infinite health and ammo
  let hud = null;
  function setGod(on) {
    cheats.god = on;
    play("dryfire");
    print("godmode " + (on ? "ON" : "OFF"));
    if (!on) {
      if (hud) hud.remove();
      hud = null;
      return;
    }
    hud = node("div", "egg-hud");
    hud.setAttribute("aria-hidden", "true");
    const box = (cls, label, value) => {
      const b = node("div", "egg-hud-box " + cls);
      b.append(node("span", "egg-hud-label", label), node("span", "egg-hud-value", value));
      return b;
    };
    hud.append(box("egg-hud-health", "HEALTH", "\u221e"), box("egg-hud-ammo", "AMMO", "\u221e | \u221e"));
    document.body.appendChild(hud);
  }

  // noclip: the page's boxes show as level geometry, and nothing on it can be clicked, focused or selected.
  // The console stays usable, so noclip (or sv_cheats 0) turns it back off; reloading the page does too.
  let noclipTag = null;
  function setNoclip(on) {
    cheats.noclip = on;
    print("noclip " + (on ? "ON" : "OFF"));
    document.documentElement.classList.toggle("egg-noclip", on);
    for (const child of Array.from(document.body.children)) {
      if (child === overlay || child === hud || child === noclipTag || child.tagName === "SCRIPT" || child.tagName === "STYLE") continue;
      if (on) {
        if (!child.inert) {
          child.inert = true;
          child.dataset.eggInert = "";
        }
      } else if ("eggInert" in child.dataset) {
        child.inert = false;
        delete child.dataset.eggInert;
      }
    }
    if (on) {
      noclipTag = node("div", "egg-noclip-tag", "NOCLIP \u00b7 press ` and type noclip to land");
      noclipTag.setAttribute("role", "status");
      document.body.appendChild(noclipTag);
    } else if (noclipTag) {
      noclipTag.remove();
      noclipTag = null;
    }
  }

  const COMMANDS = {
    help: () => print("Commands: " + Object.keys(COMMANDS).sort().join(", ")),
    cmdlist: () => COMMANDS.help(),
    clear: () => consoleOut.replaceChildren(),
    echo: (args) => print(args.join(" ")),
    sv_cheats: (args) => {
      if (!args.length) return print('"sv_cheats" = "' + (cheats.sv ? 1 : 0) + '" ( def. "0" )');
      cheats.sv = args[0] !== "0";
      print("Server cvar 'sv_cheats' changed to " + (cheats.sv ? 1 : 0));
      // as in Source, turning cheats off ends the cheats in effect
      if (!cheats.sv) {
        if (cheats.god) setGod(false);
        if (cheats.noclip) setNoclip(false);
      }
    },
    god: () => {
      if (!needCheats("god")) return;
      setGod(!cheats.god);
    },
    noclip: () => {
      if (!needCheats("noclip")) return;
      setNoclip(!cheats.noclip);
    },
    impulse: (args) => {
      if (args[0] !== "101") return print('Unknown impulse "' + (args[0] || "") + '"');
      if (!needCheats("impulse")) return;
      const items = document.querySelectorAll(".abstract.hidden:not(.open), .bibtex.hidden:not(.open)");
      items.forEach((item) => item.classList.add("open"));
      if (items.length) print("Picked up " + items.length + " items: every abstract and BibTeX entry on this page.");
      else print("Nothing to pick up here. Try: map publications");
    },
    map: (args) => {
      if (!args.length) return print("Maps: " + maps.map((m) => m.name).join(", "));
      const found = maps.find((m) => m.name === args[0].toLowerCase());
      if (!found) return print("map load failed: " + args[0] + " not found or invalid", "egg-err");
      print("Loading " + found.name + "...");
      window.location.href = base + found.url;
    },
    quit: () => closeOverlay(),
    exit: () => closeOverlay(),
  };
  function run(line) {
    const parts = line.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return;
    print("] " + line.trim(), "egg-echo");
    const cmd = COMMANDS[parts[0].toLowerCase()];
    if (cmd) cmd(parts.slice(1));
    else print('Unknown command "' + parts[0] + '"', "egg-err");
  }

  function openConsole() {
    loadSounds();
    const panel = node("div", "egg-console");
    panel.append(node("div", "egg-console-title", "Console"));
    consoleOut = node("div", "egg-console-out");
    consoleOut.setAttribute("aria-live", "polite");
    const form = node("div", "egg-console-row");
    const input = node("input", "egg-console-in");
    input.type = "text";
    input.spellcheck = false;
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Console command");
    const submit = node("button", "egg-console-submit", "Submit");
    submit.type = "button";
    let back = history.length;
    const send = () => {
      if (input.value.trim()) {
        history.push(input.value);
        run(input.value);
      }
      back = history.length;
      input.value = "";
    };
    submit.addEventListener("click", send);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") send();
      else if (e.key === "`" || e.key === "~") {
        e.preventDefault();
        closeOverlay();
      } else if (e.key === "ArrowUp" && back > 0) input.value = history[--back];
      else if (e.key === "ArrowDown") {
        if (back < history.length - 1) input.value = history[++back];
        else {
          back = history.length;
          input.value = "";
        }
      } else return;
      e.stopPropagation();
    });
    form.append(input, submit);
    panel.append(consoleOut, form);
    openOverlay("Developer console", panel, input, () => (consoleOut = null));
    print("Type help for a list of commands.", "egg-dim");
  }

  // ---- keys ----
  document.addEventListener("keydown", (e) => {
    if (overlay) {
      if (e.key === "Escape") closeOverlay();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || !e.key || isTextEntry(e.target)) return;
    if (e.key === "`" || e.key === "~") {
      e.preventDefault();
      recent = [];
      openConsole();
      return;
    }
    if (konamiStep(e.key.toLowerCase())) {
      recent = [];
      openArcade();
    }
  });
})();
