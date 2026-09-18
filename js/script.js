// Product filter tabs
(function () {
  var buttons = document.querySelectorAll("[data-filter]");
  var cards = document.querySelectorAll("[data-category]");

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.getAttribute("data-filter");
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      cards.forEach(function (card) {
        card.hidden = filter !== "all" && card.getAttribute("data-category") !== filter;
      });
    });
  });
})();

// Email forms
// TODO: replace the placeholder below with a real submit (fetch to your waitlist/newsletter endpoint).
// Until then this only shows a confirmation and does NOT store the address.
(function () {
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = form.parentElement.querySelector("[data-status]");
      if (status) {
        status.textContent = "Confirmed ✓ We'll be in touch.";
        setTimeout(function () {
          status.textContent = "";
        }, 4000);
      }
      form.reset();
    });
  });
})();

// ROI calculator: cost of repetitive tasks
(function () {
  var form = document.getElementById("calc-form");
  if (!form) return;

  var gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
  var DAYS_PER_WEEK = 5;
  var WEEKS_PER_YEAR = 46;
  var OS_SETUP = 2000;
  var OS_MONTHLY = 299;
  var $ = function (id) { return document.getElementById(id); };
  var num = function (el, max) {
    var v = parseFloat(el.value);
    if (!isFinite(v) || v < 0) v = 0;
    return max ? Math.min(v, max) : v;
  };
  var trim = function (n) { return String(Math.round(n * 10) / 10); };

  function update() {
    var people = num($("calc-people"));
    var wage = num($("calc-wage"));
    var hours = num($("calc-hours"), 12);

    var hoursWeek = people * hours * DAYS_PER_WEEK;
    var week = hoursWeek * wage;
    var year = week * WEEKS_PER_YEAR;
    var month = year / 12;

    $("calc-month").textContent = gbp.format(month);
    $("calc-week").textContent = gbp.format(week);
    $("calc-year").textContent = gbp.format(year);
    $("calc-hoursweek").textContent = trim(hoursWeek);
    $("calc-note").textContent =
      "Every 10% of that time you get back is worth " + gbp.format(year * 0.1) + " a year. " +
      "Operating Systems start at " + gbp.format(OS_SETUP) + " plus " + gbp.format(OS_MONTHLY) + "/month.";
  }

  form.addEventListener("input", update);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  update();
})();

// Demo window tabs
(function () {
  var tabs = document.querySelectorAll(".mac [data-tab]");
  var panels = document.querySelectorAll(".mac [data-panel]");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-tab");
      tabs.forEach(function (t) { t.setAttribute("aria-pressed", String(t === tab)); });
      panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== target; });
    });
  });
})();

// Dynamic island: the pill morphs open into the founder letter
(function () {
  var island = document.querySelector("[data-island]");
  if (!island) return;
  var pill = island.querySelector(".island__pill");
  var bar = island.querySelector(".island__bar");
  var panel = island.querySelector(".island__panel");
  var close = island.querySelector(".island__close");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setOpen(open, moveFocus) {
    island.classList.toggle("is-open", open);
    pill.setAttribute("aria-expanded", String(open));
    if (open) {
      bar.setAttribute("inert", "");
      panel.removeAttribute("inert");
    } else {
      panel.setAttribute("inert", "");
      bar.removeAttribute("inert");
    }
    if (moveFocus) (open ? close : pill).focus({ preventScroll: true });
  }

  setOpen(false, false);

  // only steal focus for keyboard users, so mouse clicks don't show a focus ring
  pill.addEventListener("click", function (e) {
    setOpen(true, e.detail === 0);
    // bring the whole letter into view once it has grown
    setTimeout(function () {
      island.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    }, reduce ? 0 : 700);
  });
  close.addEventListener("click", function (e) { setOpen(false, e.detail === 0); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && island.classList.contains("is-open")) setOpen(false, true);
  });
})();

