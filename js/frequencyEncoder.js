const input = document.getElementById('hidden-input');
const newMsg = document.getElementById('new-message');
const addBtn = document.getElementById('add-message');
const msgList = document.getElementById('messages-list');
const sheet = document.getElementById('encoding-sheet');
const copyBtn = document.getElementById('copy-text');

const frequencyDial = document.getElementById('frequency-dial');
const dialWheel = document.getElementById('dial-wheel');

let messages = [];
let sheetData = [];
let cursorIndex = 0;

const numberWidth = 38;
let dialWidth = 0;
let dialCenterOffset = 0;
const maxFrequency = 100;

let currentFrequency = 1;
let currentDialValue = 1;
let validFrequencies = [];
let isDragging = false;
let startX = 0;
let startTranslateX = 0;
let lastMouseX = 0;
let lastMouseTime = 0;
let currentVelocityX = 0;
let animationFrameId = null;


function ensureLength(len) {
  while (sheetData.length < len) sheetData.push({ char: '_', prefilled: false, spacer: false });
}


function ensureIndex(idx) {
  if (idx >= sheetData.length) ensureLength(idx + 1);
}


function lastPrefilledIndex() {
  for (let i = sheetData.length - 1; i >= 0; i--) if (sheetData[i].prefilled) return i;
  return -1;
}


function tryEncodeAll(msgs, commit = false) {
  const temp = [];
  const ensureT = l => {
    while (temp.length < l) temp.push({ char: '_', prefilled: false });
  };
  for (const m of msgs) {
    let pos = Number(m.frequency) - 1;
    if (!Number.isFinite(pos) || pos < 0) return { ok: false };
    const clean = String(m.text).replace(/\s+/g, '');
    for (const ch of clean) {
      ensureT(pos + 1);
      if (temp[pos].prefilled && temp[pos].char !== ch.toUpperCase()) return { ok: false };
      temp[pos] = { char: ch.toUpperCase(), prefilled: true };
      pos += Number(m.frequency);
    }
  }
  if (commit) {
    sheetData = temp.map(t => ({ char: t.char ?? '_', prefilled: !!t.prefilled, spacer: false }));
  }
  return { ok: true, sheet: temp };
}


function renderSheet() {
  sheet.innerHTML = '';
  ensureLength(sheetData.length);
  const frag = document.createDocumentFragment();
  sheetData.forEach((cell, i) => {
    const span = document.createElement('span');
    span.className = 'cell';
    span.dataset.index = i;
    if (cell.prefilled) {
      span.classList.add('prefilled');
      span.textContent = cell.char;
    } else if (cell.spacer) {
      span.classList.add('spacer');
      span.textContent = '·';
      span.title = 'Inserted space';
    } else {
      span.classList.add('editable');
      span.textContent = cell.char === '_' ? '_' : cell.char;
      if (cell.char === '_') span.classList.add('empty');
    }
    frag.appendChild(span);
  });
  sheet.appendChild(frag);
  highlightCursor();
  updateDisplayFromSheet();
}


function highlightCursor() {
  document.querySelectorAll('.cell').forEach(el => el.classList.remove('cursor'));
  ensureIndex(cursorIndex);
  const el = sheet.querySelector(`.cell[data-index="${cursorIndex}"]`);
  if (el) el.classList.add('cursor');
}


function moveCursor(step) {
  let newI = cursorIndex + step;
  if (newI < 0) newI = 0;
  if (newI >= sheetData.length) ensureLength(newI + 1);
  cursorIndex = Math.max(0, newI);
  renderSheet();
}


function populateDial(max) {
  dialWheel.innerHTML = '';
  for (let i = 1; i <= max; i++) {
    const div = document.createElement('div');
    div.className = 'dial-number';
    div.textContent = i;
    div.dataset.value = i;
    dialWheel.appendChild(div);
  }
}


