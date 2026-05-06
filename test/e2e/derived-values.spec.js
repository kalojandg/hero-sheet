import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
  await expect(page.locator('#hpCurrentSpan')).toHaveText('8', { timeout: 8000 });
}

async function goTab(page, tab) {
  await page.locator(`button[data-tab="${tab}"]`).click();
  await page.waitForTimeout(150);
}

test.describe('Derived Values — Modifiers', () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
    await goTab(page, 'stats');
  });

  test('All 6 ability modifiers compute correctly', async ({ page }) => {
    const cases = [
      { inp: '#strInput', span: '#strModSpan', score: 16, exp: '+3' },
      { inp: '#dexInput', span: '#dexModSpan', score: 18, exp: '+4' },
      { inp: '#conInput', span: '#conModSpan', score: 14, exp: '+2' },
      { inp: '#intInput', span: '#intModSpan', score: 12, exp: '+1' },
      { inp: '#wisInput', span: '#wisModSpan', score:  8, exp: '-1' },
      { inp: '#chaInput', span: '#chaModSpan', score: 20, exp: '+5' },
    ];
    for (const c of cases) {
      await page.locator(c.inp).fill(String(c.score));
      await page.locator(c.inp).blur();
      await expect(page.locator(c.span)).toHaveText(c.exp);
    }
  });

  test('10 and 11 both give +0', async ({ page }) => {
    await page.locator('#strInput').fill('10');
    await page.locator('#strInput').blur();
    await expect(page.locator('#strModSpan')).toHaveText('+0');
    await page.locator('#strInput').fill('11');
    await page.locator('#strInput').blur();
    await expect(page.locator('#strModSpan')).toHaveText('+0');
  });

  test('Negative modifiers -1 through -5', async ({ page }) => {
    const cases = [
      { score: 9, exp: '-1' }, { score: 7, exp: '-2' }, { score: 5, exp: '-3' },
      { score: 3, exp: '-4' }, { score: 1, exp: '-5' },
    ];
    for (const c of cases) {
      await page.locator('#strInput').fill(String(c.score));
      await page.locator('#strInput').blur();
      await page.waitForTimeout(80);
      await expect(page.locator('#strModSpan')).toHaveText(c.exp);
    }
  });
});

test.describe('Derived Values — Saving Throws', () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
    await goTab(page, 'stats');
  });

  test('Save = mod (no prof)', async ({ page }) => {
    await page.locator('#strInput').fill('16');
    await page.locator('#strInput').blur();
    await expect(page.locator('#saveStrTotalSpan')).toHaveText('+3');
  });

  test('Save = mod + prof (with prof)', async ({ page }) => {
    await page.locator('#strInput').fill('16');
    await page.locator('#strInput').blur();
    await page.locator('#saveStrProf').check();
    await expect(page.locator('#saveStrTotalSpan')).toHaveText('+5'); // +3 mod +2 prof
  });

  test('Toggle prof on/off', async ({ page }) => {
    await page.locator('#intInput').fill('16');
    await page.locator('#intInput').blur();
    await expect(page.locator('#saveIntTotalSpan')).toHaveText('+3');
    await page.locator('#saveIntProf').check();
    await expect(page.locator('#saveIntTotalSpan')).toHaveText('+5');
    await page.locator('#saveIntProf').uncheck();
    await expect(page.locator('#saveIntTotalSpan')).toHaveText('+3');
  });

  test('Save all bonus adds globally', async ({ page }) => {
    await page.locator('#strInput').fill('10');
    await page.locator('#strInput').blur();
    await expect(page.locator('#saveStrTotalSpan')).toHaveText('+0');
    await page.locator('#saveAllBonusInput').fill('3');
    await page.locator('#saveAllBonusInput').blur();
    await expect(page.locator('#saveStrTotalSpan')).toHaveText('+3');
    await expect(page.locator('#saveDexTotalSpan')).toHaveText('+3');
  });

  test('Negative mod cascades to save', async ({ page }) => {
    await page.locator('#strInput').fill('8');
    await page.locator('#strInput').blur();
    await expect(page.locator('#saveStrTotalSpan')).toHaveText('-1');
    await page.locator('#saveStrProf').check();
    await expect(page.locator('#saveStrTotalSpan')).toHaveText('+1'); // -1 + 2
  });
});

test.describe('Derived Values — HP / Blood', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Initial Blood = 8 (level 1, CON 10)', async ({ page }) => {
    await expect(page.locator('#hpCurrentSpan')).toHaveText('8');
    await expect(page.locator('#hpMaxSpan')).toHaveText('8');
  });

  test('CON change updates max blood', async ({ page }) => {
    await goTab(page, 'stats');
    await page.locator('#conInput').fill('16'); // mod +3
    await page.locator('#conInput').blur();
    await expect(page.locator('#hpMaxSpan')).toHaveText('11'); // 8 + 3
  });

  test('Tough adds +2 HP per level', async ({ page }) => {
    await goTab(page, 'basicinfo');
    const before = parseInt(await page.locator('#maxBloodSpan').textContent());
    await page.locator('#toughChk').check();
    const after = parseInt(await page.locator('#maxBloodSpan').textContent());
    expect(after).toBe(before + 2); // +2 at level 1
  });

  test('Homebrew adjustment stacks', async ({ page }) => {
    await goTab(page, 'basicinfo');
    const base = parseInt(await page.locator('#maxBloodSpan').textContent());
    await page.locator('#homebrewHp').fill('5');
    await page.locator('#homebrewHp').blur();
    await expect(page.locator('#maxBloodSpan')).toHaveText(String(base + 5));
  });

  test('Negative homebrew clamps to 1', async ({ page }) => {
    await goTab(page, 'basicinfo');
    await page.locator('#homebrewHp').fill('-100');
    await page.locator('#homebrewHp').blur();
    await expect(page.locator('#maxBloodSpan')).toHaveText('1');
  });
});

