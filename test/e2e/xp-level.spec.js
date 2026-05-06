import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
  await expect(page.locator('#hpCurrentSpan')).toHaveText('8', { timeout: 8000 });
  await page.locator('button[data-tab="basicinfo"]').click();
  await page.waitForTimeout(150);
}

test.describe('XP — Adding Experience', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Adding XP updates display', async ({ page }) => {
    await page.locator('#xpAddInput').fill('500');
    await page.locator('#btnAddXp').click();
    await expect(page.locator('#xpDisplay')).toHaveText('500');
  });

  test('Multiple XP additions accumulate', async ({ page }) => {
    await page.locator('#xpAddInput').fill('300');
    await page.locator('#btnAddXp').click();
    await page.locator('#xpAddInput').fill('200');
    await page.locator('#btnAddXp').click();
    await expect(page.locator('#xpDisplay')).toHaveText('500');
  });

  test('XP input clears after adding', async ({ page }) => {
    await page.locator('#xpAddInput').fill('100');
    await page.locator('#btnAddXp').click();
    await expect(page.locator('#xpAddInput')).toHaveValue('');
  });

  test('XP does NOT immediately level up', async ({ page }) => {
    await page.locator('#xpAddInput').fill('6500');
    await page.locator('#btnAddXp').click();
    await expect(page.locator('#levelSpan')).toHaveText('1');
  });

  test('XP persists after reload', async ({ page }) => {
    await page.locator('#xpAddInput').fill('900');
    await page.locator('#btnAddXp').click();
    await page.reload();
    await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
    await page.locator('button[data-tab="basicinfo"]').click();
    await page.waitForTimeout(150);
    await expect(page.locator('#xpDisplay')).toHaveText('900');
  });
});

test.describe('Level Progression', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('XP thresholds by level', async ({ page }) => {
    const thresholds = [
      { xp: 300,    level: 2  },
      { xp: 900,    level: 3  },
      { xp: 6500,   level: 5  },
      { xp: 14000,  level: 6  },
      { xp: 85000,  level: 11 },
      { xp: 355000, level: 20 },
    ];
    for (const { xp, level } of thresholds) {
      await page.evaluate(xp => { window.st.xp = xp; window.st.level = 1; window.save(); }, xp);
      await page.locator('#btnLongRest').click();
      await page.waitForTimeout(150);
      await page.locator('button[data-tab="basicinfo"]').click();
      await page.waitForTimeout(100);
      await expect(page.locator('#levelSpan')).toHaveText(String(level));
    }
  });

  test('Prof bonus increases with level', async ({ page }) => {
    const cases = [
      { xp: 0,      prof: 2 },
      { xp: 6500,   prof: 3 },
      { xp: 14000,  prof: 3 },
      { xp: 85000,  prof: 4 },
      { xp: 100000, prof: 4 },
      { xp: 140000, prof: 5 },
      { xp: 265000, prof: 6 },
    ];
    for (const { xp, prof } of cases) {
      await page.evaluate(xp => { window.st.xp = xp; window.st.level = 1; window.save(); }, xp);
      if (xp > 0) {
        await page.locator('#btnLongRest').click();
        await page.waitForTimeout(150);
      }
      await expect(page.locator('#profSpan')).toHaveText(`+${prof}`);
    }
  });

  test('HP increases with level', async ({ page }) => {
    const base = parseInt(await page.locator('#hpMaxSpan').textContent());
    await page.evaluate(xp => { window.st.xp = xp; window.save(); }, 300);
    await page.locator('#btnLongRest').click();
    await page.waitForTimeout(150);
    const newHP = parseInt(await page.locator('#hpMaxSpan').textContent());
    expect(newHP).toBeGreaterThan(base);
  });
});
