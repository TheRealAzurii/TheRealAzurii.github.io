const result = document.getElementById('result');
const get = id => document.getElementById(id);

const ids = [
  'coal_mines','iron_mines','gold_mines','copper_mines','diamond_mines',
  'wheat_farms','log_farms','saw_mills','wind_mills',
  'iron_ore','gold_ore','copper_ore',
  'beds','farms',
  'coal','iron_bars','gold_bars','copper_bars','diamonds','wheat','bread','logs','wood',
  'coal_%','iron_%','gold_%','copper_%','diamond_%','wheat_%','bread_%','log_%','wood_%',
  'coal_due','iron_due','gold_due','copper_due','diamond_due','wheat_due','bread_due','log_due','wood_due'
];

const boxes = ids.reduce((acc, id) => {
  acc[id] = get(id);
  return acc;
}, {});

const parse = v => {
  const n = parseInt(v || 0, 10);
  return Number.isNaN(n) ? 0 : n;
};

function inputChanged() {
  const val = el => parse(el?.value);

  const coalMines = val(boxes['coal_mines']) * 21;
  const ironMines = val(boxes['iron_mines']) * 21;
  const goldMines = val(boxes['gold_mines']) * 21;
  const copperMines = val(boxes['copper_mines']) * 21;
  const diamondMines = val(boxes['diamond_mines']) * 21;
  const wheatFarms = val(boxes['wheat_farms']) * 21;
  const logFarms = val(boxes['log_farms']) * 21;
  const sawMillsCap = val(boxes['saw_mills']) * 32;
  const windMillsCap = val(boxes['wind_mills']) * 126;

  let ironOre = val(boxes['iron_ore']) + ironMines;
  let goldOre = val(boxes['gold_ore']) + goldMines;
  let copperOre = val(boxes['copper_ore']) + copperMines;

  let coal = val(boxes['coal']) + coalMines - val(boxes['coal_due']);
  let ironBars = val(boxes['iron_bars']) - val(boxes['iron_due']);
  let goldBars = val(boxes['gold_bars']) - val(boxes['gold_due']);
  let copperBars = val(boxes['copper_bars']) - val(boxes['copper_due']);
  let diamonds = val(boxes['diamonds']) + diamondMines - val(boxes['diamond_due']);
  let wheat = val(boxes['wheat']) + wheatFarms - val(boxes['wheat_due']);
  let bread = 0;
  let logs = val(boxes['logs']) + logFarms - val(boxes['log_due']);
  let wood = 0;

  let coalDue = val(boxes['coal_due']);
  let ironDue = val(boxes['iron_due']);
  let goldDue = val(boxes['gold_due']);
  let copperDue = val(boxes['copper_due']);
  let diamondDue = val(boxes['diamond_due']);
  let wheatDue = val(boxes['wheat_due']);
  let breadDue = val(boxes['bread_due']);
  let logDue = val(boxes['log_due']);
  let woodDue = val(boxes['wood_due']);

  const pct = {
    coal: parse(boxes['coal_%']?.value),
    iron: parse(boxes['iron_%']?.value),
    gold: parse(boxes['gold_%']?.value),
    copper: parse(boxes['copper_%']?.value),
    diamond: parse(boxes['diamond_%']?.value),
    wheat: parse(boxes['wheat_%']?.value),
    bread: parse(boxes['bread_%']?.value),
    log: parse(boxes['log_%']?.value),
    wood: parse(boxes['wood_%']?.value)
  };

  coal = Math.ceil(coal - (ironOre + goldOre + copperOre) / 10);
  coalDue += Math.ceil(coalMines * pct.coal / 100);
  coal -= coalDue;

  ironDue += Math.ceil(ironMines * pct.iron / 100);
  goldDue += Math.ceil(goldMines * pct.gold / 100);
  copperDue += Math.ceil(copperMines * pct.copper / 100);
  diamondDue += Math.ceil(diamondMines * pct.diamond / 100);
  wheatDue += Math.ceil(wheatFarms * pct.wheat / 100);
  logDue += Math.ceil(logFarms * pct.log / 100);

  ironBars = ironOre - ironDue;
  goldBars = goldOre - goldDue;
  copperBars = copperOre - copperDue;
  diamonds -= diamondDue;
  wheat -= wheatDue;
  logs -= logDue;

  if (logs <= sawMillsCap) {
    wood += logs * 3;
    logs = 0;
  } else {
    wood += sawMillsCap * 3;
    logs -= sawMillsCap;
  }

  if (wheat <= windMillsCap) {
    bread += Math.ceil(wheat / 3);
    wheat = 0;
  } else {
    bread += Math.ceil(windMillsCap / 3);
    wheat -= windMillsCap;
  }

  breadDue = Math.ceil(bread * pct.bread / 100) + breadDue;
  bread = bread - breadDue + val(boxes['bread']);
  woodDue = Math.ceil(wood * pct.wood / 100) + woodDue;
  wood = wood - woodDue + val(boxes['wood']);

  bread -= val(boxes['beds']);
  copperBars -= val(boxes['farms']) * 4;
  wood -= val(boxes['farms']) * 5;

  const fmt = v =>
    (v !== 0 ? `<span class='${v > 0 ? 'good' : 'bad'}'>${v > 0 ? '+' : ''}${v}</span>` : v);

  const makeRow = (label, value, icon) =>
    `<div class="result-item"><span>${label}</span><span>${fmt(value)} <img src="../content/minecraftTextures/${icon}.png" class="image" alt=""></span></div>`;

  const params = ids
    .map(id => {
      const el = boxes[id];
      if (!el) return null;
      const v = (el.value ?? '').toString();
      return v && v !== '0' ? `${id}=${encodeURIComponent(v)}` : null;
    })
    .filter(Boolean)
    .join('&');

  const code = btoa(params)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  result.innerHTML = `
    <div class="result-section">
      <h3>Current</h3>
      <div class="result-grid">
        ${makeRow('Coal', coal, 'coal')}
        ${makeRow('Iron', ironBars, 'ironBars')}
        ${makeRow('Gold', goldBars, 'goldBars')}
        ${makeRow('Copper', copperBars, 'copperBars')}
        ${makeRow('Diamonds', diamonds, 'diamonds')}
        ${makeRow('Wheat', wheat, 'wheat')}
        ${makeRow('Bread', bread, 'bread')}
        ${makeRow('Logs', logs, 'logs')}
        ${makeRow('Planks', wood, 'wood')}
      </div>
    </div>
    <div class="result-section">
      <h3>Due</h3>
      <div class="result-grid">
        ${makeRow('Coal', coalDue, 'coal')}
        ${makeRow('Iron', ironDue, 'ironBars')}
        ${makeRow('Gold', goldDue, 'goldBars')}
        ${makeRow('Copper', copperDue, 'copperBars')}
        ${makeRow('Diamonds', diamondDue, 'diamonds')}
        ${makeRow('Wheat', wheatDue, 'wheat')}
        ${makeRow('Bread', breadDue, 'bread')}
        ${makeRow('Logs', logDue, 'logs')}
        ${makeRow('Planks', woodDue, 'wood')}
      </div>
    </div>
    <div class="result-section">
      <h3>Code</h3>
      <code>${code}</code>
    </div>
  `;

  const downloadBtn = document.getElementById('download-code-button');
  if (downloadBtn) downloadBtn.style.visibility = 'visible';

  return code;
}

