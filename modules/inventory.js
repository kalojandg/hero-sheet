// ===== Inventory Module =====
(function () {
  'use strict';

  let __invEditIndex = null;

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g,
      m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function invOpenModal(editIndex = null, item = null) {
    __invEditIndex = (typeof editIndex === 'number') ? editIndex : null;
    const m = document.getElementById('invModal');
    if (!m) return;
    document.getElementById('invModalTitle').textContent = __invEditIndex === null ? 'Add item' : 'Edit item';
    document.getElementById('invName').value = item?.name || '';
    document.getElementById('invQty').value = item?.qty ?? 1;
    document.getElementById('invNote').value = item?.note || '';
    m.classList.remove('hidden');
    document.getElementById('invName')?.focus();
  }

  function invCloseModal() {
    document.getElementById('invModal')?.classList.add('hidden');
    __invEditIndex = null;
  }

  let __sortable = null;

  function renderInventoryTable() {
    const root = document.getElementById('invTableRoot');
    if (!root || typeof window.st === 'undefined') return;
    const list = Array.isArray(window.st.inventory) ? window.st.inventory : [];
    if (!list.length) { root.innerHTML = '<small>No items yet.</small>'; return; }

    const rows = list.map((it, i) => `<tr data-inv-idx="${i}">
      <td class="inv-drag-handle">☰</td>
      <td>${esc(it.name)}</td>
      <td class="right">${Number(it.qty) || 0}</td>
      <td>${esc(it.note)}</td>
      <td style="white-space:nowrap;text-align:center">
        <button class="icon-btn" data-edit="${i}" title="Edit">✏️</button>
        <button class="icon-btn" data-del="${i}" title="Delete">🗑️</button>
      </td></tr>`).join('');

    root.innerHTML = `<table class="data-table">
      <thead><tr><th></th><th>Name</th><th class="right">Qty</th><th>Note</th><th></th></tr></thead>
      <tbody id="invTableBody">${rows}</tbody></table>`;

    root.querySelectorAll('[data-edit]').forEach(btn =>
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-edit'), 10);
        invOpenModal(idx, window.st.inventory[idx]);
      }));
    root.querySelectorAll('[data-del]').forEach(btn =>
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-del'), 10);
        if (!confirm('Delete item?')) return;
        window.st.inventory.splice(idx, 1);
        window.save();
      }));

    const tbody = document.getElementById('invTableBody');
    if (tbody && typeof Sortable !== 'undefined') {
      __sortable?.destroy();
      __sortable = Sortable.create(tbody, {
        animation: 150, handle: '.inv-drag-handle',
        onEnd(evt) {
          if (evt.oldIndex === evt.newIndex) return;
          const moved = window.st.inventory.splice(evt.oldIndex, 1)[0];
          window.st.inventory.splice(evt.newIndex, 0, moved);
          window.save();
        },
      });
    }
  }

  function renderGold() {
    if (typeof window.st === 'undefined') return;
    const el = id => document.getElementById(id);
    el('goldPlatinumSpan') && (el('goldPlatinumSpan').textContent = Number(window.st.goldPlatinum || 0));
    el('goldGoldSpan')     && (el('goldGoldSpan').textContent     = Number(window.st.goldGold     || 0));
    el('goldSilverSpan')   && (el('goldSilverSpan').textContent   = Number(window.st.goldSilver   || 0));
    el('goldCopperSpan')   && (el('goldCopperSpan').textContent   = Number(window.st.goldCopper   || 0));
  }

  function getGoldInput(id) { return Math.max(0, Math.floor(Number(document.getElementById(id)?.value || 0))); }

  function handleGoldGain() {
    window.st.goldPlatinum = (Number(window.st.goldPlatinum || 0) + getGoldInput('goldPlatinumInput'));
    window.st.goldGold     = (Number(window.st.goldGold     || 0) + getGoldInput('goldGoldInput'));
    window.st.goldSilver   = (Number(window.st.goldSilver   || 0) + getGoldInput('goldSilverInput'));
    window.st.goldCopper   = (Number(window.st.goldCopper   || 0) + getGoldInput('goldCopperInput'));
    ['goldPlatinumInput','goldGoldInput','goldSilverInput','goldCopperInput'].forEach(id => {
      const inp = document.getElementById(id); if (inp) inp.value = '';
    });
    window.save();
    renderGold();
  }

  // Returns new {pp,gp,sp,cp} or null if insufficient funds
  function spendGold(current, cost) {
    const toCp = ({ pp=0, gp=0, sp=0, cp=0 }) =>
      Math.floor(pp)*1000 + Math.floor(gp)*100 + Math.floor(sp)*10 + Math.floor(cp);
    if (toCp(cost) > toCp(current)) return null;
    let { pp, gp, sp, cp } = { pp: Number(current.pp||0), gp: Number(current.gp||0), sp: Number(current.sp||0), cp: Number(current.cp||0) };
    cp -= Number(cost.cp||0); if (cp < 0) { const b=Math.ceil(-cp/10); sp-=b; cp+=b*10; }
    sp -= Number(cost.sp||0); if (sp < 0) { const b=Math.ceil(-sp/10); gp-=b; sp+=b*10; }
    gp -= Number(cost.gp||0); if (gp < 0) { const b=Math.ceil(-gp/10); pp-=b; gp+=b*10; }
    pp -= Number(cost.pp||0);
    return { pp, gp, sp, cp };
  }

  function handleGoldSpend() {
    const cost = { pp: getGoldInput('goldPlatinumInput'), gp: getGoldInput('goldGoldInput'), sp: getGoldInput('goldSilverInput'), cp: getGoldInput('goldCopperInput') };
    const current = { pp: Number(window.st.goldPlatinum||0), gp: Number(window.st.goldGold||0), sp: Number(window.st.goldSilver||0), cp: Number(window.st.goldCopper||0) };
    const result = spendGold(current, cost);
    const errEl = document.getElementById('goldSpendError');
    if (result === null) { errEl?.classList.remove('hidden'); return; }
    errEl?.classList.add('hidden');
    window.st.goldPlatinum = result.pp; window.st.goldGold = result.gp;
    window.st.goldSilver = result.sp;   window.st.goldCopper = result.cp;
    ['goldPlatinumInput','goldGoldInput','goldSilverInput','goldCopperInput'].forEach(id => {
      const inp = document.getElementById(id); if (inp) inp.value = '';
    });
    window.save(); renderGold();
  }

  function attachInventory() {
    document.getElementById('btnInvAdd')?.addEventListener('click', () => invOpenModal());
    document.getElementById('invCancel')?.addEventListener('click', invCloseModal);
    document.getElementById('invSave')?.addEventListener('click', () => {
      const name = (document.getElementById('invName')?.value || '').trim();
      const qty  = Math.max(0, Math.floor(Number(document.getElementById('invQty')?.value || 0)));
      const note = (document.getElementById('invNote')?.value || '').trim();
      if (!name) { alert('Name is required.'); return; }
      const rec = { name, qty, note };
      if (__invEditIndex === null) window.st.inventory.push(rec);
      else window.st.inventory[__invEditIndex] = rec;
      invCloseModal();
      window.save();
    });
    document.getElementById('goldGainBtn')?.addEventListener('click', e => { e.preventDefault(); handleGoldGain(); });
    document.getElementById('goldSpendBtn')?.addEventListener('click', e => { e.preventDefault(); handleGoldSpend(); });
  }

  window.attachInventory = attachInventory;
  window.renderInventoryTable = renderInventoryTable;
  window.renderGold = renderGold;
  window.handleGoldGain = handleGoldGain;
  window.handleGoldSpend = handleGoldSpend;
  window.spendGold = spendGold;
  window.invOpenModal = invOpenModal;
  window.invCloseModal = invCloseModal;
})();
