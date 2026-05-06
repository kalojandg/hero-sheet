import { test, expect } from '@playwright/test';

async function freshPage(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
  await expect(page.locator('#hpCurrentSpan')).toHaveText('8', { timeout: 8000 });
}

async function pageWithChar(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
  await page.evaluate(() => { window.st.name = 'Aragorn'; window.st.xp = 500; window.save(); });
}

test.describe('New Character — button & confirmation', () => {
  test('Button exists in header', async ({ page }) => {
    await freshPage(page);
    await expect(page.locator('#btnNewChar')).toBeVisible();
  });

  test('Fresh page — no confirm, modal opens directly', async ({ page }) => {
    await freshPage(page);
    await page.locator('#btnNewChar').click();
    await expect(page.locator('#newCharModal')).not.toHaveClass(/hidden/);
  });

  test('With saved character — confirm dialog appears', async ({ page }) => {
    await pageWithChar(page);
    let prompted = false;
    page.on('dialog', async d => { prompted = true; await d.dismiss(); });
    await page.locator('#btnNewChar').click();
    await page.waitForTimeout(200);
    expect(prompted).toBe(true);
  });

  test('Dismiss confirm — modal stays closed, character unchanged', async ({ page }) => {
    await pageWithChar(page);
    page.on('dialog', d => d.dismiss());
    await page.locator('#btnNewChar').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#newCharModal')).toHaveClass(/hidden/);
    const name = await page.evaluate(() => window.st.name);
    expect(name).toBe('Aragorn');
  });

  test('Accept confirm — modal opens', async ({ page }) => {
    await pageWithChar(page);
    page.on('dialog', d => d.accept());
    await page.locator('#btnNewChar').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#newCharModal')).not.toHaveClass(/hidden/);
  });

  test('Confirm message mentions export', async ({ page }) => {
    await pageWithChar(page);
    let msg = '';
    page.on('dialog', async d => { msg = d.message(); await d.dismiss(); });
    await page.locator('#btnNewChar').click();
    await page.waitForTimeout(200);
    expect(msg.toLowerCase()).toMatch(/експорт|export/);
  });
});

test.describe('New Character — die selector', () => {
  test.beforeEach(async ({ page }) => { await freshPage(page); });

  test('Modal has options d6 d8 d10 d12', async ({ page }) => {
    await page.locator('#btnNewChar').click();
    const sel = page.locator('#newCharDie');
    await expect(sel.locator('option[value="6"]')).toHaveCount(1);
    await expect(sel.locator('option[value="8"]')).toHaveCount(1);
    await expect(sel.locator('option[value="10"]')).toHaveCount(1);
    await expect(sel.locator('option[value="12"]')).toHaveCount(1);
  });

  test('Cancel closes modal without touching state', async ({ page }) => {
    await page.evaluate(() => { window.st.name = 'Bilbo'; window.save(); });
    page.on('dialog', d => d.accept()); // accept confirm since localStorage is now populated
    await page.locator('#btnNewChar').click();
    await page.locator('#newCharCancel').click();
    await page.waitForTimeout(100);
    await expect(page.locator('#newCharModal')).toHaveClass(/hidden/);
    expect(await page.evaluate(() => window.st.name)).toBe('Bilbo');
  });

  test('Create with d10 — hdDie saved as 10', async ({ page }) => {
    await page.locator('#btnNewChar').click();
    await page.locator('#newCharDie').selectOption('10');
    await page.locator('#newCharConfirm').click();
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.st.hdDie)).toBe(10);
  });

  test('Create with d6 — Blood shows 6', async ({ page }) => {
    await page.locator('#btnNewChar').click();
    await page.locator('#newCharDie').selectOption('6');
    await page.locator('#newCharConfirm').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#hpCurrentSpan')).toHaveText('6');
  });

  test('Create with d8 — Blood shows 8', async ({ page }) => {
    await page.locator('#btnNewChar').click();
    await page.locator('#newCharDie').selectOption('8');
    await page.locator('#newCharConfirm').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#hpCurrentSpan')).toHaveText('8');
  });

  test('Create with d10 — Blood shows 10', async ({ page }) => {
    await page.locator('#btnNewChar').click();
    await page.locator('#newCharDie').selectOption('10');
    await page.locator('#newCharConfirm').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#hpCurrentSpan')).toHaveText('10');
  });

  test('Create with d12 — Blood shows 12', async ({ page }) => {
    await page.locator('#btnNewChar').click();
    await page.locator('#newCharDie').selectOption('12');
    await page.locator('#newCharConfirm').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#hpCurrentSpan')).toHaveText('12');
  });

  test('Create resets XP, skills and inventory', async ({ page }) => {
    await page.evaluate(() => {
      window.st.xp = 5000;
      window.st.skills = [{ name: 'Fireball', level: 1, description: 'Burns' }];
      window.st.inventory = [{ name: 'Sword', qty: 1, note: '' }];
      window.save();
    });
    page.on('dialog', d => d.accept()); // accept confirm since localStorage is now populated
    await page.locator('#btnNewChar').click();
    await page.locator('#newCharConfirm').click();
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.st.xp)).toBe(0);
    expect(await page.evaluate(() => window.st.skills.length)).toBe(0);
    expect(await page.evaluate(() => window.st.inventory.length)).toBe(0);
  });

  test('hdDie persists after reload', async ({ page }) => {
    await page.locator('#btnNewChar').click();
    await page.locator('#newCharDie').selectOption('12');
    await page.locator('#newCharConfirm').click();
    await page.waitForTimeout(200);
    await page.reload();
    await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
    expect(await page.evaluate(() => window.st.hdDie)).toBe(12);
  });
});

test.describe('New Character — short rest die label', () => {
  test('Short rest second prompt shows correct die (d10)', async ({ page }) => {
    await freshPage(page);
    await page.locator('#btnNewChar').click();
    await page.locator('#newCharDie').selectOption('10');
    await page.locator('#newCharConfirm').click();
    await page.waitForTimeout(200);

    await page.evaluate(() => { window.st.hpCurrent = 5; window.st.hdAvail = 2; window.save(); });

    const msgs = [];
    page.on('dialog', async d => {
      msgs.push(d.message());
      if (msgs.length === 1) await d.accept('1');  // use 1 die
      else await d.accept('0');                     // rolled 0
    });
    await page.locator('#btnShortRest').click();
    await page.waitForTimeout(400);
    expect(msgs[1]).toContain('d10');
  });
});