function confirmedCode(rawCode) {
  const code = (rawCode || '').trim();
  if (!code) {
    result.innerHTML = `<span style="color:red;">❌ No code entered — paste a valid code and press Import.</span>`;
    return;
  }

  try {
    const base64 = code.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = base64.length % 4;
    const padded = padLength ? base64 + '='.repeat(4 - padLength) : base64;

    const decoded = atob(padded);
    if (!decoded) throw new Error('Decoded string empty');

    const pairs = decoded.split('&');
    let updated = 0;

    pairs.forEach(pair => {
      if (!pair) return;
      const [rawId, rawValue] = pair.split('=');
      const id = rawId;
      const value = rawValue ? decodeURIComponent(rawValue) : '';
      const el = document.getElementById(id);
      if (el) {
        el.value = value;
        updated++;
      }
    });

    if (updated === 0) {
      result.innerHTML = `<span style="color:red;">❌ Code decoded but no matching fields found.</span>`;
    } else {
      inputChanged();
      result.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (e) {
    result.innerHTML = `<span style="color:red;">❌ Error decoding code:<br>${e.message}</span>`;
    const downloadBtn = document.getElementById('download-code-button');
    if (downloadBtn) downloadBtn.style.visibility = 'hidden';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll("input[type='number']").forEach(input => {
    input.addEventListener('input', inputChanged);
    input.addEventListener('keyup', inputChanged);
  });

  const confirmBtn = document.getElementById('confirm_code');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const inputCode = document.getElementById('input_code');
      if (!inputCode) return;

      const codeValue = inputCode.value.trim();
      if (!codeValue) {
        result.innerHTML = `<span style="color:red;">❌ Please paste a code first.</span>`;
        return;
      }

      confirmedCode(codeValue);
    });
  }

  inputChanged();
});