// ===== Stats Module =====
(function () {
  'use strict';

  function el(id) { return document.getElementById(id); }

  function attachStats() {
    ['str', 'dex', 'con', 'int_', 'wis', 'cha'].forEach(key => {
      const ids = { str: 'strInput', dex: 'dexInput', con: 'conInput', int_: 'intInput', wis: 'wisInput', cha: 'chaInput' };
      const inp = el(ids[key]);
      if (inp) inp.addEventListener('input', () => {
        window.st[key] = Math.floor(Number(inp.value || 0));
        window.save();
      });
    });

    ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'].forEach(S => {
      const id = 'save' + S + 'Prof';
      const chk = el(id);
      if (chk) chk.addEventListener('change', () => {
        window.st[id] = chk.checked;
        window.save();
      });
    });

    const allBonus = el('saveAllBonusInput');
    allBonus && allBonus.addEventListener('input', () => {
      let v = Math.floor(Number(allBonus.value || 0));
      v = Math.max(-10, Math.min(10, v));
      window.st.saveAllBonus = v;
      window.save();
    });

    const toughChk = el('toughChk');
    if (toughChk) toughChk.addEventListener('change', () => {
      const before = window.derived().maxHP;
      window.st.tough = toughChk.checked;
      const after = window.derived().maxHP;
      const delta = after - before;
      window.st.hpCurrent = window.clamp(window.st.hpCurrent + delta, 0, after);
      window.save();
    });
  }

  window.attachStats = attachStats;
})();
