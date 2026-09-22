import { openNativeCheckout } from './native-checkout.js';
import prices from '../plate-prices.json';
const form = document.querySelector('#kennzeichenForm');
if (form) {
  const steps = [...form.querySelectorAll('[data-step]')];
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('[type="submit"]');
  const submitLabel = submit.textContent;
  const next = form.querySelector('[data-next]');
  const back = form.querySelector('[data-back]');
  const priceBox = form.querySelector('[data-price-box]');
  let step = 0;
  let sending = false;
  const field = name => form.elements.namedItem(name);
  const money = cents => (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  const suffix = () => ({ electric: 'E', historic: 'H' }[field('plateVariant').value] || '');
  const plate = () => `${field('city').value} ${field('letters').value} ${field('digits').value}${suffix()}`;
  const deliveryLabels = {
    standard: 'Klassischer DHL-Versand (versandfertig noch am selben Tag bei Bestellung vor 14:00 Uhr, sonst am nächsten Tag)',
    express: 'DHL-Express (Lieferung am nächsten Tag)',
    courier: 'Eigener Kurier (Bestellung bis 12:00 Uhr: Lieferung noch am selben Tag innerhalb Hamburgs)',
  };
  const delivery = () => deliveryLabels[field('delivery').value] || field('delivery').value;
  const typeLabels = { normal: 'Normales Kennzeichen', motorcycle: 'Motorrad-Kennzeichen', electric: 'E-Kennzeichen', historic: 'Oldtimer' };
  const variantLabels = { standard: 'Standard', electric: 'E-Kennzeichen', historic: 'H-Kennzeichen' };
  const quantity = () => field('plateType').value === 'motorcycle' ? 1 : 2;
  const quantityLabel = () => quantity() === 1 ? '1 Schild' : '2 Schilder (Satz)';
  const isTestMode = () => false;
  let appliedDiscount = null;
  let discountError = null;
  function orderPrices() {
    if (isTestMode()) return { basePriceCents: 50, extrasPriceCents: 0, deliveryPriceCents: 0, totalPriceCents: 50 };
    const basePriceCents = quantity() === 1 ? prices.single : prices.pair;
    const extrasPriceCents = (field('carbon').checked ? prices.carbon : 0) + (field('environmentSticker').checked ? prices.environmentSticker : 0);
    const deliveryPriceCents = prices[field('delivery').value];
    return { basePriceCents, extrasPriceCents, deliveryPriceCents, totalPriceCents: basePriceCents + extrasPriceCents + deliveryPriceCents };
  }
  function updateSummary() {
    field('plateVariant').value = ['electric', 'historic'].includes(field('plateType').value) ? field('plateType').value : 'standard';
    const preview = form.querySelector('.german-plate');
    preview.classList.toggle('is-motorcycle', field('plateType').value === 'motorcycle');
    preview.setAttribute('aria-label', `${typeLabels[field('plateType').value]} gestalten${suffix() ? ` · ${variantLabels[field('plateVariant').value]}` : ''}`);
    const previewSuffix = form.querySelector('[data-plate-suffix]');
    previewSuffix.textContent = suffix();
    previewSuffix.hidden = !suffix();
    const totals = orderPrices();
    const hasDiscount = Boolean(appliedDiscount) && !isTestMode();
    const displayedTotalCents = hasDiscount
      ? Math.round(totals.totalPriceCents * (1 - appliedDiscount.percentOff / 100))
      : totals.totalPriceCents;
    const options = [...new Set([typeLabels[field('plateType').value], variantLabels[field('plateVariant').value]])];
    if (field('season').checked) options.push(`Saison ${field('seasonStart').value}–${field('seasonEnd').value}`);
    if (field('carbon').checked) options.push('Carbon-Optik');
    if (field('environmentSticker').checked) options.push('Grüne Umweltplakette');
    form.querySelector('[data-summary]').textContent = `${plate()} · ${quantityLabel()} · ${options.join(' · ')} · ${delivery()} · Gesamtpreis: ${money(totals.totalPriceCents)}`;
    const lines = isTestMode() ? [] : [`${quantityLabel()}: ${money(totals.basePriceCents)}`];
    if (!isTestMode()) {
      if (field('carbon').checked) lines.push(`Carbon-Optik: ${money(prices.carbon)}`);
      if (field('environmentSticker').checked) lines.push(`Grüne Umweltplakette: ${money(prices.environmentSticker)}`);
      lines.push(`${delivery()}: ${money(totals.deliveryPriceCents)}`);
      if (hasDiscount) lines.push(`Rabattcode ${appliedDiscount.code} (-${appliedDiscount.percentOff} %): -${money(totals.totalPriceCents - displayedTotalCents)}`);
    }
    const discountStatus = form.querySelector('[data-discount-status]');
    if (discountStatus) {
      if (isTestMode()) {
        discountStatus.hidden = false;
        discountStatus.textContent = '✓ Rabattcode angewendet – Testbestellung für 0,50 €.';
      } else if (hasDiscount) {
        discountStatus.hidden = false;
        discountStatus.textContent = `✓ Rabattcode ${appliedDiscount.code} angewendet – ${appliedDiscount.percentOff} % Rabatt.`;
      } else if (discountError) {
        discountStatus.hidden = false;
        discountStatus.textContent = discountError;
      } else {
        discountStatus.hidden = true;
      }
    }
    const details = form.querySelector('[data-price-details]');
    details.textContent = lines.join(' · ');
    details.hidden = lines.length === 0;
    form.querySelector('[data-total]').textContent = money(displayedTotalCents);
    if (priceBox) priceBox.hidden = step !== 2;
  }
  const discountApplyButton = form.querySelector('[data-discount-apply]');
  const discountCodeField = field('discountCode');
  async function applyDiscountCode() {
    if (!discountCodeField) return;
    const code = discountCodeField.value.trim();
    appliedDiscount = null;
    discountError = null;
    if (!code) {
      updateSummary();
      return;
    }
    try {
      const response = await fetch(`/api/validate-promo-code?code=${encodeURIComponent(code)}`, {
        signal: AbortSignal.timeout(10000),
      });
      const result = await response.json();
      if (result.ok) {
        appliedDiscount = { code, percentOff: result.percentOff };
      } else {
        discountError = result.error || 'Rabattcode ungültig.';
      }
    } catch {
      discountError = 'Rabattcode konnte nicht geprüft werden.';
    }
    updateSummary();
  }
  if (discountApplyButton) {
    discountApplyButton.addEventListener('click', event => {
      event.preventDefault();
      applyDiscountCode();
    });
  }
  if (discountCodeField) {
    discountCodeField.addEventListener('input', () => {
      appliedDiscount = null;
      discountError = null;
    });
  }

  ['seasonStart', 'seasonEnd'].forEach((name, index) => {
    for (let month = 1; month <= 12; month++) {
      const value = String(month).padStart(2, '0');
      field(name).add(new Option(value, value));
    }
    field(name).value = index === 0 ? '04' : '10';
  });
  form.addEventListener('change', () => {
    form.querySelector('[data-season]').hidden = !field('season').checked;
    ['seasonStart', 'seasonEnd'].forEach(name => { field(name).disabled = !field('season').checked; });
    field('seasonEnd').setCustomValidity('');
    field('digits').setCustomValidity('');
    updateSummary();
  });
  form.addEventListener('input', updateSummary);
  function show(index, focus = true) {
    step = index;
    steps.forEach((panel, i) => { panel.hidden = i !== step; });
    form.querySelectorAll('.plate-progress li').forEach((item, i) => {
      if (i === step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      item.classList.toggle('is-done', i < step);
    });
    back.hidden = step === 0;
    next.hidden = step === 2;
    submit.hidden = step !== 2;
    next.textContent = step === 0 ? 'Weiter: Versand auswählen →' : 'Weiter zum Checkout →';
    status.textContent = '';
    updateSummary();
    if (focus) steps[step].querySelector('legend').focus();
  }
  ['city', 'letters'].forEach(name => field(name).addEventListener('input', () => {
    field(name).value = field(name).value.toLocaleUpperCase('de-DE');
    field('digits').setCustomValidity('');
  }));
  field('digits').addEventListener('input', () => field('digits').setCustomValidity(''));
  function validate(index) {
    if (index === 0) {
      field('digits').setCustomValidity(plate().replaceAll(' ', '').length > 8 ? 'Dein Kennzeichen darf einschließlich E oder H insgesamt höchstens 8 Zeichen haben.' : '');
      field('seasonEnd').setCustomValidity(field('season').checked && Number(field('seasonEnd').value) <= Number(field('seasonStart').value) ? 'Bitte wähle einen Endmonat nach dem Startmonat.' : '');
    }
    const invalid = [...steps[index].querySelectorAll('input, textarea, select')].find(input => !input.checkValidity());
    if (!invalid) return true;
    show(index, false);
    status.className = 'form-status is-error';
    status.textContent = invalid.validity.valueMissing ? 'Bitte fülle dieses Pflichtfeld aus.' : invalid.validity.customError ? invalid.validationMessage : 'Bitte prüfe das markierte Feld und das angegebene Format.';
    invalid.reportValidity();
    invalid.focus();
    return false;
  }


  next.addEventListener('click', () => { if (validate(step)) show(step + 1); });
  back.addEventListener('click', () => show(step - 1));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    if (step < 2) { if (validate(step)) show(step + 1); return; }
    for (let i = 0; i < steps.length; i++) if (!validate(i)) return;
    const data = Object.fromEntries(new FormData(form));
    data.orderType = 'plate';
    data.quantity = quantity();
    ['season', 'carbon', 'environmentSticker'].forEach(name => { data[name] = field(name).checked; });
    data.testMode = isTestMode();
    Object.assign(data, orderPrices());
    sending = true;
    submit.disabled = true;
    back.disabled = true;

    submit.textContent = 'Checkout wird geladen …';
    status.className = 'form-status';
    status.textContent = 'Einen Moment, wir bauen eine sichere Verbindung auf für den Checkout.';
    try {
      const response = await fetch(form.dataset.formEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'Zahlung konnte nicht gestartet werden.');
      await openNativeCheckout(result, data, form, () => {
        sending = false;
        submit.disabled = false;
        back.disabled = false;
        submit.textContent = submitLabel;
      });
    } catch (error) {
      form.hidden = false;
      document.querySelector('#payment-panel').hidden = true;
      status.className = 'form-status is-error';
      status.textContent = error.message || 'Bitte versuche es erneut oder nutze unseren WhatsApp-Support.';
      sending = false;
      submit.disabled = false;
      back.disabled = false;

      submit.textContent = submitLabel;
    }
  });
  show(0, false);
  if (new URLSearchParams(window.location.search).get('checkout') === 'cancelled') {
    status.className = 'form-status is-error';
    status.textContent = 'Die Zahlung wurde abgebrochen. Deine Auswahl ist erhalten geblieben – du kannst es jederzeit erneut versuchen.';
  }
}
