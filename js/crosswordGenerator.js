const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const generateBtn = document.getElementById('generate');
const gridArea = document.getElementById('grid-area');
const clearBtn = document.getElementById('clear-grid');
const exportBtn = document.getElementById('export');
const wordsList = document.getElementById('words-list');

let grid = [];
let rows = parseInt(rowsInput.value, 10);
let cols = parseInt(colsInput.value, 10);
let detectedWords = [];
let focusedWord = null;

function wordKey(w) { return w ? `${w.dir}-${w.r}-${w.c}` : null; }

function makeGrid(r, c) {
    rows = r; cols = c;
    grid = new Array(r);
    for (let i = 0; i < r; i++) {
        grid[i] = new Array(c).fill({ char: '', block: false });
        for (let j = 0; j < c; j++) grid[i][j] = { char: '', block: false };
    }
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
    renderGrid();
    detectWords();
}

function detectWords() {
    const prevClues = new Map(detectedWords.map(w => [wordKey(w), w.clue || '']));
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
                    words.push({ dir: 'Across', r: i, c: start, len, pattern: word, cells, clue: prevClues.get(key) || '' });
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
                    words.push({ dir: 'Down', r: start, c: j, len, pattern: word, cells, clue: prevClues.get(key) || '' });
                }
                start = null;
            }
        }
    }
    renderWords(words);
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
        controls.appendChild(inp);
        div.appendChild(meta);
        div.appendChild(pattern);
        div.appendChild(controls);
        wordsList.appendChild(div);
    });
    if (prevKey) {
        const found = detectedWords.find(w => wordKey(w) === prevKey);
        if (found) highlightWord(found); else focusedWord = null;
    }
}

function highlightWord(w) {
    focusedWord = w;
    clearWordSelection();
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

generateBtn.addEventListener('click', () => {
    const r = Math.max(3, Math.min(30, parseInt(rowsInput.value, 10) || 10));
    const c = Math.max(3, Math.min(30, parseInt(colsInput.value, 10) || 10));
    makeGrid(r, c);
});

clearBtn.addEventListener('click', clearGrid);

exportBtn.addEventListener('click', () => {
    const gridText = grid.map(r => r.map(c => (c.block ? '#' : (c.char || '_'))).join('')).join('\n');
    const words = [];
    wordsList.querySelectorAll('.word-item').forEach((el, i) => {
        const clue = el.querySelector('input').value.trim();
        const meta = el.querySelector('.meta').textContent;
        words.push(`${meta} — ${clue}`);
    });
    const exportText = `GRID:\n${gridText}\n\nCLUES:\n${words.join('\n')}`;
    navigator.clipboard.writeText(exportText).then(() => { exportBtn.textContent = 'Copied'; setTimeout(() => exportBtn.textContent = 'Copy Export', 1200); }).catch(() => { exportBtn.textContent = 'Error'; setTimeout(() => exportBtn.textContent = 'Copy Export', 1200); });
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