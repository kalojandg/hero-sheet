// ===== Hero Sheet — App Coordinator =====
const el = id => document.getElementById(id);

async function loadTabs() {
  const tabs = {
    basicinfo: 'tabs/basicinfo.html',
    stats:     'tabs/stats.html',
    skills:    'tabs/skills.html',
    inventory: 'tabs/inventory.html',
    pcchar:    'tabs/pcchar.html',
  };
  await Promise.all(Object.entries(tabs).map(async ([id, url]) => {
    try {
      const r = await fetch(url);
      if (!r.ok) return;
      const html = await r.text();
      const pane = document.getElementById(`tab-${id}`);
      if (pane) pane.innerHTML = html;
    } catch (e) { console.error('Tab load failed:', id, e); }
  }));
}

// ===== Tab navigation =====
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-tab]');
  if (!btn) return;
  const tab = btn.getAttribute('data-tab');
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('.tab').forEach(p => p.classList.remove('active'));
  const pane = document.getElementById(`tab-${tab}`);
  if (pane) pane.classList.add('active');
});

// ===== renderAll =====
function renderAll() {
  window.st = st;
  const d = window.derived();

  // Life emoji
  let emoji = '🙂';
  if (st.status === 'stable') emoji = '🛌';
  else if (st.status === 'dead') emoji = '💀';
  else if (st.hpCurrent <= 0)  emoji = '😵';
  el('lifeStatus') && (el('lifeStatus').textContent = emoji);

  // Combat pill bar
  el('hpCurrentSpan') && (el('hpCurrentSpan').textContent = st.hpCurrent);
  el('hpMaxSpan')     && (el('hpMaxSpan').textContent     = d.maxHP);
  el('acSpan')        && (el('acSpan').textContent        = d.ac);
  el('profSpan')      && (el('profSpan').textContent      = `+${d.prof}`);
  el('meleeAtkSpan')  && (el('meleeAtkSpan').textContent  = (d.meleeAtk  >= 0 ? '+' : '') + d.meleeAtk);
  el('rangedAtkSpan') && (el('rangedAtkSpan').textContent = (d.rangedAtk >= 0 ? '+' : '') + d.rangedAtk);
  el('saveDcSpan')    && (el('saveDcSpan').textContent    = d.saveDC);

  // Basic Info tab
  el('charName')       && (el('charName').value            = st.name || '');
  el('levelSpan')      && (el('levelSpan').textContent     = d.level);
  el('xpDisplay')      && (el('xpDisplay').textContent     = st.xp);
  el('profSpan2')      && (el('profSpan2').textContent     = `+${d.prof}`);
  el('maxBloodSpan')   && (el('maxBloodSpan').textContent  = d.maxHP);
  el('hdMaxSpan')      && (el('hdMaxSpan').textContent     = d.hdMax);
  el('hdAvailSpan')    && (el('hdAvailSpan').textContent   = st.hdAvail);
  el('hdDieSpan')      && (el('hdDieSpan').textContent     = `d${st.hdDie || 8}`);
  el('acSpan2')        && (el('acSpan2').textContent       = d.ac);
  el('saveDcSpan2')    && (el('saveDcSpan2').textContent   = d.saveDC);
  el('saveDcDetail')   && (el('saveDcDetail').textContent  = d.saveDC);
  el('speedSpan')      && (el('speedSpan').textContent     = st.baseSpeed || 30);

  el('acMagicInput')      && (el('acMagicInput').value      = st.acMagic      ?? 0);
  el('meleeMagicInput')   && (el('meleeMagicInput').value   = st.meleeMagic   ?? 0);
  el('rangedMagicInput')  && (el('rangedMagicInput').value  = st.rangedMagic  ?? 0);
  el('saveDcMagicInput')  && (el('saveDcMagicInput').value  = st.saveDcMagic  ?? 0);
  el('saveDcStatSelect')  && (el('saveDcStatSelect').value  = st.saveDcStat  || 'wis');
  el('meleeStatSelect')   && (el('meleeStatSelect').value   = st.meleeStat   || 'str');
  el('baseSpeedInput')    && (el('baseSpeedInput').value    = st.baseSpeed    ?? 30);
  el('hpAdjustInput')     && (el('hpAdjustInput').value     = st.hpAdjust     ?? 0);
  el('toughChk')          && (el('toughChk').checked        = !!st.tough);
  const hbEl = el('homebrewHp');
  if (hbEl) hbEl.value = (!st.hpHomebrew) ? '' : st.hpHomebrew;

  // Stats tab
  const mods = d.mods;
  const sign = n => (n >= 0 ? '+' : '') + n;
  el('strInput') && (el('strInput').value = st.str);
  el('dexInput') && (el('dexInput').value = st.dex);
  el('conInput') && (el('conInput').value = st.con);
  el('intInput') && (el('intInput').value = st.int_);
  el('wisInput') && (el('wisInput').value = st.wis);
  el('chaInput') && (el('chaInput').value = st.cha);

  el('strModSpan') && (el('strModSpan').textContent = sign(mods.str));
  el('dexModSpan') && (el('dexModSpan').textContent = sign(mods.dex));
  el('conModSpan') && (el('conModSpan').textContent = sign(mods.con));
  el('intModSpan') && (el('intModSpan').textContent = sign(mods.int_));
  el('wisModSpan') && (el('wisModSpan').textContent = sign(mods.wis));
  el('chaModSpan') && (el('chaModSpan').textContent = sign(mods.cha));

  el('saveStrProf') && (el('saveStrProf').checked = !!st.saveStrProf);
  el('saveDexProf') && (el('saveDexProf').checked = !!st.saveDexProf);
  el('saveConProf') && (el('saveConProf').checked = !!st.saveConProf);
  el('saveIntProf') && (el('saveIntProf').checked = !!st.saveIntProf);
  el('saveWisProf') && (el('saveWisProf').checked = !!st.saveWisProf);
  el('saveChaProf') && (el('saveChaProf').checked = !!st.saveChaProf);
  el('saveAllBonusInput') && (el('saveAllBonusInput').value = st.saveAllBonus ?? 0);

  el('saveStrTotalSpan') && (el('saveStrTotalSpan').textContent = sign(d.savesTotal.str));
  el('saveDexTotalSpan') && (el('saveDexTotalSpan').textContent = sign(d.savesTotal.dex));
  el('saveConTotalSpan') && (el('saveConTotalSpan').textContent = sign(d.savesTotal.con));
  el('saveIntTotalSpan') && (el('saveIntTotalSpan').textContent = sign(d.savesTotal.int_));
  el('saveWisTotalSpan') && (el('saveWisTotalSpan').textContent = sign(d.savesTotal.wis));
  el('saveChaTotalSpan') && (el('saveChaTotalSpan').textContent = sign(d.savesTotal.cha));

  // YOU DIED overlay
  const overlay = el('youDiedOverlay');
  if (overlay) overlay.classList.toggle('hidden', st.status !== 'dead');

  // Module delegates
  window.renderDeathSaves?.();
  window.renderSkillsAccordion?.();
  window.renderInventoryTable?.();
  window.renderGold?.();
  window.renderLangTable?.();
  window.renderInstrumentTable?.();
  window.renderTraits?.();
}
window.renderAll = renderAll;

