// ===== Rests Module =====
(function () {
  'use strict';

  function attachRests() {
    const btnShort = document.getElementById('btnShortRest');
    const btnLong  = document.getElementById('btnLongRest');

    btnShort && btnShort.addEventListener('click', () => {
      const d = window.derived();
      if (window.st.hdAvail > 0) {
        const max = window.st.hdAvail;
        const ans = prompt(`How many Recovery Dice? (0–${max})`, '0');
        if (ans !== null) {
          const use = Math.max(0, Math.min(max, Math.floor(Number(ans) || 0)));
          if (use > 0) {
            const rolled = prompt(`Total HP restored (${use}d8)?`, '0');
            if (rolled !== null) {
              const heal = Math.max(0, Math.floor(Number(rolled) || 0));
              window.st.hdAvail -= use;
              window.st.hpCurrent = window.clamp(
                window.st.hpCurrent + heal, 0, d.maxHP
              );
            }
          }
        }
      }
      window.save();
    });

    btnLong && btnLong.addEventListener('click', () => {
      const newLevel = window.levelFromXP(window.st.xp);
      if (newLevel > window.st.level) {
        const gained = newLevel - window.st.level;
        window.st.level = newLevel;
        window.st.hdAvail = Math.min(newLevel, window.st.hdAvail + gained);
      }
      const d = window.derived();
      const recover = Math.ceil(d.hdMax / 2);
      window.st.hdAvail = Math.min(d.hdMax, window.st.hdAvail + recover);
      window.st.hpCurrent = d.maxHP;
      window.st.dsSuccess = 0;
      window.st.dsFail = 0;
      window.st.status = 'alive';
      window.save();
    });
  }

  window.attachRests = attachRests;
})();
