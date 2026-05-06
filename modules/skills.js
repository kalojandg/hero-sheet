// ===== Skills Accordion Module =====
(function () {
  'use strict';

  let __editIndex = null;

  function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g,
      m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function renderSkillsAccordion() {
    const root = document.getElementById('skillsAccordionRoot');
    if (!root) return;
    const skills = Array.isArray(window.st?.skills) ? window.st.skills : [];

    if (!skills.length) {
      root.innerHTML = '<p class="muted-note">No skills or features added yet.</p>';
      return;
    }

    root.innerHTML = skills.map((sk, i) => `
      <div class="skill-item" data-idx="${i}">
        <div class="skill-header" data-toggle="${i}">
          <span class="skill-level-badge">Lv.${Number(sk.level) || 1}</span>
          <span class="skill-name">${escHtml(sk.name)}</span>
          <span class="skill-arrow" id="skill-arrow-${i}">▶</span>
        </div>
        <div class="skill-body hidden" id="skill-body-${i}">
          <p>${escHtml(sk.description)}</p>
          <div class="skill-actions">
            <button class="btn-sm" data-skill-edit="${i}">Edit</button>
            <button class="btn-sm danger" data-skill-del="${i}">Delete</button>
          </div>
        </div>
      </div>`).join('');

    root.querySelectorAll('[data-toggle]').forEach(h => {
      h.addEventListener('click', () => {
        const idx = h.getAttribute('data-toggle');
        const body = document.getElementById(`skill-body-${idx}`);
        const arrow = document.getElementById(`skill-arrow-${idx}`);
        if (!body) return;
        const open = !body.classList.contains('hidden');
        body.classList.toggle('hidden', open);
        if (arrow) arrow.classList.toggle('expanded', !open);
      });
    });

    root.querySelectorAll('[data-skill-edit]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openSkillModal(parseInt(btn.getAttribute('data-skill-edit'), 10));
      });
    });

    root.querySelectorAll('[data-skill-del]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-skill-del'), 10);
        if (!confirm('Delete this skill/feature?')) return;
        window.st.skills.splice(idx, 1);
        window.save();
      });
    });
  }

  function openSkillModal(editIndex = null) {
    __editIndex = (typeof editIndex === 'number') ? editIndex : null;
    const m = document.getElementById('skillModal');
    if (!m) return;
    const title = document.getElementById('skillModalTitle');
    const nameIn = document.getElementById('skillName');
    const levelIn = document.getElementById('skillLevel');
    const descIn = document.getElementById('skillDesc');

    if (title) title.textContent = __editIndex === null ? 'Add Skill / Feature' : 'Edit Skill / Feature';

    if (__editIndex !== null && window.st?.skills?.[__editIndex]) {
      const sk = window.st.skills[__editIndex];
      if (nameIn) nameIn.value = sk.name || '';
      if (levelIn) levelIn.value = sk.level || 1;
      if (descIn) descIn.value = sk.description || '';
    } else {
      if (nameIn) nameIn.value = '';
      if (levelIn) levelIn.value = 1;
      if (descIn) descIn.value = '';
    }

    m.classList.remove('hidden');
    nameIn?.focus();
  }

  function closeSkillModal() {
    const m = document.getElementById('skillModal');
    if (m) m.classList.add('hidden');
    __editIndex = null;
  }

  function attachSkills() {
    const addBtn = document.getElementById('btnSkillAdd');
    addBtn && addBtn.addEventListener('click', () => openSkillModal());

    const saveBtn = document.getElementById('skillSave');
    saveBtn && saveBtn.addEventListener('click', () => {
      const name = (document.getElementById('skillName')?.value || '').trim();
      const level = Math.max(1, Math.min(20, parseInt(document.getElementById('skillLevel')?.value || 1, 10)));
      const description = (document.getElementById('skillDesc')?.value || '').trim();
      if (!name) { alert('Name is required.'); return; }
      if (!Array.isArray(window.st.skills)) window.st.skills = [];
      const rec = { name, level, description };
      if (__editIndex === null) {
        window.st.skills.push(rec);
      } else {
        window.st.skills[__editIndex] = rec;
      }
      closeSkillModal();
      window.save();
    });

    const cancelBtn = document.getElementById('skillCancel');
    cancelBtn && cancelBtn.addEventListener('click', closeSkillModal);
  }

  window.renderSkillsAccordion = renderSkillsAccordion;
  window.attachSkills = attachSkills;
  window.openSkillModal = openSkillModal;
  window.closeSkillModal = closeSkillModal;
})();
