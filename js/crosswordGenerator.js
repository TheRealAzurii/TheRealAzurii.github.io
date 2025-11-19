const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const generateBtn = document.getElementById('generate');
const autoFillBtn = document.getElementById('auto-fill');
const gridArea = document.getElementById('grid-area');
const wordsList = document.getElementById('words-list');
const bottomBar = document.getElementById('bottom-bar');
const bottomBarInner = document.getElementById('bottom-bar-inner');

let grid = [];
let rows = parseInt(rowsInput.value, 10);
let cols = parseInt(colsInput.value, 10);
let detectedWords = [];
let focusedWord = null;
let blockChanged = false;
let bottomMode = null;
let bottomItems = [];
let bottomSelectedIndex = -1;

function wordKey(w) { return w ? `${w.dir}-${w.r}-${w.c}` : null; }

function cellsEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
    }
    return true;
}

function makeGrid(r, c) {
    rows = r; cols = c;
    grid = new Array(r);
    for (let i = 0; i < r; i++) {
        grid[i] = new Array(c).fill({ char: '', block: false });
        for (let j = 0; j < c; j++) grid[i][j] = { char: '', block: false };
    }

    detectedWords = [];
    focusedWord = null;
    if (wordsList) wordsList.innerHTML = '';
    hideBottomBar();
    blockChanged = false;
    renderGrid();
    detectWords();
}

function renderGrid() {
    gridArea.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'grid';
    wrapper.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
    wrapper.style.gridTemplateRows = `repeat(${rows}, 32px)`;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.r = i; cell.dataset.c = j;
            const data = grid[i][j];
            if (data.block) cell.classList.add('block');
            const inp = document.createElement('input');
            inp.maxLength = 1;
            inp.value = data.block ? '' : (data.char || '');
            inp.disabled = data.block;
            if (data.block) {
                inp.style.pointerEvents = 'none';
                cell.style.cursor = 'pointer';
            } else {
                inp.style.pointerEvents = '';
                cell.style.cursor = '';
            }
            inp.addEventListener('input', e => {
                const v = (e.target.value || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 1);
                e.target.value = v;
                grid[i][j].char = v === ' ' ? '' : v;
                detectWords();
                if (focusedWord) {
                    const idx = indexInWord(focusedWord, i, j);
                    if (idx !== -1 && v !== '') {
                        const next = focusedWord.cells[idx + 1];
                        if (next) focusCell(next[0], next[1]);
                    }
                }
            });
            inp.addEventListener('keydown', e => {
                const key = e.key;
                if (key === 'ArrowRight' || key === 'ArrowLeft' || key === 'ArrowUp' || key === 'ArrowDown') {
                    e.preventDefault();
                    const delta = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[key];
                    const [nr, nc] = findNextNonBlock(i, j, delta[0], delta[1]);
                    focusCell(nr, nc);
                    return;
                }
                if (key === ' ' || key === 'Spacebar') {
                    e.preventDefault();
                    grid[i][j].block = true;
                    blockChanged = true;
                    grid[i][j].char = '';
                    renderGrid();
                    detectWords();
                    const [nr, nc] = findNextNonBlock(i, j, 0, 1);
                    focusCell(nr, nc);
                    return;
                }
                if (key === 'Backspace') {
                    const val = inp.value;
                    const inFocused = focusedWord && indexInWord(focusedWord, i, j) !== -1;
                    if (val === '') {
                        if (inFocused) {
                            e.preventDefault();
                            const [pr, pc] = findPrevInWord(focusedWord, i, j);
                            if (pr != null) focusCell(pr, pc);
                        }
                    } else {
                        if (inFocused) {
                            setTimeout(() => {
                                const [pr, pc] = findPrevInWord(focusedWord, i, j);
                                if (pr != null) focusCell(pr, pc);
                            }, 0);
                        }
                    }
                }
            });
            inp.addEventListener('click', e => {
                if (grid[i][j].block) {
                    e.stopPropagation();
                    onCellClick(i, j);
                }
            });
            cell.addEventListener('dblclick', () => toggleWordAt(i, j));
            cell.addEventListener('click', () => onCellClick(i, j));
            cell.appendChild(inp);
            wrapper.appendChild(cell);
        }
    }
    gridArea.appendChild(wrapper);
}

