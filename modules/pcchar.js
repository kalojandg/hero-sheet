// ===== PC Characteristics Module =====
(function () {
  'use strict';

  let __modalType = null;   // 'lang' | 'instr'
  let __modalIdx  = null;
  let __handlersAttached = false;

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g,
      m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function openPcModal(type, index = null) {
    __modalType = type;
    __modalIdx  = (typeof index === 'number') ? index : null;
    const m = document.getElementById('pcModal');
    if (!m) return;

    document.getElementById('pcModalTitle').textContent =
      __modalIdx === null
        ? (type === 'lang' ? 'Add Language' : 'Add Instrument')
        : (type === 'lang' ? 'Edit Language' : 'Edit Instrument');
    document.getElementById('pcModalLabel').textContent = type === 'lang' ? 'Language' : 'Instrument';

    const list = type === 'lang' ? window.st.languages : window.st.instruments;
    document.getElementById('pcModalName').value =
      (__modalIdx !== null && list[__modalIdx]) ? (list[__modalIdx].name || '') : '';

    if (!__handlersAttached) {
      document.getElementById('pcModalCancel')?.addEventListener('click', closePcModal);
      document.getElementById('pcModalSave')?.addEventListener('click', () => {
        const val = (document.getElementById('pcModalName')?.value || '').trim();
        if (!val) { alert('Name is required.'); return; }
        const arr = __modalType === 'lang' ? window.st.languages : window.st.instruments;
        if (!Array.isArray(arr)) {
          if (__modalType === 'lang') window.st.languages = []; else window.st.instruments = [];
        }
        const target = __modalType === 'lang' ? window.st.languages : window.st.instruments;
        if (__modalIdx === null) target.push({ name: val });
        else target[__modalIdx] = { name: val };
        window.save();
        renderLangTable(); renderInstrumentTable();
        closePcModal();
      });
      __handlersAttached = true;
    }

    m.classList.remove('hidden');
    document.getElementById('pcModalName')?.focus();
  }

  function closePcModal() {
    document.getElementById('pcModal')?.classList.add('hidden');
    __modalType = null; __modalIdx = null;
  }

  function makeTable(list, editAttr, delAttr) {
    if (!list.length) return null;
    const rows = list.map((it, i) =>
      `<tr><td>${i+1}</td><td>${esc(it.name)}</td>
       <td style="white-space:nowrap;text-align:center">
         <button class="icon-btn" data-${editAttr}="${i}">✏️</button>
         <button class="icon-btn" data-${delAttr}="${i}">🗑️</button>
       </td></tr>`).join('');
    return `<table class="data-table"><thead><tr><th>#</th><th>Name</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function renderLangTable() {
    const root = document.getElementById('langTableRoot');
    if (!root || typeof window.st === 'undefined') return;
    const list = Array.isArray(window.st.languages) ? window.st.languages : [];
    root.innerHTML = makeTable(list, 'lang-edit', 'lang-del') || '<small>No languages yet.</small>';
    root.querySelectorAll('[data-lang-edit]').forEach(btn =>
      btn.addEventListener('click', () => openPcModal('lang', parseInt(btn.dataset.langEdit, 10))));
    root.querySelectorAll('[data-lang-del]').forEach(btn =>
      btn.addEventListener('click', () => {
        if (!confirm('Delete language?')) return;
        window.st.languages.splice(parseInt(btn.dataset.langDel, 10), 1);
        window.save();
      }));
  }

  function renderInstrumentTable() {
    const root = document.getElementById('instrTableRoot');
    if (!root || typeof window.st === 'undefined') return;
    const list = Array.isArray(window.st.instruments) ? window.st.instruments : [];
    root.innerHTML = makeTable(list, 'instr-edit', 'instr-del') || '<small>No instruments yet.</small>';
    root.querySelectorAll('[data-instr-edit]').forEach(btn =>
      btn.addEventListener('click', () => openPcModal('instr', parseInt(btn.dataset.instrEdit, 10))));
    root.querySelectorAll('[data-instr-del]').forEach(btn =>
      btn.addEventListener('click', () => {
        if (!confirm('Delete instrument?')) return;
        window.st.instruments.splice(parseInt(btn.dataset.instrDel, 10), 1);
        window.save();
      }));
  }

  function renderTraits() {
    const fields = ['personality', 'bond', 'flow', 'flaw'];
    fields.forEach(f => {
      const el = document.getElementById(`pc${f.charAt(0).toUpperCase() + f.slice(1)}`);
      if (el && document.activeElement !== el) el.value = window.st?.[f] || '';
    });
  }

  function attachPCChar() {
    document.getElementById('btnLangAdd')?.addEventListener('click', () => openPcModal('lang'));
    document.getElementById('btnInstrAdd')?.addEventListener('click', () => openPcModal('instr'));

    ['personality', 'bond', 'flow', 'flaw'].forEach(f => {
      const id = `pc${f.charAt(0).toUpperCase() + f.slice(1)}`;
      document.getElementById(id)?.addEventListener('input', e => {
        window.st[f] = e.target.value;
        window.save();
      });
    });
  }

  window.attachPCChar = attachPCChar;
  window.renderLangTable = renderLangTable;
  window.renderInstrumentTable = renderInstrumentTable;
  window.renderTraits = renderTraits;
  window.openPcModal = openPcModal;
  window.closePcModal = closePcModal;
})();
