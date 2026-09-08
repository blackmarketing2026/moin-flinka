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
  const plate = () => `${field('city').value} ${field('letters').value} ${field('digits').value}`;
  const delivery = () => field('delivery').value === 'shipping' ? 'Kostenloser Versand innerhalb Deutschlands' : 'Direkte Auslieferung in Hamburg (Termin und Kosten nach Abstimmung)';
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
    form.querySelector('[data-summary]').textContent = `${plate()} · 1 Schild · ${delivery()}`;
    status.textContent = '';
    if (focus) steps[step].querySelector('legend').focus();
  }
  ['city', 'letters'].forEach(name => field(name).addEventListener('input', () => {
    field(name).value = field(name).value.toLocaleUpperCase('de-DE');
    field('digits').setCustomValidity('');
  }));
  field('digits').addEventListener('input', () => field('digits').setCustomValidity(''));
  function validate(index) {
    if (index === 0) field('digits').setCustomValidity(plate().replaceAll(' ', '').length > 8 ? 'Dein Kennzeichen darf insgesamt höchstens 8 Zeichen haben.' : '');
    const invalid = [...steps[index].querySelectorAll('input, textarea')].find(input => !input.checkValidity());
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
    data.quantity = 1;
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
      status.textContent = `Vielen Dank! Deine Bestellanfrage für 1 Schild (${plate()}) ist bei uns eingegangen. Wir melden uns zur Preisabstimmung unter ${data.email}. Anschließend erhältst du deine Rechnung per E-Mail.`;
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
