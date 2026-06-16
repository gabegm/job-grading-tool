/**
 * Screenshot capture script for the Job Grading Tool.
 * Starts the Vite dev server, navigates to each page, and captures screenshots.
 * 
 * Usage: npx playwright test screenshot-capture.ts
 * Or: node --experimental-strip-types screenshot-capture.ts
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCREENSHOT_DIR = join(__dirname, '..', 'public', 'screenshots');
const BASE_URL = 'http://localhost:5173';

// Ensure screenshot directory exists
mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function captureScreenshot(page, filename, options = {}) {
  const path = join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path, ...options });
  console.log(`  ✓ Saved: ${filename}`);
}

async function main() {
  console.log('📸 Capturing screenshots for Job Grading Tool...\n');

  const browser = await chromium.launch();
  const context = await browser.newContext({ 
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2, // Retina quality
  });
  const page = await context.newPage();

  try {
    // 1. Company Setup (new project, no company set up yet)
    console.log('\n📋 Company Setup screen...');
    await page.goto(BASE_URL);
    await page.waitForSelector('.section-title', { timeout: 10000 });
    await page.waitForTimeout(1000); // Let animations settle
    await captureScreenshot(page, 'company-setup.png');

    // 2. Fill out company setup and save
    console.log('\n📋 Filling out company setup...');
    await page.fill('input[placeholder="e.g., Acme Corporation"]', 'Acme Corporation');
    // Click on visible label text instead of hidden inputs
    await page.click('label:has-text("$50 Million to $250 Million")');
    await page.click('label:has-text("501 to 2,500 employees")');
    await page.click('label:has-text("Regional (Multi-Country)")');
    await page.click('label:has-text("Multi-Business")');
    await page.click('button:has-text("Save & Continue")');
    await page.waitForSelector('.section-title', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await captureScreenshot(page, 'company-setup-filled.png');

    // 3. Import Roles (step 1)
    console.log('\n📥 Import Roles screen...');
    await page.click('button:has-text("Import Roles")');
    await page.waitForTimeout(1000);
    await captureScreenshot(page, 'import-roles.png');

    // 4. Grade a Role (step 2)
    console.log('\n📝 Grade a Role screen...');
    await page.click('button:has-text("Continue to Grading")');
    await page.waitForTimeout(1000);
    
    // Click "Grade This Role" for the first ungraded role
    const gradeButtons = await page.$$('button:has-text("Grade This Role")');
    if (gradeButtons.length > 0) {
      await gradeButtons[0].click();
      await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });
      await page.waitForTimeout(1000);
      await captureScreenshot(page, 'grade-role.png');
    }

    // 5. Review Panel (step 3)
    console.log('\n📊 Review Panel screen...');
    await page.click('button:has-text("Review All Roles")');
    await page.waitForTimeout(1000);
    await captureScreenshot(page, 'review-panel.png');

    // 6. Settings → Weightings (step 4)
    console.log('\n⚙️ Settings → Weightings screen...');
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(1000);
    await captureScreenshot(page, 'settings-weightings.png');

    // 7. Settings → Questionnaire
    console.log('\n📋 Settings → Questionnaire screen...');
    await page.click('button:has-text("Questionnaire")');
    await page.waitForTimeout(1000);
    await captureScreenshot(page, 'settings-questionnaire.png');

    // 8. Settings → Salary
    console.log('\n💰 Settings → Salary screen...');
    await page.click('button:has-text("Salary")');
    await page.waitForTimeout(1000);
    await captureScreenshot(page, 'settings-salary.png');

    // 9. Settings → Career Bands
    console.log('\n📊 Settings → Career Bands screen...');
    await page.click('button:has-text("Career Bands")');
    await page.waitForTimeout(1000);
    await captureScreenshot(page, 'settings-bands.png');

    // 10. Settings → Gates
    console.log('\n🔒 Settings → Gates screen...');
    await page.click('button:has-text("Gates")');
    await page.waitForTimeout(1000);
    await captureScreenshot(page, 'settings-gates.png');

    console.log('\n✅ All screenshots captured!');
    console.log(`   Saved to: ${SCREENSHOT_DIR}\n`);

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
