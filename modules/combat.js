// ===== Combat Module =====
(function () {
  'use strict';

  function el(id) { return document.getElementById(id); }

  function renderDeathSaves() {
    if (typeof window.st === 'undefined') return;
    const st = window.st;
    ['dsS1','dsS2','dsS3'].forEach((id, i) => {
      const dot = el(id);
      if (dot) dot.classList.toggle('filled', i < st.dsSuccess);
    });
    ['dsF1','dsF2','dsF3'].forEach((id, i) => {
      const dot = el(id);
      if (dot) dot.classList.toggle('filled', i < st.dsFail);
    });
    const wrap = el('deathSavesUI');
    if (wrap) {
      const visible = st.hpCurrent <= 0 || st.status === 'stable' || st.status === 'dead';
      wrap.classList.toggle('hidden', !visible);
    }
  }

  function setHP(v) {
    const d = window.derived();
    if (window.st.status === 'dead') return;
    window.st.hpCurrent = clamp(v, 0, d.maxHP);
    if (window.st.hpCurrent > 0) {
      window.st.status = 'alive';
      window.st.dsSuccess = 0;
      window.st.dsFail = 0;
    } else if (window.st.hpCurrent === 0 && window.st.status !== 'dead') {
      window.st.status = (window.st.dsSuccess >= 3) ? 'stable' : 'unconscious';
    }
    window.save();
  }

  function attachCombat() {
    el('btnDamage') && el('btnDamage').addEventListener('click', () => {
      const v = Number(el('hpDelta')?.value || 0);
      if (v <= 0) return;
      if (window.st.hpCurrent === 0) {
        window.st.dsFail = clamp(window.st.dsFail + 1, 0, 3);
        if (window.st.dsFail >= 3) window.st.status = 'dead';
        window.save();
      } else {
        setHP(window.st.hpCurrent - v);
        if (window.st.hpCurrent === 0) window.st.status = 'unconscious';
      }
    });

    el('btnHeal') && el('btnHeal').addEventListener('click', () => {
      const v = Number(el('hpDelta')?.value || 0);
      if (v <= 0 || window.st.status === 'dead') return;
      setHP(window.st.hpCurrent + v);
    });

    el('btnHitAtZero') && el('btnHitAtZero').addEventListener('click', () => {
      if (window.st.hpCurrent === 0 && window.st.status !== 'dead') {
        window.st.dsFail = clamp(window.st.dsFail + 1, 0, 3);
        if (window.st.dsFail >= 3) window.st.status = 'dead';
        window.save();
      }
    });

    el('btnHealFromZero') && el('btnHealFromZero').addEventListener('click', () => {
      const v = Number(el('hpDelta')?.value || 1);
      if (v <= 0) return;
      setHP(window.st.hpCurrent + v);
      window.st.dsSuccess = 0;
      window.st.dsFail = 0;
      window.st.status = 'alive';
    });

    el('btnDsPlus') && el('btnDsPlus').addEventListener('click', () => {
      if (window.st.status === 'dead') return;
      window.st.dsSuccess = clamp(window.st.dsSuccess + 1, 0, 3);
      if (window.st.dsSuccess >= 3) window.st.status = 'stable';
      window.save();
    });

    el('btnDsMinus') && el('btnDsMinus').addEventListener('click', () => {
      if (window.st.status === 'dead') return;
      window.st.dsFail = clamp(window.st.dsFail + 1, 0, 3);
      if (window.st.dsFail >= 3) window.st.status = 'dead';
      window.save();
    });

    el('btnCrit') && el('btnCrit').addEventListener('click', () => {
      window.st.hpCurrent = Math.max(1, window.st.hpCurrent);
      window.st.dsSuccess = 0; window.st.dsFail = 0; window.st.status = 'alive';
      window.save();
    });

    el('btnCritFail') && el('btnCritFail').addEventListener('click', () => {
      if (window.st.status === 'dead') return;
      window.st.dsFail = clamp(window.st.dsFail + 2, 0, 3);
      if (window.st.dsFail >= 3) window.st.status = 'dead';
      window.save();
    });

    el('btnStabilize') && el('btnStabilize').addEventListener('click', () => {
      if (window.st.status !== 'dead' && window.st.hpCurrent === 0) {
        window.st.status = 'stable';
        window.st.dsSuccess = 3;
        window.save();
      }
    });

    el('btnResurrect') && el('btnResurrect').addEventListener('click', () => {
      if (window.st.status !== 'dead') return;
      window.st.hpCurrent = 1;
      window.st.dsSuccess = 0; window.st.dsFail = 0;
      window.st.status = 'alive';
      window.save();
    });
  }

  window.attachCombat = attachCombat;
  window.renderDeathSaves = renderDeathSaves;
  window.setHP = setHP;
})();
