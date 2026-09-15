const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/validate-promo-code?**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, percentOff: 10 }),
    }));

    await page.goto('http://127.0.0.1:5173/kennzeichen-deutschland.html');
    assert.equal(await page.locator('.stripe-payment-note').textContent().then(text => text.trim().replace(/\s+/g, ' ')), 'Sicher bezahlen mit Stripe');
    if (await page.locator('[data-cookie-reject]').isVisible()) await page.locator('[data-cookie-reject]').click();
    await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { clientY: 0 })));
    await page.locator('[data-discount-popup]').waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-discount-popup-activate]').textContent().then(text => text.trim()), 'Hey, jetzt Rabattcode von 10% aktivieren!');

    await page.locator('[data-discount-popup-activate]').click();
    assert.equal(await page.locator('[name="discountCode"]').inputValue(), 'MoinRX10');
    await page.locator('[data-discount-popup-status]').filter({ hasText: '10 % Rabatt aktiviert' }).waitFor();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'MoinRX10');
    await page.locator('[data-discount-popup]').waitFor({ state: 'hidden' });

    await page.reload();
    await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { clientY: 0 })));
    await page.waitForTimeout(700);
    assert.equal(await page.locator('[data-discount-popup]').isHidden(), true);

    await context.clearCookies();
    await page.evaluate(() => sessionStorage.clear());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    if (await page.locator('[data-cookie-reject]').isVisible()) await page.locator('[data-cookie-reject]').click();
    await page.evaluate(() => {
      const scrollable = document.documentElement.scrollHeight - innerHeight;
      scrollTo(0, scrollable * 0.5);
    });
    await page.locator('[data-discount-popup]').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: '.qa/discount-popup-mobile.png' });

    assert.deepEqual(errors, []);
    console.log('Passed: exit intent, activation, Stripe validation, field insertion, clipboard, once-per-session, mobile scroll trigger, and responsive width.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
