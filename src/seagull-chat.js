const orderForm = document.querySelector('#kennzeichenForm');
if (orderForm) {
  const gull = new URL('../assets/img/moin-flinka-moewe.png', import.meta.url).href;
  const logo = new URL('../assets/img/moin-flinka-logo.png', import.meta.url).href;
  const topics = [
    ['Auto online zulassen', 'Moin! Ich möchte mein Auto online zulassen. Könnt ihr mir dabei helfen?'],
    ['Auto abmelden', 'Moin! Ich möchte mein Auto abmelden. Könnt ihr mir dabei helfen?'],
    ['Hilfe bei der Kennzeichen-Erstellung', 'Moin! Ich brauche Hilfe bei der Kennzeichen-Erstellung.'],
    ['Mit einem Mitarbeiter schreiben', 'Moin! Ich möchte mit einem Mitarbeiter von Moin Flinka schreiben.'],
  ];
  const widget = document.createElement('aside');
  widget.className = 'gull-chat';
  widget.setAttribute('aria-label', 'Moin Flinka Chat-Assistent');
  widget.innerHTML = `
    <button type="button" class="gull-chat-launcher" aria-expanded="false" aria-controls="gull-chat-panel" aria-label="Chat mit der Hamburger Möwe öffnen">
      <img src="${gull}" alt="" width="48" height="48"><span>Frag die Möwe</span>
    </button>
    <section id="gull-chat-panel" class="gull-chat-panel" role="dialog" aria-labelledby="gull-chat-title" hidden>
      <header class="gull-chat-header">
        <img src="${logo}" alt="Moin Flinka" width="150" height="50">
        <button type="button" class="gull-chat-close" aria-label="Chat schließen">×</button>
      </header>
      <div class="gull-chat-body">
        <div class="gull-chat-profile"><img src="${gull}" alt="Die Hamburger Möwe" width="48" height="48"><div><h2 id="gull-chat-title" tabindex="-1">Deine Möwe aus Hamburg</h2><small>Dein digitaler Chat-Assistent</small></div></div>
        <div class="gull-chat-bubble"><p>Moin! Ich bin die Möwe aus Hamburg. 👋</p><p>Wie kann ich dir helfen?</p><p>Sollen wir dein Auto auch online zulassen oder abmelden? Brauchst du Hilfe bei der Kennzeichen-Erstellung? Oder möchtest du einfach mit einem Mitarbeiter schreiben?</p></div>
        <div class="gull-chat-options" role="group" aria-label="Wobei brauchst du Hilfe?"></div>
        <div class="gull-chat-response" aria-live="polite" hidden><p class="gull-chat-user"></p><p class="gull-chat-bubble">Klar, ich bringe dich zu unserem Team! Öffne WhatsApp – deine Frage ist dort schon vorbereitet. ⚓</p></div>
        <a class="gull-chat-whatsapp" target="_blank" rel="noopener" hidden>WhatsApp-Chat öffnen <span aria-hidden="true">↗</span></a>
        <small class="gull-chat-note">Du sendest die Nachricht selbst in WhatsApp.</small>
      </div>
    </section>`;
  document.body.append(widget);
  const launcher = widget.querySelector('.gull-chat-launcher');
  const panel = widget.querySelector('.gull-chat-panel');
  const options = widget.querySelector('.gull-chat-options');
  const whatsapp = widget.querySelector('.gull-chat-whatsapp');
  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) widget.querySelector('#gull-chat-title').focus();
    else launcher.focus();
  }
  launcher.onclick = () => setOpen(panel.hidden);
  widget.querySelector('.gull-chat-close').onclick = () => setOpen(false);
  widget.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); setOpen(false); } });
  for (const [label, message] of topics) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    button.setAttribute('aria-pressed', 'false');
    button.onclick = () => {
      for (const option of options.children) option.setAttribute('aria-pressed', String(option === button));
      widget.querySelector('.gull-chat-user').textContent = label;
      widget.querySelector('.gull-chat-response').hidden = false;
      whatsapp.href = `https://wa.me/4915906808767?text=${encodeURIComponent(message)}`;
      whatsapp.hidden = false;
      whatsapp.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    options.append(button);
  }
}
