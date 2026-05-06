import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
  await expect(page.locator('#hpCurrentSpan')).toHaveText('8', { timeout: 8000 });
  await page.locator('button[data-tab="skills"]').click();
  await page.waitForTimeout(150);
}

async function addSkill(page, { name, level, description }) {
  await page.locator('#btnSkillAdd').click();
  await page.locator('#skillName').fill(name);
  await page.locator('#skillLevel').fill(String(level));
  await page.locator('#skillDesc').fill(description);
  await page.locator('#skillSave').click();
  await page.waitForTimeout(150);
}

test.describe('Skills Accordion — Add', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Add button opens modal', async ({ page }) => {
    await page.locator('#btnSkillAdd').click();
    await expect(page.locator('#skillModal')).not.toHaveClass(/hidden/);
  });

  test('Cancel closes modal without saving', async ({ page }) => {
    await page.locator('#btnSkillAdd').click();
    await page.locator('#skillName').fill('Test Skill');
    await page.locator('#skillCancel').click();
    await expect(page.locator('#skillModal')).toHaveClass(/hidden/);
    const count = await page.evaluate(() => window.st.skills.length);
    expect(count).toBe(0);
  });

  test('Added skill appears in accordion with level badge and name', async ({ page }) => {
    await addSkill(page, { name: 'Sneak Attack', level: 3, description: 'Extra damage.' });
    await expect(page.locator('.skill-level-badge')).toHaveText('Lv.3');
    await expect(page.locator('.skill-name')).toHaveText('Sneak Attack');
  });

  test('Description is hidden by default', async ({ page }) => {
    await addSkill(page, { name: 'Test', level: 1, description: 'Secret text.' });
    await expect(page.locator('#skill-body-0')).toHaveClass(/hidden/);
  });

  test('Description visible after expand', async ({ page }) => {
    await addSkill(page, { name: 'Test', level: 1, description: 'Secret text.' });
    await page.locator('.skill-header').click();
    await page.waitForTimeout(100);
    await expect(page.locator('#skill-body-0')).not.toHaveClass(/hidden/);
    await expect(page.locator('#skill-body-0 p')).toContainText('Secret text.');
  });

  test('Multiple skills show all levels and names', async ({ page }) => {
    await addSkill(page, { name: 'Fireball', level: 5, description: 'Big boom.' });
    await addSkill(page, { name: 'Dash', level: 1, description: 'Move fast.' });
    const badges = page.locator('.skill-level-badge');
    await expect(badges).toHaveCount(2);
    await expect(badges.nth(0)).toHaveText('Lv.5');
    await expect(badges.nth(1)).toHaveText('Lv.1');
  });

  test('Name required — empty name is rejected', async ({ page }) => {
    await page.locator('#btnSkillAdd').click();
    await page.locator('#skillLevel').fill('1');
    await page.locator('#skillDesc').fill('Something');
    page.on('dialog', d => d.accept());
    await page.locator('#skillSave').click();
    const count = await page.evaluate(() => window.st.skills.length);
    expect(count).toBe(0);
  });
});

test.describe('Skills Accordion — Edit & Delete', () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
    await page.evaluate(() => {
      window.st.skills = [{ name: 'Dodge', level: 2, description: 'Avoid attacks.' }];
      window.save();
    });
    await page.waitForTimeout(150);
  });

  test('Edit button opens modal prefilled', async ({ page }) => {
    await page.locator('[data-skill-edit="0"]').click();
    await expect(page.locator('#skillModal')).not.toHaveClass(/hidden/);
    await expect(page.locator('#skillName')).toHaveValue('Dodge');
    await expect(page.locator('#skillLevel')).toHaveValue('2');
    await expect(page.locator('#skillDesc')).toHaveValue('Avoid attacks.');
  });

  test('Editing updates the skill', async ({ page }) => {
    await page.locator('[data-skill-edit="0"]').click();
    await page.locator('#skillName').fill('Parry');
    await page.locator('#skillLevel').fill('4');
    await page.locator('#skillSave').click();
    await page.waitForTimeout(150);
    await expect(page.locator('.skill-name')).toHaveText('Parry');
    await expect(page.locator('.skill-level-badge')).toHaveText('Lv.4');
  });

  test('Delete removes skill after confirm', async ({ page }) => {
    page.on('dialog', d => d.accept());
    await page.locator('[data-skill-del="0"]').click();
    await page.waitForTimeout(150);
    const count = await page.evaluate(() => window.st.skills.length);
    expect(count).toBe(0);
    await expect(page.locator('.muted-note')).toBeVisible();
  });

  test('Skills persist after reload', async ({ page }) => {
    await page.evaluate(() => {
      window.st.skills.push({ name: 'Block', level: 3, description: 'Reduce damage.' });
      window.save();
    });
    await page.reload();
    await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
    await page.locator('button[data-tab="skills"]').click();
    await page.waitForTimeout(150);
    const count = await page.evaluate(() => window.st.skills.length);
    expect(count).toBe(2);
  });
});

test.describe('Skills Accordion — Expand/Collapse', () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
    await page.evaluate(() => {
      window.st.skills = [
        { name: 'Skill A', level: 1, description: 'Desc A' },
        { name: 'Skill B', level: 2, description: 'Desc B' },
      ];
      window.save();
    });
    await page.waitForTimeout(150);
  });

  test('Clicking header expands and shows arrow rotated', async ({ page }) => {
    await page.locator('[data-toggle="0"]').click();
    await page.waitForTimeout(100);
    await expect(page.locator('#skill-arrow-0')).toHaveClass(/expanded/);
    await expect(page.locator('#skill-body-0')).not.toHaveClass(/hidden/);
  });

  test('Clicking again collapses', async ({ page }) => {
    await page.locator('[data-toggle="0"]').click();
    await page.waitForTimeout(100);
    await page.locator('[data-toggle="0"]').click();
    await page.waitForTimeout(100);
    await expect(page.locator('#skill-body-0')).toHaveClass(/hidden/);
  });

  test('Two accordions expand independently', async ({ page }) => {
    await page.locator('[data-toggle="0"]').click();
    await page.waitForTimeout(100);
    await expect(page.locator('#skill-body-0')).not.toHaveClass(/hidden/);
    await expect(page.locator('#skill-body-1')).toHaveClass(/hidden/);
    await page.locator('[data-toggle="1"]').click();
    await page.waitForTimeout(100);
    await expect(page.locator('#skill-body-0')).not.toHaveClass(/hidden/);
    await expect(page.locator('#skill-body-1')).not.toHaveClass(/hidden/);
  });
});
