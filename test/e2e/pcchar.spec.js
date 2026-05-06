import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
  await expect(page.locator('#hpCurrentSpan')).toHaveText('8', { timeout: 8000 });
  await page.locator('button[data-tab="pcchar"]').click();
  await page.waitForTimeout(150);
}

test.describe('PC Char — Languages', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Add language appears in table', async ({ page }) => {
    await page.locator('#btnLangAdd').click();
    await page.locator('#pcModalName').fill('Common');
    await page.locator('#pcModalSave').click();
    await page.waitForTimeout(150);
    await expect(page.locator('#langTableRoot')).toContainText('Common');
  });

  test('Multiple languages saved', async ({ page }) => {
    for (const lang of ['Elvish', 'Dwarvish']) {
      await page.locator('#btnLangAdd').click();
      await page.locator('#pcModalName').fill(lang);
      await page.locator('#pcModalSave').click();
      await page.waitForTimeout(150);
    }
    const count = await page.evaluate(() => window.st.languages.length);
    expect(count).toBe(2);
  });

  test('Edit language updates row', async ({ page }) => {
    await page.evaluate(() => {
      window.st.languages = [{ name: 'Orcish' }]; window.save();
    });
    await page.waitForTimeout(150);
    await page.locator('[data-lang-edit="0"]').click();
    await page.locator('#pcModalName').fill('Goblin');
    await page.locator('#pcModalSave').click();
    await page.waitForTimeout(150);
    await expect(page.locator('#langTableRoot')).toContainText('Goblin');
  });

  test('Delete language removes it', async ({ page }) => {
    await page.evaluate(() => { window.st.languages = [{ name: 'Sylvan' }]; window.save(); });
    await page.waitForTimeout(150);
    page.on('dialog', d => d.accept());
    await page.locator('[data-lang-del="0"]').click();
    await page.waitForTimeout(150);
    const count = await page.evaluate(() => window.st.languages.length);
    expect(count).toBe(0);
  });
});

test.describe('PC Char — Instruments', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Add instrument appears in table', async ({ page }) => {
    await page.locator('#btnInstrAdd').click();
    await expect(page.locator('#pcModalTitle')).toContainText('Instrument');
    await page.locator('#pcModalName').fill('Lute');
    await page.locator('#pcModalSave').click();
    await page.waitForTimeout(150);
    await expect(page.locator('#instrTableRoot')).toContainText('Lute');
  });

  test('Instrument saves to state', async ({ page }) => {
    await page.locator('#btnInstrAdd').click();
    await page.locator('#pcModalName').fill('Drum');
    await page.locator('#pcModalSave').click();
    await page.waitForTimeout(150);
    const inst = await page.evaluate(() => window.st.instruments[0]?.name);
    expect(inst).toBe('Drum');
  });

  test('Delete instrument removes it', async ({ page }) => {
    await page.evaluate(() => { window.st.instruments = [{ name: 'Harp' }]; window.save(); });
    await page.waitForTimeout(150);
    page.on('dialog', d => d.accept());
    await page.locator('[data-instr-del="0"]').click();
    await page.waitForTimeout(150);
    const count = await page.evaluate(() => window.st.instruments.length);
    expect(count).toBe(0);
  });
});

test.describe('PC Char — Traits', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Bond textarea saves to state', async ({ page }) => {
    await page.locator('#pcBond').fill('Protect the village');
    await page.locator('#pcBond').blur();
    const bond = await page.evaluate(() => window.st.bond);
    expect(bond).toBe('Protect the village');
  });

  test('Flow (motivation) textarea saves', async ({ page }) => {
    await page.locator('#pcFlow').fill('Freedom above all');
    await page.locator('#pcFlow').blur();
    const flow = await page.evaluate(() => window.st.flow);
    expect(flow).toBe('Freedom above all');
  });

  test('Flaw textarea saves', async ({ page }) => {
    await page.locator('#pcFlaw').fill('Too proud to ask for help');
    await page.locator('#pcFlaw').blur();
    const flaw = await page.evaluate(() => window.st.flaw);
    expect(flaw).toBe('Too proud to ask for help');
  });

  test('Personality textarea saves', async ({ page }) => {
    await page.locator('#pcPersonality').fill('Bold and reckless');
    await page.locator('#pcPersonality').blur();
    const p = await page.evaluate(() => window.st.personality);
    expect(p).toBe('Bold and reckless');
  });

  test('Traits persist after reload', async ({ page }) => {
    await page.locator('#pcBond').fill('My oath');
    await page.locator('#pcBond').blur();
    await page.reload();
    await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
    await page.locator('button[data-tab="pcchar"]').click();
    await page.waitForTimeout(150);
    await expect(page.locator('#pcBond')).toHaveValue('My oath');
  });
});
