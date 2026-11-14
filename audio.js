const sfx = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = AC ? new AC() : null;
  const buffers = new Map();
  const loading = new Map();
  let master = null;
  let foundSrc = null;
  let foundCancelled = false;

  if (ctx) {
    master = ctx.createGain();
    master.gain.value = VOLUME.master;
    master.connect(ctx.destination);
    for (const t of ["pointerdown", "keydown", "touchstart"]) {
      addEventListener(t, () => { if (ctx.state === "suspended") ctx.resume(); }, { passive: true });
    }
  }

  function load(url) {
    if (!ctx || !url) return Promise.resolve(null);
    if (!loading.has(url)) {
      loading.set(url, fetch(url)
        .then(r => (r.ok ? r.arrayBuffer() : Promise.reject()))
        .then(ab => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
        .then(b => { buffers.set(url, b); return b; })
        .catch(() => null));
    }
    return loading.get(url);
  }

  [...SOUNDS.letterIn, ...SOUNDS.letterOut, SOUNDS.shock, SOUNDS.found, SOUNDS.lost].forEach(load);

  const running = () => ctx && ctx.state === "running";
  const pick = list => buffers.get(list[(Math.random() * list.length) | 0]);
  const jitter = () => 1 + (Math.random() * 2 - 1) * PITCH_VARIATION;

  function play(buf, when, vol, rate = 1) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(g);
    g.connect(master);
    src.start(when);
  }

  function loopFade(buf, start, fadeMs, vol) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + fadeMs / 1000);
    src.connect(g);
    g.connect(master);
    src.start(start);
    return src;
  }

  return {
    unlock() {
      return ctx ? ctx.resume().catch(() => {}) : Promise.resolve();
    },
    found() {
      foundCancelled = false;
      load(SOUNDS.found).then(buf => {
        if (!buf || !running() || foundCancelled) return;
        foundSrc = loopFade(buf, ctx.currentTime, FOUND_FADE, VOLUME.found);
      });
    },
    letter(visible, delayMs) {
      if (!running() || document.documentElement.classList.contains("white")) return;
      const buf = pick(visible ? SOUNDS.letterIn : SOUNDS.letterOut);
      if (buf) play(buf, ctx.currentTime + delayMs / 1000, VOLUME.letter * (0.7 + Math.random() * 0.3), jitter());
    },
    shock() {
      foundCancelled = true;
      if (foundSrc) { foundSrc.stop(); foundSrc = null; }
      if (!running()) return;
      const w = buffers.get(SOUNDS.shock);
      if (w) play(w, ctx.currentTime, VOLUME.shock);
    },
    lost() {
      if (!running()) return;
      const t = ctx.currentTime;
      load(SOUNDS.lost).then(buf => {
        if (!buf || !running()) return;
        loopFade(buf, Math.max(t + LOST_DELAY / 1000, ctx.currentTime), LOST_FADE, VOLUME.lost);
      });
    },
  };
})();