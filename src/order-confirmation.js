const summary = document.querySelector('[data-order-summary]');
if (summary) {
  const sessionId = new URLSearchParams(window.location.search).get('session_id');
  if (sessionId) {
    fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then(response => (response.ok ? response.json() : Promise.reject()))
      .then(result => {
        if (!result.ok) return Promise.reject();
        summary.querySelector('[data-order-plate]').textContent = result.plate;
        summary.querySelector('[data-order-total]').textContent = result.totalPriceFormatted;
        summary.hidden = false;
        if (result.invoicePdfUrl) {
          const invoiceLink = summary.querySelector('[data-invoice-link]');
          invoiceLink.href = result.invoicePdfUrl;
          invoiceLink.hidden = false;
        }
        const thanksText = document.querySelector('[data-thanks-text]');
        if (thanksText) {
          thanksText.textContent = result.testMode
            ? 'Dies war eine Testzahlung (1,00 €). Du erhältst in Kürze eine Bestätigungs-E-Mail mit deiner Rechnung als PDF.'
            : 'Deine Zahlung war erfolgreich. Du erhältst in Kürze eine Bestätigungs-E-Mail mit deiner Rechnung als PDF.';
        }
      })
      .catch(() => {});
  }
}
