// ===== Core — State, Helpers, Derived =====
const XP_THRESH = [300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

const STORAGE_KEY = 'heroSheet_v1';

const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
const modFrom = score => Math.floor((Number(score || 0) - 10) / 2);

function profBonus(level) {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9)  return 4;
  if (level >= 5)  return 3;
  return 2;
}

function levelFromXP(xp) {
  let lvl = 1;
  for (let i = 20; i >= 2; i--) {
    if (xp >= XP_THRESH[i - 2]) { lvl = i; break; }
  }
  return lvl;
}

// d8 hit die — level 1 gets max, rest get average (5)
function baseHP(level, conMod) {
  if (level <= 0) return 0;
  let hp = 8 + conMod;
  if (level >= 2) hp += (level - 1) * (5 + conMod);
  return hp;
}

const defaultState = {
  name: '',
  xp: 0,
  level: 1,

  str: 10, dex: 10, con: 10, int_: 10, wis: 10, cha: 10,

  saveStrProf: false, saveDexProf: false, saveConProf: false,
  saveIntProf: false, saveWisProf: false, saveChaProf: false,
  saveAllBonus: 0,

  meleeStat: 'str',
  meleeMagic: 0,
  rangedMagic: 0,
  acMagic: 0,
  saveDcStat: 'wis',
  saveDcMagic: 0,

  hpCurrent: 8,
  hpHomebrew: 0,
  hpAdjust: 0,
  tough: false,
  hdAvail: 1,
  dsSuccess: 0,
  dsFail: 0,
  status: 'alive',

  baseSpeed: 30,

  skills: [],        // [{ name, level, description }]
  languages: [],     // [{ name }]
  instruments: [],   // [{ name }]
  personality: '',
  bond: '',
  flow: '',
  flaw: '',

  inventory: [],
  goldPlatinum: 0,
  goldGold: 0,
  goldSilver: 0,
  goldCopper: 0,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const obj = raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
    if (typeof obj.level === 'undefined' || obj.level === null) {
      obj.level = levelFromXP(obj.xp || 0);
    }
    if (!Array.isArray(obj.skills))      obj.skills = [];
    if (!Array.isArray(obj.languages))   obj.languages = [];
    if (!Array.isArray(obj.instruments)) obj.instruments = [];
    if (!Array.isArray(obj.inventory))   obj.inventory = [];
    return obj;
  } catch {
    return { ...defaultState };
  }
}

let st = load();
window.st = st;

function save() {
  if (window.st) st = window.st;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
  window.renderAll?.();
}
window.save = save;

function derived() {
  const level = st.level || 1;
  const mods = {
    str: modFrom(st.str), dex: modFrom(st.dex), con: modFrom(st.con),
    int_: modFrom(st.int_), wis: modFrom(st.wis), cha: modFrom(st.cha),
  };
  const prof = profBonus(level);
  const hdMax = level;
  const formulaMaxHP = baseHP(level, mods.con)
    + (st.tough ? 2 * level : 0)
    + Number(st.hpAdjust || 0);
  const maxHP = Math.max(1, Math.floor(formulaMaxHP + Number(st.hpHomebrew || 0)));
  const ac = 10 + mods.dex + Number(st.acMagic || 0);
  const meleeStat = st.meleeStat || 'str';
  const meleeAtk = mods[meleeStat] + prof + Number(st.meleeMagic || 0);
  const rangedAtk = mods.dex + prof + Number(st.rangedMagic || 0);
  const saveDcStat = st.saveDcStat || 'wis';
  const saveDC = 8 + prof + mods[saveDcStat] + Number(st.saveDcMagic || 0);
  const allBonus = Number(st.saveAllBonus || 0);
  const savesTotal = {
    str:  mods.str  + (st.saveStrProf ? prof : 0) + allBonus,
    dex:  mods.dex  + (st.saveDexProf ? prof : 0) + allBonus,
    con:  mods.con  + (st.saveConProf ? prof : 0) + allBonus,
    int_: mods.int_ + (st.saveIntProf ? prof : 0) + allBonus,
    wis:  mods.wis  + (st.saveWisProf ? prof : 0) + allBonus,
    cha:  mods.cha  + (st.saveChaProf ? prof : 0) + allBonus,
  };
  return { level, mods, prof, hdMax, maxHP, ac, meleeAtk, rangedAtk, saveDC, savesTotal };
}
window.derived = derived;

// Expose helpers (used by tests)
window.modFrom = modFrom;
window.profBonus = profBonus;
window.levelFromXP = levelFromXP;
window.XP_THRESH = XP_THRESH;
window.clamp = clamp;
window.baseHP = baseHP;
window.defaultState = defaultState;
window.STORAGE_KEY = STORAGE_KEY;
