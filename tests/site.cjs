const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('moinflinka_cookie_consent', JSON.stringify({ necessary: true, analytics: false, marketing: false })));
    for (const name of ['index', 'kennzeichen', 'kennzeichen-deutschland', 'kennzeichen-hamburg']) {
      await page.goto(`http://127.0.0.1:5173/${name}.html`); assert.equal(await page.locator('#kennzeichenForm').count(), 1); assert.equal(await page.locator('fieldset:visible').count(), 3); assert.equal(await page.locator('a[href="/bestellseite"]').count(), 0); assert.equal(await page.locator('.payment-method').count(), 7);
      if (name === 'kennzeichen-hamburg') assert.equal(await page.locator('[name=delivery][value=courier]').isChecked(), true);
    }
    await page.goto('http://127.0.0.1:5173/kennzeichen.html');
    assert.equal(await page.locator('fieldset:visible').count(), 3);
    for (const [key, value] of Object.entries({ city: 'hh', letters: 'mf', digits: '123', name: 'Testkunde', phone: '+49123456789', email: 'test@example.com', street: 'Teststraße 1', postcode: '20095', town: 'Hamburg' })) await page.locator(`[name=${key}]`).fill(value);
    await page.locator('[name=privacy]').check();
    assert.equal(await page.locator('[name=city]').inputValue(), 'HH');
    let payload;
    await page.route('**/api/create-checkout-session', route => { payload = route.request().postDataJSON(); return route.fulfill({ json: { ok: true, clientSecret: 'fake', publishableKey: 'pk_test_fake', amountTotal: 2490, sessionId: 'cs_test_order' } }); });
    await page.evaluate(() => {
      const element = selectorText => ({ mount: selector => { document.querySelector(selector).textContent = selectorText; }, destroy: () => {}, on: () => {} });
      window.Stripe = () => ({ initCheckoutElementsSdk: () => ({ loadActions: async () => ({ type: 'success', actions: { getSession: () => ({ currency: 'eur', minorUnitsAmountDivisor: 100, canConfirm: true, total: { total: { minorUnitsAmount: 2490 } } }), confirm: async () => ({ type: 'error', error: { message: 'Test: Zahlung abgelehnt' } }) } }), on: () => {}, createPaymentElement: () => element('Sichere Zahlungsfelder'), createExpressCheckoutElement: () => element('Wallets') }) });
    });
    await page.locator('#kennzeichenForm [type=submit]').click(); await page.locator('#payment-panel').waitFor({ state: 'visible' });
    assert.equal(payload.orderType, 'plate'); assert.equal(payload.testMode, false); assert.equal(await page.locator('#kennzeichenForm').isVisible(), false);
    assert.equal(new URL(page.url()).pathname, '/kennzeichen.html');
    assert.match(await page.locator('#checkout-total').textContent(), /24,90/);
    await page.locator('#pay-order').click();
    await page.getByText('Test: Zahlung abgelehnt', { exact: true }).waitFor();
    assert.equal(await page.locator('#pay-order').isEnabled(), true);
    await page.screenshot({ path: '.qa/checkout-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: '.qa/checkout-mobile.png', fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#edit-order').click(); assert.equal(await page.locator('#kennzeichenForm').isVisible(), true); assert.equal(await page.locator('[name=street]').inputValue(), 'Teststraße 1');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: '.qa/order-mobile.png', fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.setViewportSize({ width: 1440, height: 1000 }); await page.screenshot({ path: '.qa/order-desktop.png', fullPage: true });
    let loggedIn = false; let changedStatus;
    const order = { id: 'cs_test', created: 1700000000, plate: 'HH MF 123', amount: 2490, status: 'Eingegangen', customer: { name: 'Testkunde', street: 'Teststraße 1', postcode: '20095', town: 'Hamburg', email: 'test@example.com', phone: '+49123456789' }, details: { quantity: '2' } };
    await page.route('**/api/admin*', route => {
      const req = route.request(); const data = req.method() === 'POST' ? req.postDataJSON() : null;
      if (data?.action === 'login') { assert.equal(data.username, 'admin'); loggedIn = true; return route.fulfill({ json: { ok: true } }); }
      if (!loggedIn) return route.fulfill({ status: 401, json: { error: 'Bitte anmelden.' } });
      if (data?.action === 'status') { changedStatus = data.status; return route.fulfill({ json: { ok: true } }); }
      if (data) return route.fulfill({ json: { ok: true } });
      if (req.url().includes('resource=discounts')) return route.fulfill({ json: { ok: true, codes: [], nextCursor: null } });
      if (req.url().includes('?id=')) return route.fulfill({ json: { ok: true, order } });
      return route.fulfill({ json: { ok: true, orders: [order], nextCursor: null } });
    });
    await page.goto('http://127.0.0.1:5173/admin.html'); await page.locator('[name=password]').fill('test-password'); await page.locator('#admin-login button').click(); await page.locator('#dashboard').waitFor({ state: 'visible' });
    await page.locator('#orders button').click(); await page.locator('#order-detail').waitFor({ state: 'visible' }); assert.match(await page.locator('#detail-content').textContent(), /Teststraße 1/);
    await page.locator('#status-form select').selectOption('Gedruckt'); await page.locator('#status-form button').click(); await page.getByText('Status gespeichert.', { exact: true }).waitFor(); assert.equal(changedStatus, 'Gedruckt');
    await page.screenshot({ path: '.qa/admin-desktop.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: All public pages, inline orders, own checkout with payment error and edit, mobile layout, admin login and status UI');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
