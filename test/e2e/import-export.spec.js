import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

async function ready(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__tabsLoaded === true, { timeout: 10000 });
  await expect(page.locator('#hpCurrentSpan')).toHaveText('8', { timeout: 8000 });
}

test.describe('Export', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Export produces valid JSON bundle', async ({ page }) => {
    await page.evaluate(() => {
      window.st.name = 'Aragorn';
      window.st.xp = 1000;
      window.save();
    });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#btnExport').click(),
    ]);
    const tmpPath = path.join(os.tmpdir(), download.suggestedFilename());
    await download.saveAs(tmpPath);
    const content = JSON.parse(fs.readFileSync(tmpPath, 'utf8'));
    expect(content.schema).toBe('heroSheetBundle/v1');
    expect(content.state.name).toBe('Aragorn');
    expect(content.state.xp).toBe(1000);
    fs.unlinkSync(tmpPath);
  });
});

test.describe('Import', () => {
  test.beforeEach(async ({ page }) => { await ready(page); });

  test('Import bundle restores state', async ({ page }) => {
    const bundle = {
      schema: 'heroSheetBundle/v1',
      state: {
        name: 'Gandalf',
        xp: 5000,
        level: 3,
        str: 12, dex: 14, con: 16, int_: 20, wis: 18, cha: 14,
        hpCurrent: 20,
        skills: [{ name: 'Wizardry', level: 3, description: 'Cast powerful spells.' }],
        inventory: [{ name: 'Staff', qty: 1, note: 'magical' }],
        languages: [{ name: 'Ancient' }],
        instruments: [],
        bond: 'The Fellowship', flow: 'Wisdom', flaw: 'Too secretive', personality: 'Wise',
        goldGold: 100,
        goldPlatinum: 0, goldSilver: 0, goldCopper: 0,
      },
    };
    const tmpPath = path.join(os.tmpdir(), 'hero-import-test.json');
    fs.writeFileSync(tmpPath, JSON.stringify(bundle));

    await page.locator('#importFile').setInputFiles(tmpPath);
    await page.waitForTimeout(400);

    await expect(page.locator('#hpCurrentSpan')).toHaveText('20');
    const name = await page.evaluate(() => window.st.name);
    expect(name).toBe('Gandalf');
    const skills = await page.evaluate(() => window.st.skills.length);
    expect(skills).toBe(1);
    const inv = await page.evaluate(() => window.st.inventory.length);
    expect(inv).toBe(1);

    fs.unlinkSync(tmpPath);
  });

  test('Import raw state (no schema wrapper)', async ({ page }) => {
    const state = { name: 'Legolas', xp: 300, level: 2, hpCurrent: 15 };
    const tmpPath = path.join(os.tmpdir(), 'hero-import-raw.json');
    fs.writeFileSync(tmpPath, JSON.stringify(state));
    await page.locator('#importFile').setInputFiles(tmpPath);
    await page.waitForTimeout(400);
    const name = await page.evaluate(() => window.st.name);
    expect(name).toBe('Legolas');
    fs.unlinkSync(tmpPath);
  });
});