function setDialPosition(value, snap = false, transition = false) {
  value = Math.max(1, Math.min(maxFrequency, value));

  if (!transition) {
    dialWheel.style.transition = 'none';
  } else if (dialWheel.style.transition === 'none') {
    dialWheel.style.transition = 'transform 0.2s ease-out';
  }

  let targetValue = value;
  currentDialValue = value;

  if (snap) {
    const closestValid = findClosestValid(currentDialValue);
    currentFrequency = closestValid;
    targetValue = closestValid;
    currentDialValue = closestValid;
  }

  let targetTranslate = dialCenterOffset - (targetValue - 1) * numberWidth;
  dialWheel.style.transform = `translateX(${targetTranslate}px)`;

  document.querySelectorAll('.dial-number.selected').forEach(el => el.classList.remove('selected'));
  if (validFrequencies.includes(currentFrequency)) {
    const selectedEl = dialWheel.querySelector(`.dial-number[data-value="${currentFrequency}"]`);
    if (selectedEl) {
      selectedEl.classList.add('selected');
    }
  }
}


function findClosestValid(value) {
  if (validFrequencies.length === 0) {
    return (messages.length === 0) ? 1 : 0;
  }
  const closest = validFrequencies.reduce((prev, curr) =>
    (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev)
  );
  return closest;
}


function findNextValid(direction) {
  const text = newMsg.value.trim();

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  currentVelocityX = 0;

  updateValidFrequencies(text, false);
  if (validFrequencies.length === 0) return;

  let currentIndex = validFrequencies.indexOf(currentFrequency);

  if (currentIndex === -1) {
    setDialPosition(currentFrequency, true, true);
    currentIndex = validFrequencies.indexOf(currentFrequency);
  }

  let newIndex = currentIndex + direction;

  if (newIndex < 0) newIndex = 0;
  if (newIndex >= validFrequencies.length) newIndex = validFrequencies.length - 1;

  const nextValidFreq = validFrequencies[newIndex];
  if (nextValidFreq !== currentFrequency) {
    setDialPosition(nextValidFreq, true, true);
  }
}


function updateValidFrequencies(text, snapToFirst = true) {
  validFrequencies = [];
  if (text) {
    for (let f = 1; f <= maxFrequency; f++) {
      const testMsgs = [...messages, { text, frequency: f }];
      const res = tryEncodeAll(testMsgs, false);
      if (res.ok) {
        validFrequencies.push(f);
      }
    }
  } else {
    for (let f = 1; f <= maxFrequency; f++) validFrequencies.push(f);
  }

  document.querySelectorAll('.dial-number').forEach(el => {
    const val = parseInt(el.dataset.value, 10);
    if (validFrequencies.length > 0 && !validFrequencies.includes(val)) {
      el.classList.add('invalid');
    } else {
      el.classList.remove('invalid');
    }
  });

  if (snapToFirst) {
    const firstValid = validFrequencies.length > 0 ? validFrequencies[0] : 1;
    setDialPosition(firstValid, true, true);
  } else {
    if (validFrequencies.includes(currentFrequency)) {
      setDialPosition(currentFrequency, true, true);
    } else {
      setDialPosition(currentDialValue, true, true);
    }
  }
}


const damping = 0.95;
const stopThreshold = 0.05;

function startSpinAnimation() {
  let lastFrameTime = performance.now();

  function spin() {
    const now = performance.now();
    const deltaTime = now - lastFrameTime;
    lastFrameTime = now;

    if (Math.abs(currentVelocityX) < stopThreshold) {
      currentVelocityX = 0;
      animationFrameId = null;
      setDialPosition(currentDialValue, true, true);
      return;
    }

    currentVelocityX *= Math.pow(damping, deltaTime / 16.67);
    const pixelsToMove = currentVelocityX * deltaTime;
    let newValue = currentDialValue - (pixelsToMove / numberWidth);

    if (newValue < 1 || newValue > maxFrequency) {
      currentVelocityX = 0;
      const clampedValue = Math.max(1, Math.min(maxFrequency, newValue));
      animationFrameId = null;
      setDialPosition(clampedValue, true, true);
      return;
    }

    setDialPosition(newValue, false, false);
    animationFrameId = requestAnimationFrame(spin);
  }

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(spin);
}


