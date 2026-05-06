// ===== New Character Module =====
(function () {
  'use strict';

  function openNewCharModal() {
    const m = document.getElementById('newCharModal');
    if (!m) return;
    const sel = document.getElementById('newCharDie');
    if (sel) sel.value = '8';
    m.classList.remove('hidden');
  }

  function closeNewCharModal() {
    document.getElementById('newCharModal')?.classList.add('hidden');
  }

  function hasExistingCharacter() {
    return !!localStorage.getItem(window.STORAGE_KEY);
  }

  function createCharacter() {
    const die = parseInt(document.getElementById('newCharDie')?.value || '8', 10);
    const fresh = { ...window.defaultState, hdDie: die, hpCurrent: die };
    window.st = fresh;
    window.save();
    closeNewCharModal();
  }

  function attachNewChar() {
    document.getElementById('btnNewChar')?.addEventListener('click', () => {
      if (hasExistingCharacter()) {
        const ok = confirm(
          'Ако сегашният ви герой не е експортнат, той ще бъде изтрит.\nСигурни ли сте?'
        );
        if (!ok) return;
      }
      openNewCharModal();
    });

    document.getElementById('newCharConfirm')?.addEventListener('click', createCharacter);
    document.getElementById('newCharCancel')?.addEventListener('click', closeNewCharModal);
  }

  window.attachNewChar = attachNewChar;
})();