function onCellClick(r, c) {
    if (grid[r][c].block) {
        grid[r][c].block = false;
        blockChanged = true;
        renderGrid();
        detectWords();
        focusCell(r, c);
        return;
    }
    focusCell(r, c);
    const gridEl = gridArea.querySelector('.grid');
    const cellEl = gridEl && gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if (cellEl && cellEl.classList.contains('highlight')) {
        return;
    }
    focusedWord = null;
    clearWordSelection();
    hideBottomBar();
}

function focusCell(r, c) {
    if (r == null || c == null) return;
    ensureBounds(r, c);
    const gridEl = gridArea.querySelector('.grid');
    const inp = gridEl && gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"] input`);
    if (inp && !inp.disabled) { inp.focus(); inp.select(); }
}

function ensureBounds(r, c) { if (r < 0) r = 0; if (c < 0) c = 0; if (r >= rows) r = rows - 1; if (c >= cols) c = cols - 1; }

function findNextNonBlock(r, c, dr, dc) {
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (!grid[nr][nc].block) return [nr, nc];
        nr += dr; nc += dc;
    }
    return [null, null];
}

function indexInWord(w, r, c) { for (let i = 0; i < w.cells.length; i++) if (w.cells[i][0] === r && w.cells[i][1] === c) return i; return -1; }
function findPrevInWord(w, r, c) { const idx = indexInWord(w, r, c); if (idx <= 0) return [null, null]; const [pr, pc] = w.cells[idx - 1]; return [pr, pc]; }
function clearWordSelection() { const gridEl = gridArea.querySelector('.grid'); if (gridEl) gridEl.querySelectorAll('.cell').forEach(c => c.classList.remove('highlight')); Array.from(wordsList.children).forEach(ch => ch.classList.remove('selected')); }

function clearGrid() {
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) grid[i][j] = { char: '', block: false };
    detectedWords = [];
    focusedWord = null;
    if (wordsList) wordsList.innerHTML = '';
    blockChanged = false;
    hideBottomBar();
    renderGrid();
    detectWords();
}

function detectWords() {
    const prevMap = new Map(detectedWords.map(w => [wordKey(w), w]));
    const words = [];
    for (let i = 0; i < rows; i++) {
        let start = null;
        for (let j = 0; j <= cols; j++) {
            const block = j === cols || grid[i][j].block;
            if (!block && start === null) start = j;
            if ((block || j === cols) && start !== null) {
                const len = j - start;
                if (len >= 2) {
                    const cells = [];
                    let word = '';
                    for (let k = start; k < j; k++) {
                        cells.push([i, k]);
                        word += grid[i][k].char || '_';
                    }
                    const key = `Across-${i}-${start}`;
                    const prev = prevMap.get(key);
                    const clue = (prev && cellsEqual(prev.cells, cells)) ? (prev.clue || '') : '';
                    words.push({ dir: 'Across', r: i, c: start, len, pattern: word, cells, clue });
                }
                start = null;
            }
        }
    }
    for (let j = 0; j < cols; j++) {
        let start = null;
        for (let i = 0; i <= rows; i++) {
            const block = i === rows || grid[i] && grid[i][j] && grid[i][j].block;
            if (!block && start === null) start = i;
            if ((block || i === rows) && start !== null) {
                const len = i - start;
                if (len >= 2) {
                    const cells = [];
                    let word = '';
                    for (let k = start; k < i; k++) {
                        cells.push([k, j]);
                        word += grid[k][j].char || '_';
                    }
                    const key = `Down-${start}-${j}`;
                    const prev = prevMap.get(key);
                    const clue = (prev && cellsEqual(prev.cells, cells)) ? (prev.clue || '') : '';
                    words.push({ dir: 'Down', r: start, c: j, len, pattern: word, cells, clue });
                }
                start = null;
            }
        }
    }
    renderWords(words);
    blockChanged = false;
}