// ===== Events: Basic Info tab =====
function attachBasicInfo() {
  el('charName') && el('charName').addEventListener('input', () => { st.name = el('charName').value; save(); });

  el('btnAddXp') && el('btnAddXp').addEventListener('click', () => {
    const v = Math.max(0, Math.floor(Number(el('xpAddInput')?.value || 0)));
    if (v > 0) { st.xp = (st.xp || 0) + v; save(); }
    if (el('xpAddInput')) el('xpAddInput').value = '';
  });

  el('meleeStatSelect')  && el('meleeStatSelect').addEventListener('change', () => { st.meleeStat = el('meleeStatSelect').value; save(); });
  el('saveDcStatSelect') && el('saveDcStatSelect').addEventListener('change', () => { st.saveDcStat = el('saveDcStatSelect').value; save(); });

  el('meleeMagicInput')  && el('meleeMagicInput').addEventListener('input', () => { st.meleeMagic  = Math.floor(Number(el('meleeMagicInput').value  || 0)); save(); });
  el('rangedMagicInput') && el('rangedMagicInput').addEventListener('input', () => { st.rangedMagic = Math.floor(Number(el('rangedMagicInput').value || 0)); save(); });
  el('acMagicInput')     && el('acMagicInput').addEventListener('input',     () => { st.acMagic     = Math.floor(Number(el('acMagicInput').value     || 0)); save(); });
  el('saveDcMagicInput') && el('saveDcMagicInput').addEventListener('input', () => { st.saveDcMagic = Math.floor(Number(el('saveDcMagicInput').value || 0)); save(); });

  el('baseSpeedInput') && el('baseSpeedInput').addEventListener('input', () => { st.baseSpeed = Math.max(0, Math.floor(Number(el('baseSpeedInput').value || 0))); save(); });
  el('hpAdjustInput')  && el('hpAdjustInput').addEventListener('input',  () => { st.hpAdjust  = Math.floor(Number(el('hpAdjustInput').value  || 0)); save(); });

  const hbInput = el('homebrewHp');
  if (hbInput) hbInput.addEventListener('input', () => {
    const raw = hbInput.value.trim();
    let v = raw === '' ? 0 : Math.floor(Number(raw));
    if (Number.isNaN(v)) v = 0;
    st.hpHomebrew = v;
    const d = window.derived();
    st.hpCurrent = clamp(st.hpCurrent, 0, d.maxHP);
    save();
  });
}

// ===== Import / Export =====
function getBundle() {
  return { schema: 'heroSheetBundle/v1', state: JSON.parse(JSON.stringify(st)) };
}

el('btnExport') && el('btnExport').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(getBundle(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hero-sheet-${st.name || 'export'}.json`;
  a.click();
});

el('importFile') && el('importFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      const incoming = data.state || data;
      st = { ...window.defaultState, ...incoming };
      if (!Array.isArray(st.skills))      st.skills = [];
      if (!Array.isArray(st.languages))   st.languages = [];
      if (!Array.isArray(st.instruments)) st.instruments = [];
      if (!Array.isArray(st.inventory))   st.inventory = [];
      window.st = st;
      save();
    } catch { alert('Invalid file.'); }
    e.target.value = '';
  };
  reader.readAsText(file);
});

el('btnImport') && el('btnImport').addEventListener('click', () => el('importFile')?.click());

// ===== Init =====
async function init() {
  await loadTabs();
  attachBasicInfo();
  window.attachStats?.();
  window.attachRests?.();
  window.attachCombat?.();
  window.attachSkills?.();
  window.attachInventory?.();
  window.attachPCChar?.();
  window.attachNewChar?.();
  renderAll();
  // Activate first tab
  document.querySelector('[data-tab="basicinfo"]')?.click();
  window.__tabsLoaded = true;
}

document.addEventListener('DOMContentLoaded', init);
