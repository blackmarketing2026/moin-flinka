let stripeScript;
async function loadStripe() {
  if (window.Stripe) return;
  if (!stripeScript) stripeScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/dahlia/stripe.js';
    const timer = window.setTimeout(() => { script.remove(); stripeScript = null; reject(new Error('Zahlung konnte nicht geladen werden. Bitte erneut versuchen.')); }, 15000);
    script.onload = () => { window.clearTimeout(timer); resolve(); };
    script.onerror = () => { window.clearTimeout(timer); script.remove(); stripeScript = null; reject(new Error('Zahlung konnte nicht geladen werden.')); };
    document.head.append(script);
  });
  await stripeScript;
}
export async function openNativeCheckout(result, order, form, onEdit) {
  await loadStripe();
  const panel = document.querySelector('#payment-panel');
  const paymentForm = document.querySelector('#payment-form');
  const payButton = document.querySelector('#pay-order');
  const editButton = document.querySelector('#edit-order');
  const errorMessage = document.querySelector('#payment-error');
  const walletContainer = document.querySelector('#express-payment');
  const money = cents => (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  const checkout = window.Stripe(result.publishableKey).initCheckoutElementsSdk({
    clientSecret: result.clientSecret,
    defaultValues: { email: order.email, phoneNumber: order.phone, billingAddress: { name: order.name, address: { line1: order.street, postal_code: order.postcode, city: order.town, country: 'DE' } } },
    elementsOptions: { appearance: { theme: 'stripe', variables: { colorPrimary: '#092954', colorText: '#092954', borderRadius: '7px', fontFamily: 'Inter, Arial, sans-serif' } } },
  });
  const elements = [];
  let busy = false;
  let active = true;
  let amount = result.amountTotal;
  let totalLabel = money(amount);
  const cleanup = () => { active = false; elements.forEach(element => element.destroy()); paymentForm.onsubmit = null; editButton.onclick = null; };
  try {
    const loaded = await checkout.loadActions();
    if (loaded.type !== 'success') throw new Error(loaded.error?.message || 'Zahlung konnte nicht gestartet werden.');
    const { actions } = loaded;
    const session = actions.getSession();
    function renderTotal(session) {
      if (!active) return;
      amount = session.total.total.minorUnitsAmount;
      totalLabel = (amount / session.minorUnitsAmountDivisor).toLocaleString('de-DE', { style: 'currency', currency: session.currency.toUpperCase() });
      document.querySelector('#checkout-total').textContent = totalLabel;
      if (!busy) {
        payButton.disabled = !session.canConfirm;
        payButton.textContent = amount === 0 ? 'Jetzt bestellen' : `Jetzt ${totalLabel} zahlungspflichtig bestellen`;
      }
    }
    renderTotal(session);
    checkout.on('change', renderTotal);
    document.querySelector('#checkout-summary').textContent = form.querySelector('[data-summary]').textContent.replace(/ · Gesamtpreis:.*$/, '');
    document.querySelector('#checkout-address').textContent = `${order.name} · ${order.street} · ${order.postcode} ${order.town} · ${order.email} · ${order.phone}`;
    errorMessage.textContent = '';
    walletContainer.hidden = true;
    async function confirm(event) {
      if (busy) return;
      busy = true; payButton.disabled = true; editButton.disabled = true;
      payButton.textContent = 'Zahlung wird geprüft …'; errorMessage.textContent = '';
      try {
        const confirmed = await actions.confirm({ redirect: 'if_required', email: order.email, phoneNumber: order.phone, billingAddress: { name: order.name, address: { line1: order.street, postal_code: order.postcode, city: order.town, country: 'DE' } }, ...(event ? { expressCheckoutConfirmEvent: event } : {}) });
        if (confirmed.type === 'error') throw new Error(confirmed.error.message);
        window.location.assign(`/dankesseite-stripe?session_id=${encodeURIComponent(result.sessionId)}`);
      } catch (error) {
        errorMessage.textContent = error.message || 'Die Zahlung war nicht erfolgreich. Bitte erneut versuchen.';
        busy = false; editButton.disabled = false;
        renderTotal(actions.getSession());
      }
    }
    if (amount > 0) {
      const payment = checkout.createPaymentElement({ layout: 'accordion' }); elements.push(payment); payment.mount('#payment-element');
      const wallets = checkout.createExpressCheckoutElement(); elements.push(wallets);
      wallets.on('ready', event => { walletContainer.hidden = !event.availablePaymentMethods || !Object.values(event.availablePaymentMethods).some(Boolean); });
      wallets.on('confirm', event => { void confirm(event); }); wallets.mount('#express-payment');
    }
    form.hidden = true; panel.hidden = false; editButton.disabled = false;
    renderTotal(actions.getSession());
    paymentForm.onsubmit = event => { event.preventDefault(); void confirm(); };
    editButton.onclick = () => { if (busy) return; cleanup(); panel.hidden = true; form.hidden = false; onEdit(); };
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); document.querySelector('#payment-title').focus({ preventScroll: true });
  } catch (error) { cleanup(); throw error; }
}