function renderWords(words) {
    const prevKey = wordKey(focusedWord);
    detectedWords = words;
    wordsList.innerHTML = '';
    words.forEach((w, idx) => {
        const div = document.createElement('div');
        div.className = 'word-item';
        div.dataset.idx = idx;
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = `${w.dir} ${w.r + 1},${w.c + 1} (${w.len})`;
        const pattern = document.createElement('div');
        pattern.className = 'pattern';
        pattern.textContent = w.pattern.split('').join(' ');
        const controls = document.createElement('div');
        controls.className = 'word-controls';
        const inp = document.createElement('input');
        inp.value = w.clue || '';
        inp.addEventListener('input', e => { w.clue = e.target.value; highlightWord(w); });
        div.addEventListener('click', () => highlightWord(w));
        div.addEventListener('dblclick', async (e) => {
            const inpEl = div.querySelector('input');
            let wordStr = '';

            for (let k = 0; k < w.cells.length; k++) {
                const [r, c] = w.cells[k];
                const ch = (grid[r][c].char || '').toUpperCase();
                if (!ch) { wordStr = null; break; }
                wordStr += ch;
            }

            if (!wordStr) {
                w.clue = "Error: Couldn't fetch";
                if (inpEl) inpEl.value = w.clue;
                return;
            }

            try {
                const dres = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${wordStr.toLowerCase()}`);
                if (!dres.ok) throw new Error('no-def');
                const darr = await dres.json();
                const defs = [];
                if (Array.isArray(darr)) {
                    for (const entry of darr) {
                        if (entry.meanings && Array.isArray(entry.meanings)) {
                            for (const m of entry.meanings) {
                                if (m.definitions && Array.isArray(m.definitions)) {
                                    for (const d of m.definitions) {
                                        if (d && d.definition) defs.push(d.definition);
                                        if (defs.length >= 10) break;
                                    }
                                }
                                if (defs.length >= 10) break;
                            }
                        }
                        if (defs.length >= 10) break;
                    }
                }

                if (defs.length === 0) throw new Error('no-def');
                w.clue = defs[0] || "";

                if (inpEl) inpEl.value = w.clue;
                showBottomBar('definitions', defs, 0, (idx) => {
                    w.clue = defs[idx] || '';
                    if (inpEl) inpEl.value = w.clue;
                });
            } catch (err) {
                w.clue = "Error: Couldn't fetch";
                if (inpEl) inpEl.value = w.clue;
            }
        });

        controls.appendChild(inp);
        div.appendChild(meta);
        div.appendChild(pattern);
        div.appendChild(controls);
        wordsList.appendChild(div);
    });

    if (prevKey) {
        const found = detectedWords.find(w => wordKey(w) === prevKey);
        if (found) highlightWord(found, true); else focusedWord = null;
    }
}

function highlightWord(w, keepBottom) {
    focusedWord = w;
    clearWordSelection();

    if (!keepBottom) hideBottomBar();
    const gridEl = gridArea.querySelector('.grid');
    w.cells.forEach(([r, c]) => {
        const cell = gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
        if (cell) cell.classList.add('highlight');
    });

    const idx = detectedWords.indexOf(w);
    if (idx !== -1) {
        const el = wordsList.children[idx];
        if (el) { el.classList.add('selected'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }

    const first = w.cells[0];
    if (first) {
        const cellEl = gridEl.querySelector(`.cell[data-r="${first[0]}"][data-c="${first[1]}"]`);
        if (cellEl) cellEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
}

function showBottomBar(mode, items, selectedIndex = 0, onSelect) {
    if (!bottomBar || !bottomBarInner) return;
    bottomMode = mode;
    bottomItems = items || [];
    bottomSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;
    bottomBarInner.innerHTML = '';
    bottomItems.forEach((it, idx) => {
        const div = document.createElement('div');
        div.className = 'bottom-item';
        const displayText = (it && typeof it === 'object') ? (it.display || it.raw || it.word || String(it)) : String(it);
        div.textContent = displayText;
        if (idx === bottomSelectedIndex) div.classList.add('selected');
        div.addEventListener('click', () => {
            // update selection UI
            Array.from(bottomBarInner.children).forEach(ch => ch.classList.remove('selected'));
            div.classList.add('selected');
            bottomSelectedIndex = idx;
            if (typeof onSelect === 'function') onSelect(idx);
        });
        bottomBarInner.appendChild(div);
    });
    bottomBar.classList.remove('hidden');
    bottomBar.setAttribute('aria-hidden', 'false');
}

function hideBottomBar() {
    if (!bottomBar || !bottomBarInner) return;
    bottomMode = null;
    bottomItems = [];
    bottomSelectedIndex = -1;
    bottomBarInner.innerHTML = '';
    bottomBar.classList.add('hidden');
    bottomBar.setAttribute('aria-hidden', 'true');
}

function applyCandidateToSlot(s, word) {
    if (!s || !word) return;

    for (let k = 0; k < s.cells.length; k++) {
        const [r, c] = s.cells[k];
        if (!grid[r][c].block) grid[r][c].char = word[k];
    }
    s.clue = '';
    renderGrid();
    detectWords();
}

generateBtn.addEventListener('click', () => {
    const r = Math.max(3, Math.min(10, parseInt(rowsInput.value, 10) || 10));
    const c = Math.max(3, Math.min(15, parseInt(colsInput.value, 10) || 10));
    makeGrid(r, c);
});

function toggleWordAt(r, c) {
    const found = detectedWords.filter(w => indexInWord(w, r, c) !== -1);
    if (found.length === 0) return;

    const across = found.find(w => w.dir === 'Across');
    const down = found.find(w => w.dir === 'Down');
    if (!focusedWord) { highlightWord(across || down); return; }

    const contains = indexInWord(focusedWord, r, c) !== -1;
    if (!contains) { highlightWord(across || down); return; }

    if (focusedWord.dir === 'Across' && down) highlightWord(down);
    else if (focusedWord.dir === 'Down' && across) highlightWord(across);
}

async function autoFill() {
    if (!autoFillBtn) return;
    const origText = autoFillBtn.textContent;
    autoFillBtn.disabled = true;
    autoFillBtn.textContent = 'Filling...';
    try {
        const prevKey = wordKey(focusedWord);
        detectWords();
        if (!prevKey) {
            autoFillBtn.textContent = 'Failed';
            await new Promise(r => setTimeout(r, 2000));
            return;
        }

        const s = detectedWords.find(w => wordKey(w) === prevKey);
        if (!s) {
            autoFillBtn.textContent = 'Failed';
            await new Promise(r => setTimeout(r, 2000));
            return;
        }

        const sIndex = detectedWords.indexOf(s);

        const cellMap = new Map();
        detectedWords.forEach((wd, idx) => {
            wd.cells.forEach(([rr, cc]) => {
                const key = `${rr},${cc}`;
                const arr = cellMap.get(key) || [];
                arr.push(idx);
                cellMap.set(key, arr);
            });
        });

        const slotAlreadyFull = !s.pattern.includes('_');
        const fetchPattern = slotAlreadyFull ? '?'.repeat(s.len) : s.pattern.replace(/_/g, '?');
        const pattern = fetchPattern.toLowerCase();
        const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(pattern)}&max=1000`;
        let arr = [];
        try {
            const res = await fetch(url);
            if (res.ok) arr = await res.json();
        } catch (e) {
            console.error('Datamuse fetch failed', e);
        }

        const mapped = (arr || []).map(o => {
            const raw = (o.word || '');
            const lettersOnly = raw.replace(/\s+/g, '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
            return { raw, lettersOnly, score: o.score || 0 };
        })
            .filter(it => it.lettersOnly.length === s.len)
            .sort((a, b) => (b.score || 0) - (a.score || 0));
        const candObjs = [];
        const seen = new Set();
        for (const it of mapped) {
            if (!it.lettersOnly) continue;
            if (seen.has(it.lettersOnly)) continue;
            seen.add(it.lettersOnly);
            candObjs.push(it);
        }
        const existenceCache = new Map();
        async function wordExists(wordLower) {
            if (existenceCache.has(wordLower)) return existenceCache.get(wordLower);
            try {
                const r = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(wordLower)}&max=1`);
                if (!r.ok) { existenceCache.set(wordLower, false); return false; }
                const a = await r.json();
                const exists = Array.isArray(a) && a.length > 0;
                existenceCache.set(wordLower, exists);
                return exists;
            } catch (e) {
                existenceCache.set(wordLower, false);
                return false;
            }
        }

        async function candidateValid(candidate) {
            for (let k = 0; k < s.cells.length; k++) {
                const [r, c] = s.cells[k];
                const key = `${r},${c}`;
                const slotIdxs = cellMap.get(key) || [];
                let locked = false;
                for (const otherIdx of slotIdxs) {
                    if (otherIdx === sIndex) continue;
                    const other = detectedWords[otherIdx];
                    if (other && !other.pattern.includes('_')) { locked = true; break; }
                }
                const gch = (grid[r][c].char || '').toUpperCase();
                if (locked && gch && gch !== candidate[k]) return false;
            }

            if (slotAlreadyFull) {
                let cur = '';
                for (let k = 0; k < s.cells.length; k++) { const [r, c] = s.cells[k]; cur += (grid[r][c].char || '').toUpperCase(); }
                if (candidate === cur) return false;
            }

            for (let k = 0; k < s.cells.length; k++) {
                const [r, c] = s.cells[k];
                const key = `${r},${c}`;
                const slotIdxs = cellMap.get(key) || [];
                for (const otherIdx of slotIdxs) {
                    if (otherIdx === sIndex) continue;
                    const other = detectedWords[otherIdx];
                    if (!other) continue;
                    let otherWord = '';
                    let hasBlank = false;
                    for (let kk = 0; kk < other.cells.length; kk++) {
                        const [or, oc] = other.cells[kk];
                        let ch;
                        if (or === r && oc === c) ch = candidate[k];
                        else ch = (grid[or][oc].char || '_').toUpperCase();
                        if (!ch || ch === '_') hasBlank = true;
                        otherWord += ch || '_';
                    }
                    if (!hasBlank) {
                        const lower = otherWord.toLowerCase();
                        const exists = await wordExists(lower);
                        if (!exists) return false;
                    }
                }
            }
            return true;
        }

        const validCandidates = [];
        for (const obj of candObjs) {
            if (!obj || !obj.lettersOnly) continue;
            if (validCandidates.length >= 100) break;
            if (await candidateValid(obj.lettersOnly)) validCandidates.push({ display: obj.raw, word: obj.lettersOnly });
        }

        if (validCandidates.length === 0) {
            autoFillBtn.textContent = 'Failed';
            await new Promise(r => setTimeout(r, 1000));
            return;
        }

        const chosen = validCandidates[0];
        applyCandidateToSlot(s, chosen.word);
        showBottomBar('candidates', validCandidates, 0, (idx) => {
            const item = bottomItems[idx];
            if (item && item.word) applyCandidateToSlot(s, item.word);
        });
    } finally {
        autoFillBtn.disabled = false;
        autoFillBtn.textContent = origText;
    }
}

if (autoFillBtn) autoFillBtn.addEventListener('click', autoFill);
