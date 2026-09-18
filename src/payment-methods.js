const methods = [
  ['Amex', '<rect x="2" y="4" width="64" height="36" rx="5" fill="#176bb5"/><text x="34" y="27" text-anchor="middle" fill="white" font-size="14" font-weight="800">AMEX</text>'],
  ['Kreditkarte', '<rect x="7" y="6" width="54" height="32" rx="5" fill="#092954"/><path d="M7 16h54" stroke="#abcee4" stroke-width="6"/><rect x="15" y="25" width="12" height="5" rx="1" fill="white"/>'],
  ['Mastercard', '<circle cx="26" cy="22" r="16" fill="#eb001b"/><circle cx="43" cy="22" r="16" fill="#f79e1b" fill-opacity=".85"/>'],
  ['Maestrocard', '<circle cx="26" cy="22" r="16" fill="#e5001a"/><circle cx="43" cy="22" r="16" fill="#0099df" fill-opacity=".85"/>'],
  ['Google Pay', '<text x="5" y="29" fill="#4285f4" font-size="23" font-weight="700">G</text><text x="24" y="29" fill="#303134" font-size="19">Pay</text>'],
  ['Apple Pay', '<path d="M17 13c-5-4-11 0-10 7 0 6 4 13 7 13 2 0 3-2 5-2s3 2 5 2c3 0 6-6 7-10-5-2-6-7-2-10-4-3-8-1-10 0h-2Zm2-2c-1-4 2-7 6-8 0 4-2 7-6 8Z" fill="#111"/><text x="33" y="29" fill="#111" font-size="18">Pay</text>'],
  ['Amazon Pay', '<text x="3" y="24" fill="#232f3e" font-size="12" font-weight="700">amazon pay</text><path d="M12 30q22 12 43-1m-8-1 9 1-3 7" fill="none" stroke="#ff9900" stroke-width="2.5"/>'],
];
if (!document.querySelector('.admin-page')) {
  const strip = document.createElement('div'); strip.className = 'payment-methods container';
  const label = document.createElement('strong'); label.textContent = 'Sicher bezahlen mit'; strip.append(label);
  const list = document.createElement('div'); list.className = 'payment-method-icons';
  for (const [name, graphic] of methods) { const item = document.createElement('span'); item.className = 'payment-method'; item.innerHTML = `<svg viewBox="0 0 68 44" role="img" aria-label="${name}">${graphic}</svg>`; const caption = document.createElement('small'); caption.textContent = name; item.append(caption); list.append(item); }
  strip.append(list); const note = document.createElement('small'); note.textContent = 'Die verfügbaren Zahlungsmethoden werden beim Bezahlen angezeigt und hängen von Gerät und Freischaltung ab.'; strip.append(note);
  const footer = document.querySelector('.site-footer'); if (footer) footer.before(strip); else document.querySelector('main')?.append(strip);
}
