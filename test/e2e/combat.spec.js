import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
  await expect(page.locator('#hpCurrentSpan')).toHaveText('8', { timeout: 8000 });
}

test.describe('Combat — Damage & Healing', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Take damage reduces Blood', async ({ page }) => {
    await page.locator('#hpDelta').fill('3');
    await page.locator('#btnDamage').click();
    await expect(page.locator('#hpCurrentSpan')).toHaveText('5');
  });

  test('Heal restores Blood up to max', async ({ page }) => {
    await page.locator('#hpDelta').fill('5');
    await page.locator('#btnDamage').click();
    await expect(page.locator('#hpCurrentSpan')).toHaveText('3');
    await page.locator('#hpDelta').fill('2');
    await page.locator('#btnHeal').click();
    await expect(page.locator('#hpCurrentSpan')).toHaveText('5');
  });

  test('Heal does not exceed max Blood', async ({ page }) => {
    await page.locator('#hpDelta').fill('1');
    await page.locator('#btnDamage').click();
    await page.locator('#hpDelta').fill('100');
    await page.locator('#btnHeal').click();
    await expect(page.locator('#hpCurrentSpan')).toHaveText('8');
  });

  test('Blood drops to 0, status becomes unconscious', async ({ page }) => {
    await page.evaluate(() => { window.st.hpCurrent = 2; window.save(); });
    await page.locator('#hpDelta').fill('5');
    await page.locator('#btnDamage').click();
    await expect(page.locator('#hpCurrentSpan')).toHaveText('0');
    const status = await page.evaluate(() => window.st.status);
    expect(['unconscious', 'stable']).toContain(status);
  });

  test('Death saves UI appears when Blood = 0', async ({ page }) => {
    await page.evaluate(() => { window.st.hpCurrent = 1; window.save(); });
    await page.locator('#hpDelta').fill('5');
    await page.locator('#btnDamage').click();
    await expect(page.locator('#deathSavesUI')).not.toHaveClass(/hidden/);
  });
});

test.describe('Combat — Death Saves', () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
    await page.evaluate(() => { window.st.hpCurrent = 0; window.st.status = 'unconscious'; window.save(); });
  });

  test('3 successes → stable', async ({ page }) => {
    for (let i = 0; i < 3; i++) await page.locator('#btnDsPlus').click();
    const status = await page.evaluate(() => window.st.status);
    expect(status).toBe('stable');
  });

  test('3 failures → dead', async ({ page }) => {
    for (let i = 0; i < 3; i++) await page.locator('#btnDsMinus').click();
    const status = await page.evaluate(() => window.st.status);
    expect(status).toBe('dead');
  });

  test('YOU DIED overlay appears on death', async ({ page }) => {
    for (let i = 0; i < 3; i++) await page.locator('#btnDsMinus').click();
    await page.waitForTimeout(100);
    await expect(page.locator('#youDiedOverlay')).not.toHaveClass(/hidden/);
  });

  test('Resurrect restores 1 Blood and clears overlay', async ({ page }) => {
    for (let i = 0; i < 3; i++) await page.locator('#btnDsMinus').click();
    await page.waitForTimeout(100);
    await page.locator('#btnResurrect').click();
    await expect(page.locator('#hpCurrentSpan')).toHaveText('1');
    await expect(page.locator('#youDiedOverlay')).toHaveClass(/hidden/);
  });

  test('Crit success counts as 2 successes', async ({ page }) => {
    await page.locator('#btnCrit').click();
    await page.waitForTimeout(100);
    const st = await page.evaluate(() => ({ hp: window.st.hpCurrent, status: window.st.status }));
    expect(st.hp).toBeGreaterThan(0);
    expect(st.status).toBe('alive');
  });

  test('Crit fail adds 2 failures', async ({ page }) => {
    await page.locator('#btnCritFail').click();
    const dsFail = await page.evaluate(() => window.st.dsFail);
    expect(dsFail).toBe(2);
  });

  test('Stabilize sets status to stable', async ({ page }) => {
    await page.locator('#btnStabilize').click();
    const status = await page.evaluate(() => window.st.status);
    expect(status).toBe('stable');
  });

  test('Heal from zero restores Blood and clears death saves', async ({ page }) => {
    await page.locator('#hpDelta').fill('4');
    await page.locator('#btnHealFromZero').click();
    await expect(page.locator('#hpCurrentSpan')).toHaveText('4');
    const st = await page.evaluate(() => ({ ds: window.st.dsSuccess, df: window.st.dsFail, status: window.st.status }));
    expect(st.ds).toBe(0);
    expect(st.df).toBe(0);
    expect(st.status).toBe('alive');
  });
});
