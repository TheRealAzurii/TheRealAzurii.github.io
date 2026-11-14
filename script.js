const lsGet = () => { try { return localStorage.getItem("sent") === "1"; } catch { return false; } };
  const lsSet = () => { try { localStorage.setItem("sent", "1"); } catch {} };
  async function api(path, opts) {
    try {
      const r = await fetch(API + path, opts);
      return { status: r.status, json: await r.json().catch(() => ({})) };
    } catch { return { status: 0, json: {} }; }
  }

  async function notYet(clicked = false) {
    cutToWhite();
    if (!clicked) {
      await new Promise(r => addEventListener("pointerdown", r, { once: true }));
      await sfx.unlock();
    }
    document.title = TITLES.soon;
    await say("Not yet", NOT_YET_LIFE);
    sfx.lost();
  }

  async function run() {
    const st = await api("/status");
    if (lsGet() || st.json.used) return notYet();

    await new Promise(r => addEventListener("pointerdown", r, { once: true }));
    await sfx.unlock();
    document.title = TITLES.welcome;
    sfx.found();
    for (const m of INTRO) { await say(m); await sleep(GAP); }

    await say(QUESTION, Infinity);
    await sleep(FADE_TOTAL);
    while (true) {
      const text = await cmd.ask();
      const r = await api("/send", { method: "POST", headers: { "Content-Type": "text/plain" }, body: text });
      if (r.status === 200) { lsSet(); break; }
      if (r.status === 409) { lsSet(); return notYet(true); }
    }

    sfx.shock();
    cutToWhite();
    document.title = TITLES.soon;
    await sleep(GAP);
    for (const [i, m] of OUTRO.entries()) {
      await say(m);
      if (i === OUTRO.length - 1) sfx.lost();
      await sleep(GAP);
    }
  }
  const FADE_SPREAD = 600;
  const GLITCH_MS   = 500;
  const FADE_TOTAL  = FADE_SPREAD + GLITCH_MS;
  const MIN_SCALE = 0.7, MAX_SCALE = 1.3;
  const MAX_SHIFT = 0.12;
  const RADIUS_EM = 3.6;
  const SHAKE_EM  = 0.09;
  const PUSH_EM   = 0.14;
  const WAVE_EM     = 0.018;
  const WAVE_PERIOD = 5;
  const WAVE_SPREAD = 0.45;
  const TWITCH_EM  = 0.07;
  const TWITCH_MS  = 240;
  const TWITCH_MIN = 500, TWITCH_MAX = 2000;

  const el = document.getElementById("t");
  const sr = document.getElementById("sr");
  const letters = [];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FAR = -99999;
  let R = 0, fs = 0, mx = FAR, my = FAR;
  let twitcher = null, twStart = 0, nextTwitch = 0;
  function build(text) {
    let s = 1;
    for (const c of text) s = (s * 31 + c.charCodeAt(0)) % 2147483646;
    s += 1;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;

    el.textContent = "";
    letters.length = 0;
    twitcher = null;
    text.split(" ").forEach(word => {
      const w = document.createElement("span");
      w.className = "w";
      [...word].forEach((ch, ci) => {
        const l = document.createElement("span");
        l.className = "l";
        l.textContent = ch;
        const base = ci === 0 ? 1.1 : 1;
        const scale = base * (MIN_SCALE + rnd() * (MAX_SCALE - MIN_SCALE));
        const shift = (rnd() * 2 - 1) * MAX_SHIFT;
        l.style.fontSize = scale.toFixed(2) + "em";
        const rest = "translateY(" + shift.toFixed(3) + "em)";
        l.style.transform = rest;
        w.appendChild(l);
        letters.push({ el: l, rest, cx: 0, cy: 0, phase: 0 });
      });
      el.appendChild(w);
      el.appendChild(document.createTextNode(" "));
    });
    measure();
  }

  function measure() {
    letters.forEach(o => { o.el.style.transform = o.rest; });
    fs = parseFloat(getComputedStyle(el).fontSize);
    R = fs * RADIUS_EM;
    letters.forEach(o => {
      const r = o.el.getBoundingClientRect();
      o.cx = r.left + r.width / 2 + scrollX;
      o.cy = r.top + r.height / 2 + scrollY;
      o.phase = (o.cx / fs) * WAVE_SPREAD;
    });
  }
  function fade(visible) {
    const final = visible ? 1 : 0;
    letters.forEach(o => {
      const delay = Math.random() * FADE_SPREAD;
      sfx.letter(visible, delay);
      let frames;
      if (reduce) {
        frames = [{ opacity: 1 - final }, { opacity: final }];
      } else {
        const n = 4 + ((Math.random() * 4) | 0);
        const times = Array.from({ length: n }, () => Math.random()).sort((a, b) => a - b);
        frames = [{ offset: 0, opacity: 1 - final, translate: "0 0", easing: "steps(1)" }];
        times.forEach((tm, i) => {
          const last = i === n - 1;
          const on = last ? final : (Math.random() < 0.5 ? 1 : 0);
          const jolt = !last && Math.random() < 0.6 ? (Math.random() * 2 - 1) * 0.14 : 0;
          frames.push({
            offset: Math.min(0.98, Math.max(0.02, tm)),
            opacity: on,
            translate: jolt.toFixed(3) + "em 0",
            easing: "steps(1)",
          });
        });
        frames.push({ offset: 1, opacity: final, translate: "0 0" });
      }
      const anim = o.el.animate(frames, {
        duration: reduce ? 600 : GLITCH_MS,
        delay,
        easing: reduce ? "ease" : "linear",
      });
      anim.onfinish = () => { o.el.style.opacity = final; anim.cancel(); };
    });
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const nextPaint = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  async function say(text, life = LIFE) {
    build(text);
    await nextPaint();
    fade(true);
    sr.textContent = text;
    if (life === Infinity) return;
    await sleep(life - FADE_TOTAL);
    fade(false);
    sr.textContent = "";
    await sleep(FADE_TOTAL);
    el.textContent = "";
    letters.length = 0;
  }
  function cutToWhite() {
    document.documentElement.classList.add("white");
    cmd.close(true);
    el.textContent = "";
    letters.length = 0;
    twitcher = null;
    sr.textContent = "";
  }
  function frame(now) {
    const t = now / 1000;
    const k0 = (Math.PI * 2) / WAVE_PERIOD;

    if (letters.length && now >= nextTwitch) {
      const alive = letters.filter(o => o.el.style.opacity !== "0");
      if (alive.length) twitcher = alive[(Math.random() * alive.length) | 0];
      twStart = now;
      nextTwitch = now + TWITCH_MIN + Math.random() * (TWITCH_MAX - TWITCH_MIN);
    }
    const twLeft = 1 - (now - twStart) / TWITCH_MS;

    for (const o of letters) {
      let x = 0;
      let y = Math.sin(t * k0 - o.phase) * fs * WAVE_EM;

      if (o === twitcher && twLeft > 0) {
        const a = fs * TWITCH_EM * twLeft;
        x += (Math.random() * 2 - 1) * a;
        y += (Math.random() * 2 - 1) * a;
      }

      const dx = mx - o.cx, dy = my - o.cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < R * R) {
        const d = Math.sqrt(d2);
        const k = 1 - d / R;
        const a = fs * SHAKE_EM * k * k;
        const p = fs * PUSH_EM * k;
        const ux = d ? -dx / d : 0;
        const uy = d ? -dy / d : 0;
        x += (Math.random() * 2 - 1) * a + ux * p;
        y += (Math.random() * 2 - 1) * a + uy * p;
      }

      o.el.style.transform = "translate(" + x.toFixed(2) + "px," + y.toFixed(2) + "px) " + o.rest;
    }
    requestAnimationFrame(frame);
  }
  const PROMPT = "C:\\>";
  const term = document.getElementById("term");
  const input = document.getElementById("in");
  const elB = document.getElementById("b");
  const elC = document.getElementById("c");
  const elA = document.getElementById("a");
  document.getElementById("prompt").textContent = PROMPT;
  let isOpen = false, pending = null;

  const cmd = {
    open() {
      isOpen = true;
      term.classList.remove("cut");
      term.classList.add("on");
      input.disabled = false;
      input.focus({ preventScroll: true });
      render();
    },
    close(instant = false) {
      isOpen = false;
      pending = null;
      input.value = "";
      input.disabled = true;
      render();
      if (instant) term.classList.add("cut");
      term.classList.remove("on");
    },
    ask() {
      return new Promise(resolve => { pending = resolve; cmd.open(); });
    },
  };
  function render() {
    if (input.selectionStart !== input.selectionEnd) input.setSelectionRange(input.selectionEnd, input.selectionEnd);
    const v = input.value, p = input.selectionStart ?? v.length;
    elB.textContent = v.slice(0, p);
    elC.textContent = v.slice(p, p + 1) || "\u00a0";
    elA.textContent = v.slice(p + 1);
    elC.style.animation = "none"; void elC.offsetWidth; elC.style.animation = "";
  }

  function submit() {
    if (!isOpen) return;
    const text = input.value.trim();
    input.value = "";
    render();
    if (text && pending) { const done = pending; pending = null; done(text); }
  }

  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); submit(); }
    else requestAnimationFrame(render);
  });
  for (const type of ["input", "keyup", "click", "focus", "select"]) input.addEventListener(type, render);
  document.addEventListener("selectionchange", () => { if (document.activeElement === input) render(); });
  addEventListener("mousedown", e => { e.preventDefault(); if (isOpen) input.focus({ preventScroll: true }); });
  addEventListener("click", () => { if (isOpen) input.focus({ preventScroll: true }); });
  render();
  addEventListener("contextmenu", e => e.preventDefault());
  addEventListener("dragstart", e => e.preventDefault());
  addEventListener("selectstart", e => { if (e.target !== input) e.preventDefault(); });

  if (!reduce) {
    addEventListener("pointermove", e => { mx = e.clientX + scrollX; my = e.clientY + scrollY; }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => { mx = my = FAR; });
    addEventListener("pointercancel", () => { mx = my = FAR; });
    requestAnimationFrame(frame);
  }
  addEventListener("resize", measure);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { measure(); run(); });