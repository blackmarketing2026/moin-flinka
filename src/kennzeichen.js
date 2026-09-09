import prices from '../plate-prices.json';
const form = document.querySelector('#kennzeichenForm');
if (form) {
  const steps = [...form.querySelectorAll('[data-step]')];
  const status = form.querySelector('.form-status');
  const next = form.querySelector('[data-next]');
  const back = form.querySelector('[data-back]');
  const submit = form.querySelector('[type="submit"]');
  let step = 0;
  let sending = false;
  const field = name => form.elements.namedItem(name);
  const money = cents => (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  const suffix = () => ({ electric: 'E', historic: 'H' }[field('plateVariant').value] || '');
  const plate = () => `${field('city').value} ${field('letters').value} ${field('digits').value}${suffix()}`;
  const delivery = () => field('delivery').value === 'shipping' ? 'DHL Expressversand' : 'Express-Lieferung innerhalb Hamburgs';
  const typeLabels = { normal: 'Normales Kennzeichen', motorcycle: 'Motorrad-Kennzeichen', electric: 'E-Kennzeichen' };
  const variantLabels = { standard: 'Standard', electric: 'E-Kennzeichen', historic: 'H-Kennzeichen' };
  const quantityLabel = () => Number(field('quantity').value) === 1 ? '1 Schild' : '2 Schilder (Satz)';
  function orderPrices() {
    const basePriceCents = Number(field('quantity').value) === 1 ? prices.single : prices.pair;
    const extrasPriceCents = (field('carbon').checked ? prices.carbon : 0) + (field('environmentSticker').checked ? prices.environmentSticker : 0);
    const deliveryPriceCents = prices[field('delivery').value];
    return { basePriceCents, extrasPriceCents, deliveryPriceCents, totalPriceCents: basePriceCents + extrasPriceCents + deliveryPriceCents };
  }
  function updateSummary() {
    const preview = form.querySelector('.german-plate');
    preview.classList.toggle('is-motorcycle', field('plateType').value === 'motorcycle');
    preview.setAttribute('aria-label', `${typeLabels[field('plateType').value]} gestalten${suffix() ? ` · ${variantLabels[field('plateVariant').value]}` : ''}`);
    const previewSuffix = form.querySelector('[data-plate-suffix]');
    previewSuffix.textContent = suffix();
    previewSuffix.hidden = !suffix();
    const totals = orderPrices();
    const options = [...new Set([typeLabels[field('plateType').value], variantLabels[field('plateVariant').value]])];
    if (field('season').checked) options.push(`Saison ${field('seasonStart').value}–${field('seasonEnd').value}`);
    if (field('carbon').checked) options.push('Carbon-Optik');
    if (field('environmentSticker').checked) options.push('Grüne Umweltplakette');
    form.querySelector('[data-summary]').textContent = `${plate()} · ${quantityLabel()} · ${options.join(' · ')} · ${delivery()} · Gesamtpreis: ${money(totals.totalPriceCents)}`;
    const lines = [`${quantityLabel()}: ${money(totals.basePriceCents)}`];
    if (field('carbon').checked) lines.push(`Carbon-Optik: ${money(prices.carbon)}`);
    if (field('environmentSticker').checked) lines.push(`Grüne Umweltplakette: ${money(prices.environmentSticker)}`);
    lines.push(`${delivery()}: ${money(totals.deliveryPriceCents)}`);
    form.querySelector('[data-price-details]').textContent = lines.join(' · ');
    form.querySelector('[data-total]').textContent = money(totals.totalPriceCents);
  }
  ['seasonStart', 'seasonEnd'].forEach((name, index) => {
    for (let month = 1; month <= 12; month++) {
      const value = String(month).padStart(2, '0');
      field(name).add(new Option(value, value));
    }
    field(name).value = index === 0 ? '04' : '10';
  });
  form.addEventListener('change', event => {
    if (event.target.name === 'plateType') {
      if (field('plateType').value === 'electric') field('plateVariant').value = 'electric';
      else if (field('plateVariant').value === 'electric') field('plateVariant').value = 'standard';
    }
    if (event.target.name === 'plateVariant') {
      if (field('plateVariant').value === 'electric' && field('plateType').value === 'normal') field('plateType').value = 'electric';
      else if (field('plateVariant').value !== 'electric' && field('plateType').value === 'electric') field('plateType').value = 'normal';
    }
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
    document.querySelectorAll('.plate-progress li').forEach((item, i) => {
      if (i === step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      item.classList.toggle('is-done', i < step);
    });
    back.hidden = step === 0;
    next.hidden = step === 2;
    submit.hidden = step !== 2;
    next.textContent = step === 0 ? 'Weiter zur Lieferung →' : 'Weiter zu deinen Daten →';
    updateSummary();
    status.textContent = '';
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
    data.quantity = Number(data.quantity);
    ['season', 'carbon', 'environmentSticker'].forEach(name => { data[name] = field(name).checked; });
    Object.assign(data, orderPrices());
    data.topic = 'Kennzeichen-Bestellanfrage';
    sending = true;
    submit.disabled = true;
    back.disabled = true;
    submit.textContent = 'Wird gesendet …';
    status.textContent = '';
    try {
      const response = await fetch(form.dataset.formEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok || (await response.json()).ok !== true) throw new Error('Versand fehlgeschlagen');
      steps.forEach(panel => { panel.hidden = true; });
      form.querySelector('.plate-navigation').hidden = true;
      document.querySelector('.plate-progress').hidden = true;
      status.className = 'form-status is-success';
      status.textContent = `Vielen Dank! Deine Bestellanfrage für ${quantityLabel()} (${plate()}) mit einem Gesamtpreis von ${money(data.totalPriceCents)} ist bei uns eingegangen. Deine Rechnung erhältst du per E-Mail an ${data.email}.`;
      status.tabIndex = -1;
      status.focus();
    } catch {
      status.className = 'form-status is-error';
      status.textContent = 'Der Versand konnte nicht bestätigt werden. Deine Eingaben bleiben erhalten. Bitte versuche es erneut oder kontaktiere uns unter +49 1590 6808767.';
      sending = false;
      submit.disabled = false;
      back.disabled = false;
      submit.textContent = 'Bestellanfrage abschicken';
    }
  });
  show(0, false);
}
