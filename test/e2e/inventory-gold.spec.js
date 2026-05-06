import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
  await expect(page.locator('#hpCurrentSpan')).toHaveText('8', { timeout: 8000 });
  await page.locator('button[data-tab="inventory"]').click();
  await page.waitForTimeout(150);
}

async function addItem(page, name, qty = 1, note = '') {
  await page.locator('#btnInvAdd').click();
  await page.locator('#invName').fill(name);
  await page.locator('#invQty').fill(String(qty));
  if (note) await page.locator('#invNote').fill(note);
  await page.locator('#invSave').click();
  await page.waitForTimeout(150);
}

test.describe('Inventory — Items CRUD', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Add item appears in table', async ({ page }) => {
    await addItem(page, 'Rope', 2, '50 ft');
    await expect(page.locator('.data-table td').nth(1)).toContainText('Rope');
  });

  test('Qty and note saved correctly', async ({ page }) => {
    await addItem(page, 'Lantern', 1, 'magical');
    const cells = page.locator('.data-table tbody tr:first-child td');
    await expect(cells.nth(2)).toHaveText('1');
    await expect(cells.nth(3)).toContainText('magical');
  });

  test('Empty name is rejected', async ({ page }) => {
    await page.locator('#btnInvAdd').click();
    page.on('dialog', d => d.accept());
    await page.locator('#invSave').click();
    const count = await page.evaluate(() => window.st.inventory.length);
    expect(count).toBe(0);
  });

  test('Edit item updates row', async ({ page }) => {
    await addItem(page, 'Sword', 1);
    await page.locator('[data-edit="0"]').click();
    await page.locator('#invName').fill('Longsword');
    await page.locator('#invQty').fill('2');
    await page.locator('#invSave').click();
    await page.waitForTimeout(150);
    await expect(page.locator('.data-table td').nth(1)).toContainText('Longsword');
    await expect(page.locator('.data-table td').nth(2)).toHaveText('2');
  });

  test('Delete item removes row', async ({ page }) => {
    await addItem(page, 'Shield', 1);
    page.on('dialog', d => d.accept());
    await page.locator('[data-del="0"]').click();
    await page.waitForTimeout(150);
    const count = await page.evaluate(() => window.st.inventory.length);
    expect(count).toBe(0);
  });

  test('Multiple items — correct count', async ({ page }) => {
    await addItem(page, 'Item A');
    await addItem(page, 'Item B');
    await addItem(page, 'Item C');
    const rows = page.locator('.data-table tbody tr');
    await expect(rows).toHaveCount(3);
  });

  test('Cancel add closes modal without saving', async ({ page }) => {
    await page.locator('#btnInvAdd').click();
    await page.locator('#invName').fill('Ghost');
    await page.locator('#invCancel').click();
    await page.waitForTimeout(100);
    const count = await page.evaluate(() => window.st.inventory.length);
    expect(count).toBe(0);
  });
});

test.describe('Inventory — Gold', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Gain gold adds correctly', async ({ page }) => {
    await page.locator('#goldGoldInput').fill('10');
    await page.locator('#goldGainBtn').click();
    await expect(page.locator('#goldGoldSpan')).toHaveText('10');
  });

  test('Gain multiple denominations', async ({ page }) => {
    await page.locator('#goldPlatinumInput').fill('2');
    await page.locator('#goldSilverInput').fill('5');
    await page.locator('#goldGainBtn').click();
    await expect(page.locator('#goldPlatinumSpan')).toHaveText('2');
    await expect(page.locator('#goldSilverSpan')).toHaveText('5');
  });

  test('Spend gold subtracts', async ({ page }) => {
    await page.evaluate(() => {
      window.st.goldGold = 20; window.save();
    });
    await page.waitForTimeout(100);
    await page.locator('#goldGoldInput').fill('7');
    await page.locator('#goldSpendBtn').click();
    await expect(page.locator('#goldGoldSpan')).toHaveText('13');
  });

  test('Spend shows error when insufficient', async ({ page }) => {
    await page.locator('#goldGoldInput').fill('100');
    await page.locator('#goldSpendBtn').click();
    await expect(page.locator('#goldSpendError')).not.toHaveClass(/hidden/);
  });

  test('Spend with cross-denomination borrowing', async ({ page }) => {
    await page.evaluate(() => {
      window.st.goldGold = 1; window.st.goldSilver = 0; window.save();
    });
    await page.waitForTimeout(100);
    await page.locator('#goldSilverInput').fill('5');
    await page.locator('#goldSpendBtn').click();
    // 1 GP = 10 SP, so after spending 5 SP we should have 0 GP, 5 SP
    const sp = await page.evaluate(() => window.st.goldSilver);
    const gp = await page.evaluate(() => window.st.goldGold);
    expect(sp).toBe(5);
    expect(gp).toBe(0);
  });

  test('Gold persists after reload', async ({ page }) => {
    await page.evaluate(() => { window.st.goldGold = 42; window.save(); });
    await page.reload();
    await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
    await page.locator('button[data-tab="inventory"]').click();
    await page.waitForTimeout(150);
    await expect(page.locator('#goldGoldSpan')).toHaveText('42');
  });
});