function activateTyping() {
  document.addEventListener('keydown', e => {
    const key = e.key;

    if (document.activeElement === newMsg) {
      if (key === 'ArrowLeft') {
        e.preventDefault();
        findNextValid(-1);
        return;
      }
      if (key === 'ArrowRight') {
        e.preventDefault();
        findNextValid(1);
        return;
      }
    }

    if (document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement !== input) return;

    if (key === 'ArrowRight') {
      moveCursor(1);
      e.preventDefault();
      return;
    }
    if (key === 'ArrowLeft') {
      moveCursor(-1);
      e.preventDefault();
      return;
    }
    ensureIndex(cursorIndex);

    const currentCell = sheetData[cursorIndex];
    if (currentCell && currentCell.prefilled) {
      if (key.length === 1 && /^[\S]$/.test(key)) {
        moveCursor(1);
        e.preventDefault();
        return;
      }
      if (key === 'Backspace') {
        moveCursor(-1);
        e.preventDefault();
        return;
      }
    }

    if (key === ' ') {
      sheetData.splice(cursorIndex, 0, { char: ' ', prefilled: false, spacer: true });
      cursorIndex++;
      renderSheet();
      e.preventDefault();
      return;
    }

    if (key === 'Backspace') {
      ensureIndex(cursorIndex);
      const cell = sheetData[cursorIndex];
      const lastPref = lastPrefilledIndex();
      if (!cell) {
        if (cursorIndex > 0) cursorIndex--;
        renderSheet();
        e.preventDefault();
        return;
      }
      if (cell.spacer) {
        sheetData.splice(cursorIndex, 1);
        if (cursorIndex > 0) cursorIndex--;
        renderSheet();
        e.preventDefault();
        return;
      }
      if (cell.char !== '_' && cell.char !== ' ') {
        if (cursorIndex > lastPref) {
          sheetData.splice(cursorIndex, 1);
        } else {
          sheetData[cursorIndex].char = '_';
          sheetData[cursorIndex].spacer = false;
        }
        if (cursorIndex > 0) cursorIndex--;
        renderSheet();
        e.preventDefault();
        return;
      }
      if (cursorIndex > lastPref) {
        sheetData.splice(cursorIndex, 1);
        if (cursorIndex > 0) cursorIndex--;
        renderSheet();
      } else {
        if (cursorIndex > 0) cursorIndex--;
        renderSheet();
      }
      e.preventDefault();
      return;
    }

    if (key.length === 1 && /^[\S]$/.test(key)) {
      const char = key.toUpperCase();
      ensureIndex(cursorIndex);
      if (sheetData[cursorIndex] && sheetData[cursorIndex].spacer) {
        sheetData[cursorIndex] = { char, prefilled: false, spacer: false };
        cursorIndex++;
        renderSheet();
        e.preventDefault();
        return;
      }
      sheetData[cursorIndex].char = char;
      sheetData[cursorIndex].spacer = false;
      cursorIndex++;
      ensureIndex(cursorIndex);
      renderSheet();
      e.preventDefault();
      return;
    }
  });
}


function renderMessages() {
  msgList.innerHTML = '';
  messages.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'message-item';
    const label = document.createElement('span');
    label.textContent = m.text;
    const freq = document.createElement('input');
    freq.type = 'number';
    freq.value = m.frequency;
    freq.min = 1;
    freq.addEventListener('change', () => {
      const old = m.frequency;
      const v = parseInt(freq.value, 10);
      if (!v || v < 1) {
        freq.value = old;
        return;
      }
      m.frequency = v;
      if (!rebuild()) {
        m.frequency = old;
        freq.value = old;
      }
    });
    const del = document.createElement('button');
    del.textContent = 'Remove';
    del.onclick = () => {
      messages.splice(i, 1);
      rebuild();
      renderMessages();
    };
    div.appendChild(label);
    div.appendChild(freq);
    div.appendChild(del);
    msgList.appendChild(div);
  });
}


