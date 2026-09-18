const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('moinflinka_cookie_consent', JSON.stringify({ necessary: true, analytics: false, marketing: false })));
    for (const name of ['index', 'kennzeichen', 'kennzeichen-deutschland', 'kennzeichen-hamburg']) {
      await page.goto(`http://127.0.0.1:5173/${name}.html`); assert.equal(await page.locator('#kennzeichenForm').count(), 1); assert.equal(await page.locator('fieldset:visible').count(), 1); assert.equal(await page.locator('a[href="/bestellseite"]').count(), 0); assert.equal(await page.locator('.payment-methods .payment-method').count(), 4);
      if (name === 'kennzeichen-hamburg') assert.equal(await page.locator('[name=delivery][value=courier]').isChecked(), true);
    }
    await page.goto('http://127.0.0.1:5173/kennzeichen.html');
    await page.getByRole('button', { name: 'Chat mit der Hamburger Möwe öffnen', exact: true }).click();
    await page.getByRole('dialog', { name: 'Deine Möwe aus Hamburg' }).waitFor();
    await page.getByText('Die Möwe schreibt …', { exact: false }).waitFor();
    assert.equal(await page.locator('.gull-chat-history > p').count(), 0);
    await page.locator('.gull-chat-options').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.gull-chat-history > p').count(), 4);
    await page.getByRole('button', { name: 'Chat-Ton ausschalten', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Chat-Ton einschalten', exact: true }).getAttribute('aria-pressed'), 'false');
    assert.equal(await page.getByRole('link', { name: 'WhatsApp-Chat öffnen' }).isVisible(), false);
    for (const [topic, text] of [['Auto online zulassen', 'online zulassen'], ['Auto abmelden', 'abmelden'], ['Hilfe bei der Kennzeichen-Erstellung', 'Kennzeichen-Erstellung'], ['Mit einem Mitarbeiter schreiben', 'Mitarbeiter']]) {
      await page.getByRole('button', { name: topic, exact: true }).click();
      await page.getByRole('link', { name: 'WhatsApp-Chat öffnen' }).waitFor({ state: 'visible' });
      const url = new URL(await page.getByRole('link', { name: 'WhatsApp-Chat öffnen' }).getAttribute('href'));
      assert.equal(url.hostname, 'wa.me'); assert.equal(url.pathname, '/4915906808767'); assert.ok(url.searchParams.get('text').includes(text));
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.evaluate(() => document.querySelector('.gull-chat-launcher').getBoundingClientRect().bottom < document.querySelector('.mobile-quickbar').getBoundingClientRect().top), true);
    await page.screenshot({ path: '.qa/seagull-chat-mobile.png' });
    await page.getByRole('button', { name: 'Chat schließen', exact: true }).click();
    await page.setViewportSize({ width: 1280, height: 900 });
    assert.equal(await page.locator('fieldset:visible').count(), 1);
    await page.locator('[data-next]').click();
    assert.equal(await page.locator('[data-step="0"]').isVisible(), true);
    for (const [key, value] of Object.entries({ city: 'hh', letters: 'mf', digits: '123' })) await page.locator(`[name=${key}]`).fill(value);
    await page.locator('[data-next]').click();
    assert.equal(await page.locator('[data-step="1"]').isVisible(), true);
    await page.locator('[name=delivery][value=express]').check();
    await page.locator('[data-back]').click();
    assert.equal(await page.locator('[name=city]').inputValue(), 'HH');
    await page.locator('[data-next]').click();
    assert.equal(await page.locator('[name=delivery][value=express]').isChecked(), true);
    await page.locator('[name=delivery][value=standard]').check();
    await page.locator('[data-next]').click();
    assert.equal(await page.locator('[data-step="2"]').isVisible(), true);
    for (const [key, value] of Object.entries({ name: 'Testkunde', phone: '+49123456789', email: 'test@example.com', street: 'Teststraße 1', postcode: '20095', town: 'Hamburg' })) await page.locator(`[name=${key}]`).fill(value);
    await page.locator('[name=privacy]').check();
    assert.equal(await page.locator('[name=city]').inputValue(), 'HH');
    let payload;
    await page.route('**/api/create-checkout-session', route => { payload = route.request().postDataJSON(); return route.fulfill({ json: { ok: true, clientSecret: 'fake', publishableKey: 'pk_test_fake', amountTotal: 2490, sessionId: 'cs_test_order' } }); });
    await page.evaluate(() => {
      let paymentOptions;
      const element = selectorText => ({ mount: selector => { document.querySelector(selector).textContent = selectorText; }, destroy: () => {}, on: (event, callback) => { if (event === 'ready') queueMicrotask(() => callback({ availablePaymentMethods: null })); } });
      window.Stripe = () => ({ initCheckoutElementsSdk: options => { if ('email' in options.defaultValues || 'phoneNumber' in options.defaultValues) throw new Error('Customer contact details are already set'); return ({ loadActions: async () => ({ type: 'success', actions: { getSession: () => ({ currency: 'eur', minorUnitsAmountDivisor: 100, canConfirm: true, total: { total: { minorUnitsAmount: 2490 } } }), confirm: async options => { if ('email' in options || 'phoneNumber' in options) throw new Error('Customer contact details are already set'); for (const field of ['name', 'address']) { if (options.billingAddress?.[field] && paymentOptions?.fields?.billingDetails?.[field] !== 'never') throw new Error('Billing details collected twice: ' + field); } return { type: 'error', error: { message: 'Test: Zahlung abgelehnt' } }; } } }), on: () => {}, createPaymentElement: options => { paymentOptions = options; return element('Sichere Zahlungsfelder'); }, createExpressCheckoutElement: options => { if (options.paymentMethods.link !== 'never') throw new Error('Link must be disabled'); return element('Wallets'); } }); } });
    });
    await page.locator('#kennzeichenForm [type=submit]').click(); await page.locator('#payment-panel').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.checkout-payment-icons .payment-method').count(), 7); assert.equal(await page.locator('#checkout-loading').isVisible(), false); assert.equal(payload.orderType, 'plate'); assert.equal(payload.testMode, false); assert.equal(await page.locator('#kennzeichenForm').isVisible(), false);
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
    let loggedIn = false; let changedStatus; let deletedIds = []; let adminOrders;
    const order = { id: 'cs_test', created: 1700000000, plate: 'HH MF 123', amount: 2490, status: 'Eingegangen', customer: { name: 'Testkunde', street: 'Teststraße 1', postcode: '20095', town: 'Hamburg', email: 'test@example.com', phone: '+49123456789' }, details: { quantity: '2' } };
    adminOrders = [order, { ...order, id: 'cs_second', plate: 'HH MF 124' }];
    await page.route('**/api/admin*', route => {
      const req = route.request(); const data = req.method() === 'POST' ? req.postDataJSON() : null;
      if (data?.action === 'login') { assert.equal(data.username, 'admin'); loggedIn = true; return route.fulfill({ json: { ok: true } }); }
      if (!loggedIn) return route.fulfill({ status: 401, json: { error: 'Bitte anmelden.' } });
      if (data?.action === 'status') { changedStatus = data.status; return route.fulfill({ json: { ok: true } }); }
      if (data?.action === 'delete-orders') { deletedIds = data.ids; adminOrders = adminOrders.filter(order => !deletedIds.includes(order.id)); return route.fulfill({ json: { ok: true, deletedIds, failedIds: [] } }); }
      if (data) return route.fulfill({ json: { ok: true } });
      if (req.url().includes('resource=discounts')) return route.fulfill({ json: { ok: true, codes: [], nextCursor: null } });
      if (req.url().includes('?id=')) return route.fulfill({ json: { ok: true, order } });
      return route.fulfill({ json: { ok: true, orders: adminOrders, nextCursor: null } });
    });
    await page.goto('http://127.0.0.1:5173/admin.html'); await page.locator('[name=password]').fill('test-password'); await page.locator('#admin-login button').click(); await page.locator('#dashboard').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Bestellung HH MF 123 ansehen', exact: true }).click(); await page.locator('#order-detail').waitFor({ state: 'visible' }); assert.match(await page.locator('#detail-content').textContent(), /Teststraße 1/);
    await page.locator('#status-form select').selectOption('Gedruckt'); await page.locator('#status-form button').click(); await page.getByText('Status gespeichert.', { exact: true }).waitFor(); assert.equal(changedStatus, 'Gedruckt');
    await page.screenshot({ path: '.qa/admin-desktop.png', fullPage: true });
    await page.locator('#close-detail').click();
    await page.locator('#select-all-orders').check(); assert.equal(await page.locator('#selection-count').textContent(), '2 ausgew\u00e4hlt');
    page.once('dialog', dialog => dialog.dismiss()); await page.locator('#delete-selected').click(); assert.deepEqual(deletedIds, []); assert.equal(await page.locator('#orders tr').count(), 2);
    page.once('dialog', dialog => dialog.accept()); await page.locator('#delete-selected').click(); await page.getByText('2 Bestellung(en) gel\u00f6scht.', { exact: true }).waitFor(); assert.deepEqual(deletedIds, ['cs_test', 'cs_second']); assert.equal(await page.locator('#orders tr').count(), 0); assert.equal(await page.locator('#delete-selected').isDisabled(), true);
    adminOrders = [order]; await page.locator('#refresh').click(); await page.locator('#orders tr').waitFor();
    page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'Bestellung HH MF 123 l\u00f6schen', exact: true }).click(); await page.getByText('1 Bestellung(en) gel\u00f6scht.', { exact: true }).waitFor(); assert.deepEqual(deletedIds, ['cs_test']);
    await page.locator('#refresh').click(); assert.equal(await page.locator('#orders tr').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: All public pages, multi-step orders with validation and preserved inputs, own checkout with payment error and edit, mobile layout, admin login, status and single/bulk deletion UI');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
