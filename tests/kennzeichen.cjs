const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const mail = require('nodemailer');
let sent;
mail.createTransport = () => ({ sendMail: async data => { sent = data; } });
Object.assign(process.env, { smtp_server: 'test', smtp_user: 'test', smtp_passwort: 'test', smtp_empaenger: 'test@example.com' });
const handler = require('../api/contact');
async function call(body) {
  let code;
  await handler({ method: 'POST', body }, { status(n) { code = n; return this; }, json() {}, setHeader() {} });
  return code;
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let submitted;
    let fail = true;
    await page.route('**/api/contact', async route => {
      submitted = route.request().postDataJSON();
      const code = fail ? 502 : await call(submitted);
      await route.fulfill({ status: code, json: { ok: code === 200 } });
    });
    await page.goto('http://127.0.0.1:5173/kennzeichen.html');
    await page.locator('[data-cookie-reject]').click();
    await page.locator('[data-next]').click();
    assert.equal(await page.locator('[data-step="0"]').isVisible(), true);
    for (const [key, value] of Object.entries({ city: 'hh', letters: 'mf', digits: '123' })) await page.locator(`[name=${key}]`).fill(value);
    assert.equal(await page.locator('[name=quantity]').count(), 0);
    for (const plateType of ['motorcycle', 'normal']) for (const carbon of [false, true]) for (const sticker of [false, true]) {
      await page.locator(`[name=plateType][value=${plateType}]`).check();
      const quantity = plateType === 'motorcycle' ? 1 : 2;
      await page.locator('[name=carbon]').setChecked(carbon);
      await page.locator('[name=environmentSticker]').setChecked(sticker);
      await page.locator('[data-next]').click();
      for (const delivery of ['shipping', 'local']) {
        await page.locator(`[name=delivery][value=${delivery}]`).check();
        const total = ((quantity === 1 ? 1199 : 1999) + (carbon ? 999 : 0) + (sticker ? 999 : 0) + (delivery === 'shipping' ? 2640 : 2000)) / 100;
        assert.equal(await page.locator('[data-total]').textContent(), total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }));
      }
      await page.locator('[data-back]').click();
    }
    await page.locator('[name=plateType][value=electric]').check();
    assert.equal(await page.locator('[name=plateVariant]').inputValue(), 'electric');
    await page.locator('[name=digits]').fill('1234');
    await page.locator('[data-next]').click();
    assert.equal(await page.locator('[data-step="0"]').isVisible(), true);
    await page.locator('[name=digits]').fill('123');
    await page.locator('[name=plateType][value=motorcycle]').check();
    assert.equal(await page.locator('[data-plate-suffix]').isVisible(), false);
    await page.locator('[name=plateType][value=historic]').check();
    assert.equal(await page.locator('[data-plate-suffix]').textContent(), 'H');
    assert.equal(await page.locator('select[name=plateVariant]').count(), 0);
    await page.locator('[name=season]').check();
    await page.locator('[name=seasonEnd]').selectOption('03');
    await page.locator('[data-next]').click();
    assert.equal(await page.locator('[data-step="0"]').isVisible(), true);
    await page.locator('[name=seasonEnd]').selectOption('10');
    await page.locator('[data-next]').click();
    await page.locator('[data-next]').click();
    for (const [key, value] of Object.entries({ name: 'Test Person', phone: '040123456', email: 'test@example.com', street: 'Testweg 1', postcode: '20095', town: 'Hamburg' })) await page.locator(`[name=${key}]`).fill(value);
    await page.locator('[name=privacy]').check();
    await page.locator('[type=submit]').click();
    await page.waitForFunction(() => document.querySelector('.form-status').classList.contains('is-error'));
    assert.equal(await page.locator('[name=name]').inputValue(), 'Test Person');
    fail = false;
    await page.locator('[type=submit]').click();
    await page.waitForFunction(() => document.querySelector('.form-status').classList.contains('is-success'));
    assert.equal(submitted.totalPriceCents, 5997);
    for (const text of ['HH MF 123H', 'Oldtimer', 'H-Kennzeichen', '04–10', '2 Schilder', 'Carbon-Optik', 'Grüne Umweltplakette', 'Hamburg-Express mit eigenen Kurierfahrern', '59,97', 'Testweg 1']) {
      assert.ok(sent.text.includes(text), text);
      assert.ok(sent.html.includes(text), text);
    }
    for (const change of [{ quantity: 3 }, { totalPriceCents: 1 }, { carbon: 'false' }, { delivery: 'unknown' }, { privacy: '' }, { seasonEnd: '01' }, { plateType: 'unknown' }, { plateVariant: 'unknown' }]) assert.equal(await call({ ...submitted, ...change }), 400);
    for (const plateType of ['normal', 'motorcycle', 'electric', 'historic']) for (const delivery of ['shipping', 'local']) for (const carbon of [false, true]) for (const environmentSticker of [false, true]) {
      const quantity = plateType === 'motorcycle' ? 1 : 2;
      const basePriceCents = quantity === 1 ? 1199 : 1999;
      const extrasPriceCents = (carbon ? 999 : 0) + (environmentSticker ? 999 : 0);
      const deliveryPriceCents = delivery === 'shipping' ? 2640 : 2000;
      assert.equal(await call({ ...submitted, plateType, plateVariant: ['electric', 'historic'].includes(plateType) ? plateType : 'standard', quantity, delivery, carbon, environmentSticker, basePriceCents, extrasPriceCents, deliveryPriceCents, totalPriceCents: basePriceCents + extrasPriceCents + deliveryPriceCents }), 200);
      assert.equal(await call({ ...submitted, plateType, quantity: quantity === 1 ? 2 : 1 }), 400);
    }
    assert.equal(await call({ name: 'Test', phone: '040123', email: 'test@example.com', topic: 'Allgemeine Anfrage', message: 'Test' }), 200);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.reload();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow ${width}`);
      if ([390, 1440].includes(width)) await page.screenshot({ path: `.qa/kennzeichen-${width}.png`, fullPage: true });
    }
    assert.deepEqual(errors, []);
    console.log('Passed: automatic quantities, browser price matrix, validation, retry, API/email integration, 32 API combinations, tampering rejection, general contact regression, responsive widths. SMTP mocked; no emails sent.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