function rebuild() {
  const res = tryEncodeAll(messages, true);
  if (!res.ok) {
    const originalText = addBtn.textContent;
    addBtn.textContent = 'Nope';
    setTimeout(() => {
      addBtn.textContent = originalText;
      addBtn.style.cssText = '';
    }, 1200);
    return false;
  }
  renderSheet();
  cursorIndex = 0;
  highlightCursor();

  updateValidFrequencies(newMsg.value.trim(), false);
  return true;
}


addBtn.addEventListener('click', () => {
  const text = newMsg.value.trim();
  if (!text) return;

  let freq = currentFrequency;

  if (validFrequencies.length > 0 && !validFrequencies.includes(freq)) {
    freq = findClosestValid(freq);
  }

  if (!freq || freq < 1 || !validFrequencies.includes(freq)) {
    const firstValid = validFrequencies.length > 0 ? validFrequencies[0] : 0;
    if (!firstValid) {
      addBtn.textContent = 'Failed';
      setTimeout(() => (addBtn.textContent = 'Add'), 1200);
      return;
    }
    freq = firstValid;
  }

  messages.push({ text, frequency: freq });

  if (!rebuild()) {
    messages.pop();
  }

  renderMessages();
  newMsg.value = '';
  updateValidFrequencies('', true);
  input.focus();
});


function updateDisplayFromSheet() {
  input.value = sheetData
    .map(c => (c ? (c.spacer ? ' ' : c.char) : '_'))
    .join('')
    .trim();
}


copyBtn.addEventListener('click', () => {
  const text = input.value;
  if (!text) return;

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = 0;
    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    document.execCommand('copy');

    document.body.removeChild(textArea);

    copyBtn.textContent = 'Copied';
    setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    copyBtn.textContent = 'Error';
    setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
  }
});


newMsg.addEventListener('input', () => {
  const text = newMsg.value.trim();
  updateValidFrequencies(text, false);
});


frequencyDial.addEventListener('mousedown', e => {
  e.preventDefault();

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;

  isDragging = true;
  startX = e.clientX;

  const transform = new DOMMatrix(getComputedStyle(dialWheel).transform);
  startTranslateX = transform.m41;
  dialWheel.style.transition = 'none';

  lastMouseX = e.clientX;
  lastMouseTime = performance.now();
  currentVelocityX = 0;
});


document.addEventListener('mousemove', e => {
  if (!isDragging) return;

  const now = performance.now();
  const moveX = e.clientX;
  const deltaTime = now - lastMouseTime;
  const deltaMouse = moveX - lastMouseX;

  if (deltaTime > 0) {
    currentVelocityX = deltaMouse / deltaTime;
  }

  lastMouseX = moveX;
  lastMouseTime = now;

  const totalDeltaX = e.clientX - startX;
  const newTranslate = startTranslateX + totalDeltaX;

  const newValue = 1 + (dialCenterOffset - newTranslate) / numberWidth;
  setDialPosition(newValue, false, false);
});


document.addEventListener('mouseup', e => {
  if (!isDragging) return;
  isDragging = false;

  startSpinAnimation();
});


frequencyDial.addEventListener('wheel', e => {
  e.preventDefault();

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  currentVelocityX = 0;

  const direction = e.deltaY > 0 ? 1 : -1;
  findNextValid(direction);
});


populateDial(maxFrequency);
dialWidth = frequencyDial.offsetWidth;
dialCenterOffset = (dialWidth / 2) - (numberWidth / 2);
updateValidFrequencies('', true);
renderSheet();
activateTyping();
highlightCursor();