test.describe('Derived Values — AC & Attack Bonuses', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Initial AC = 10 (DEX 10, no magic)', async ({ page }) => {
    await expect(page.locator('#acSpan')).toHaveText('10');
  });

  test('AC = 10 + DEX mod', async ({ page }) => {
    await goTab(page, 'stats');
    await page.locator('#dexInput').fill('16'); // mod +3
    await page.locator('#dexInput').blur();
    await expect(page.locator('#acSpan')).toHaveText('13');
  });

  test('AC magic bonus adds', async ({ page }) => {
    await goTab(page, 'basicinfo');
    await page.locator('#acMagicInput').fill('2');
    await page.locator('#acMagicInput').blur();
    await expect(page.locator('#acSpan')).toHaveText('12');
  });

  test('WIS does NOT affect AC (generic hero)', async ({ page }) => {
    await goTab(page, 'stats');
    await page.locator('#wisInput').fill('20'); // mod +5
    await page.locator('#wisInput').blur();
    await expect(page.locator('#acSpan')).toHaveText('10'); // unchanged
  });

  test('Melee Atk uses STR by default', async ({ page }) => {
    await expect(page.locator('#meleeAtkSpan')).toHaveText('+2'); // STR 10 mod 0 + prof 2
    await goTab(page, 'stats');
    await page.locator('#strInput').fill('16'); // mod +3
    await page.locator('#strInput').blur();
    await expect(page.locator('#meleeAtkSpan')).toHaveText('+5'); // +3 + 2
  });

  test('Switch melee to DEX', async ({ page }) => {
    await goTab(page, 'stats');
    await page.locator('#dexInput').fill('18'); // mod +4
    await page.locator('#dexInput').blur();
    await goTab(page, 'basicinfo');
    await page.locator('#meleeStatSelect').selectOption('dex');
    await expect(page.locator('#meleeAtkSpan')).toHaveText('+6'); // +4 + 2
  });

  test('Ranged Atk uses DEX', async ({ page }) => {
    await goTab(page, 'stats');
    await page.locator('#dexInput').fill('18'); // mod +4
    await page.locator('#dexInput').blur();
    await expect(page.locator('#rangedAtkSpan')).toHaveText('+6');
  });

  test('Magic bonuses are independent', async ({ page }) => {
    await goTab(page, 'basicinfo');
    await page.locator('#meleeMagicInput').fill('1');
    await page.locator('#meleeMagicInput').blur();
    await page.locator('#rangedMagicInput').fill('3');
    await page.locator('#rangedMagicInput').blur();
    await expect(page.locator('#meleeAtkSpan')).toHaveText('+3');
    await expect(page.locator('#rangedAtkSpan')).toHaveText('+5');
  });
});

test.describe('Derived Values — Proficiency & Level', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Prof +2 at level 1', async ({ page }) => {
    await expect(page.locator('#profSpan')).toHaveText('+2');
  });

  test('Level up on Long Rest, prof increases at level 5', async ({ page }) => {
    await page.evaluate(xp => { window.st.xp = xp; window.save(); }, 6500);
    await page.locator('#btnLongRest').click();
    await page.waitForTimeout(200);
    await goTab(page, 'basicinfo');
    await expect(page.locator('#levelSpan')).toHaveText('5');
    await expect(page.locator('#profSpan')).toHaveText('+3');
  });

  test('Level does NOT increase from XP alone', async ({ page }) => {
    await page.evaluate(xp => { window.st.xp = xp; window.save(); }, 6500);
    await page.waitForTimeout(150);
    await goTab(page, 'basicinfo');
    await expect(page.locator('#levelSpan')).toHaveText('1');
  });

  test('Level 20 gives prof +6', async ({ page }) => {
    await page.evaluate(xp => { window.st.xp = xp; window.save(); }, 355000);
    await page.locator('#btnLongRest').click();
    await page.waitForTimeout(200);
    await goTab(page, 'basicinfo');
    await expect(page.locator('#levelSpan')).toHaveText('20');
    await expect(page.locator('#profSpan')).toHaveText('+6');
  });
});

test.describe('Derived Values — Save DC', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Save DC = 8 + prof + WIS mod (default WIS stat)', async ({ page }) => {
    // WIS 10 (mod 0), prof 2 → DC 10
    await expect(page.locator('#saveDcSpan')).toHaveText('10');
  });

  test('WIS change updates Save DC', async ({ page }) => {
    await goTab(page, 'stats');
    await page.locator('#wisInput').fill('16'); // mod +3
    await page.locator('#wisInput').blur();
    await expect(page.locator('#saveDcSpan')).toHaveText('13'); // 8 + 2 + 3
  });

  test('DC magic bonus adds', async ({ page }) => {
    await goTab(page, 'basicinfo');
    await page.locator('#saveDcMagicInput').fill('2');
    await page.locator('#saveDcMagicInput').blur();
    await expect(page.locator('#saveDcSpan')).toHaveText('12');
  });

  test('Switch DC stat to STR', async ({ page }) => {
    await goTab(page, 'stats');
    await page.locator('#strInput').fill('16'); // mod +3
    await page.locator('#strInput').blur();
    await goTab(page, 'basicinfo');
    await page.locator('#saveDcStatSelect').selectOption('str');
    await expect(page.locator('#saveDcSpan')).toHaveText('13');
  });
});