// Retro keyboard click sound on every button (synthesised, so no audio files to load)
(function () {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  var ctx = null;
  var noise = null;

  function setup() {
    if (ctx) return true;
    try {
      ctx = new AudioCtx();
    } catch (e) {
      return false;
    }
    // 60ms of white noise, reused for every click
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
    var data = noise.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return true;
  }

  // "down" is the deeper clack of the key bottoming out, "up" is the lighter release
  function click(kind) {
    if (!setup()) return;
    if (ctx.state === "suspended") ctx.resume();
    var t = ctx.currentTime;
    var down = kind === "down";
    var vary = 0.92 + Math.random() * 0.16;

    var src = ctx.createBufferSource();
    src.buffer = noise;
    var band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = (down ? 2600 : 3600) * vary;
    band.Q.value = 1.1;
    var nGain = ctx.createGain();
    nGain.gain.setValueAtTime(down ? 0.55 : 0.22, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + (down ? 0.035 : 0.022));
    src.connect(band);
    band.connect(nGain);
    nGain.connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.06);

    var osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime((down ? 190 : 260) * vary, t);
    osc.frequency.exponentialRampToValueAtTime(down ? 70 : 120, t + 0.04);
    var oGain = ctx.createGain();
    oGain.gain.setValueAtTime(down ? 0.11 : 0.04, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    osc.connect(oGain);
    oGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  function isButton(e) {
    var el = e.target && e.target.closest ? e.target.closest("button, .btn, summary, [role='button']") : null;
    return el && !el.disabled && el.getAttribute("aria-disabled") !== "true";
  }

  // mouse and touch: clack on press, release on lift
  document.addEventListener("pointerdown", function (e) { if (isButton(e)) click("down"); });
  document.addEventListener("pointerup", function (e) { if (isButton(e)) click("up"); });
  // keyboard activation (Enter/Space) fires a click with no pointer, so sound it here
  document.addEventListener("click", function (e) {
    if (e.detail === 0 && isButton(e)) click("down");
  });
})();

// Footer wordmark: pixels light up under the cursor, only where the letters are
(function () {
  var mark = document.querySelector(".foot-mark");
  if (!mark || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var label = mark.querySelector("span");
  var node = label && label.firstChild;
  if (!node) return;

  var canvas = document.createElement("canvas");
  canvas.className = "foot-mark__pixels";
  mark.appendChild(canvas);
  var g = canvas.getContext("2d");

  var cell, cols, rows, w, h, dpr;
  var mask, energy, decay, tint;
  var accent = "#002aff", ink = "#000000";
  var running = false, last = 0;

  // Work out which grid cells sit inside a letter by drawing the same text off-screen
  function build() {
    var box = mark.getBoundingClientRect();
    w = Math.round(box.width);
    h = Math.round(box.height);
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    var cs = getComputedStyle(label);
    var size = parseFloat(cs.fontSize);
    accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || accent;
    ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || ink;
    cell = Math.max(5, Math.round(size / 24));
    cols = Math.ceil(w / cell);
    rows = Math.ceil(h / cell);

    var off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    var o = off.getContext("2d", { willReadFrequently: true });
    o.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    o.textBaseline = "alphabetic";
    o.fillStyle = "#000";

    // per-letter positions come from the real layout, so spacing and kerning match exactly
    var range = document.createRange();
    var text = node.textContent;
    for (var i = 0; i < text.length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      var r = range.getBoundingClientRect();
      var ascent = o.measureText(text[i]).fontBoundingBoxAscent || size * 0.9;
      o.fillText(text[i], r.left - box.left, r.top - box.top + ascent);
    }

    var px = o.getImageData(0, 0, w, h).data;
    mask = new Uint8Array(cols * rows);
    energy = new Float32Array(cols * rows);
    decay = new Float32Array(cols * rows);
    tint = new Uint8Array(cols * rows);
    for (var cy = 0; cy < rows; cy++) {
      for (var cx = 0; cx < cols; cx++) {
        var sx = Math.min(w - 1, Math.floor(cx * cell + cell / 2));
        var sy = Math.min(h - 1, Math.floor(cy * cell + cell / 2));
        var idx = cy * cols + cx;
        mask[idx] = px[(sy * w + sx) * 4 + 3] > 128 ? 1 : 0;
        tint[idx] = Math.random() < 0.18 ? 1 : 0;
      }
    }
  }

  function frame(now) {
    var dt = Math.min(now - last, 50);
    last = now;
    g.clearRect(0, 0, w, h);
    var alive = false;
    for (var i = 0; i < energy.length; i++) {
      var e = energy[i];
      if (e <= 0) continue;
      e -= dt * decay[i];
      if (e <= 0) { energy[i] = 0; continue; }
      energy[i] = e;
      alive = true;
      // stepped fade keeps it looking like pixels rather than a soft glow
      g.globalAlpha = e > 0.66 ? 1 : e > 0.33 ? 0.6 : 0.3;
      g.fillStyle = tint[i] ? ink : accent;
      g.fillRect((i % cols) * cell, Math.floor(i / cols) * cell, cell - 1, cell - 1);
    }
    g.globalAlpha = 1;
    if (alive) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  function spark(x, y) {
    if (!mask) return;
    var radius = cell * 4.5;
    var c0 = Math.max(0, Math.floor((x - radius) / cell));
    var c1 = Math.min(cols - 1, Math.floor((x + radius) / cell));
    var r0 = Math.max(0, Math.floor((y - radius) / cell));
    var r1 = Math.min(rows - 1, Math.floor((y + radius) / cell));
    for (var cy = r0; cy <= r1; cy++) {
      for (var cx = c0; cx <= c1; cx++) {
        var idx = cy * cols + cx;
        if (!mask[idx]) continue;
        var dx = cx * cell + cell / 2 - x;
        var dy = cy * cell + cell / 2 - y;
        var d = Math.sqrt(dx * dx + dy * dy) / radius;
        if (d > 1 || Math.random() > 1 - d * 0.7) continue;
        energy[idx] = 1;
        decay[idx] = 1 / (350 + Math.random() * 650); // each pixel fades on its own clock
      }
    }
    if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
  }

  mark.addEventListener("pointermove", function (e) {
    var box = mark.getBoundingClientRect();
    spark(e.clientX - box.left, e.clientY - box.top);
  });

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 150);
  });
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(build);
})();
