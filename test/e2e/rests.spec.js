import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
  await expect(page.locator('#hpCurrentSpan')).toHaveText('8', { timeout: 8000 });
}

test.describe('Short Rest', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Short rest prompt: 0 dice → no HP change', async ({ page }) => {
    await page.evaluate(() => { window.st.hpCurrent = 4; window.save(); });
    page.on('dialog', async d => {
      if (d.message().includes('Recovery Dice')) await d.accept('0');
      else await d.accept('0');
    });
    await page.locator('#btnShortRest').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#hpCurrentSpan')).toHaveText('4');
  });

  test('Short rest with dice heals HP', async ({ page }) => {
    await page.evaluate(() => { window.st.hpCurrent = 3; window.st.hdAvail = 2; window.save(); });
    let dialogs = 0;
    page.on('dialog', async d => {
      dialogs++;
      if (dialogs === 1) await d.accept('1');  // use 1 die
      else await d.accept('5');                 // rolled 5 HP
    });
    await page.locator('#btnShortRest').click();
    await page.waitForTimeout(300);
    await expect(page.locator('#hpCurrentSpan')).toHaveText('8');
  });
});

test.describe('Long Rest', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Long rest restores full Blood', async ({ page }) => {
    await page.evaluate(() => { window.st.hpCurrent = 3; window.save(); });
    await page.locator('#btnLongRest').click();
    await expect(page.locator('#hpCurrentSpan')).toHaveText('8');
  });

  test('Long rest clears death saves', async ({ page }) => {
    await page.evaluate(() => {
      window.st.dsSuccess = 2; window.st.dsFail = 1; window.st.status = 'unconscious';
      window.st.hpCurrent = 0; window.save();
    });
    await page.locator('#btnLongRest').click();
    const st = await page.evaluate(() => ({ ds: window.st.dsSuccess, df: window.st.dsFail, status: window.st.status }));
    expect(st.ds).toBe(0);
    expect(st.df).toBe(0);
    expect(st.status).toBe('alive');
  });

  test('Long rest triggers level up when XP is sufficient', async ({ page }) => {
    await page.evaluate(() => { window.st.xp = 6500; window.save(); }); // level 5
    await page.locator('#btnLongRest').click();
    await page.waitForTimeout(200);
    await page.locator('button[data-tab="basicinfo"]').click();
    await page.waitForTimeout(150);
    await expect(page.locator('#levelSpan')).toHaveText('5');
  });

  test('Long rest recovers hit dice (up to half max, rounded up)', async ({ page }) => {
    // Level 4 = 4 HD max. Use all 4, then long rest → recover 2
    await page.evaluate(() => {
      window.st.level = 4; window.st.hdAvail = 0; window.save();
    });
    await page.locator('#btnLongRest').click();
    await page.waitForTimeout(150);
    const hdAvail = await page.evaluate(() => window.st.hdAvail);
    expect(hdAvail).toBe(2); // ceil(4/2) = 2
  });

  test('HD max equals level', async ({ page }) => {
    await page.evaluate(() => { window.st.xp = 6500; window.save(); });
    await page.locator('#btnLongRest').click();
    await page.waitForTimeout(200);
    await page.locator('button[data-tab="basicinfo"]').click();
    await page.waitForTimeout(150);
    const level = await page.evaluate(() => window.st.level);
    await expect(page.locator('#hdMaxSpan')).toHaveText(String(level));
  });
});
