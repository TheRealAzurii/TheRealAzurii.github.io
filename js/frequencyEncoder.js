const input = document.getElementById('hidden-input');
const newMsg = document.getElementById('new-message');
const newFreq = document.getElementById('new-frequency');
const addBtn = document.getElementById('add-message');
const msgList = document.getElementById('messages-list');
const sheet = document.getElementById('encoding-sheet');
const copyBtn = document.getElementById('copy-text');

let messages = [];
let sheetData = [];
let cursorIndex = 0;

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


function getFreq(text) {
  for (let f = 1; f < 100; f++) {
    const testMsgs = [...messages, { text, frequency: f }];
    const res = tryEncodeAll(testMsgs, false);
    if (res.ok) return f;
  }
  return null;
}


function activateTyping() {
  document.addEventListener('keydown', e => {
    const key = e.key;
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


addBtn.addEventListener('click', () => {
  const text = newMsg.value.trim();
  if (!text) return;

  let freq = parseInt(newFreq.value, 10);
  if (!freq || freq < 1) {
    freq = getFreq(text);
  }

  if (!freq) {
    addBtn.textContent = 'Failed';
    setTimeout(() => (addBtn.textContent = 'Add'), 1200);
    return;
  }

  messages.push({ text, frequency: freq });

  if (!rebuild()) {
    messages.pop();
  }

  renderMessages();
  newMsg.value = '';
  newFreq.value = '';
  newFreq.placeholder = '';
  input.focus();
});


function rebuild() {
  const res = tryEncodeAll(messages, true);
  if (!res.ok) {
    alert('Conflict');
    return false;
  }
  renderSheet();
  cursorIndex = 0;
  highlightCursor();
  return true;
}


function updateDisplayFromSheet() {
  input.value = sheetData
    .map(c => (c ? (c.spacer ? ' ' : c.char) : '_'))
    .join('')
    .trim();
}


copyBtn.addEventListener('click', () => {
  const text = input.value;
  if (!text) return;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      copyBtn.textContent = 'Copied';
      setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
    })
    .catch(() => {
      copyBtn.textContent = 'Error';
      setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
    });
});


newMsg.addEventListener('input', () => {
  const text = newMsg.value.trim();
  if (!text) {
    newFreq.placeholder = '';
    return;
  }
  const suggested = getFreq(text);
  if (suggested) {
    newFreq.placeholder = `${suggested}`;
  } else {
    newFreq.placeholder = 'X';
  }
});


renderSheet();
activateTyping();
highlightCursor();