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
        <button type="button" class="gull-chat-sound" aria-label="Chat-Ton ausschalten" aria-pressed="true">♪</button>
        <button type="button" class="gull-chat-close" aria-label="Chat schließen">×</button>
      </header>
      <div class="gull-chat-body">
        <div class="gull-chat-profile"><img src="${gull}" alt="Die Hamburger Möwe" width="48" height="48"><div><h2 id="gull-chat-title" tabindex="-1">Deine Möwe aus Hamburg</h2><small>Dein digitaler Chat-Assistent</small></div></div>
        <div class="gull-chat-history" role="log" aria-live="polite" aria-relevant="additions" aria-label="Chatverlauf"></div>
        <div class="gull-chat-typing" role="status" hidden><span aria-hidden="true"><i></i><i></i><i></i></span> Die Möwe schreibt …</div>
        <div class="gull-chat-options" role="group" aria-label="Wobei brauchst du Hilfe?" hidden></div>
        <a class="gull-chat-whatsapp" target="_blank" rel="noopener" hidden>WhatsApp-Chat öffnen <span aria-hidden="true">↗</span></a>
        <small class="gull-chat-note">Du sendest die Nachricht selbst in WhatsApp.</small>
      </div>
    </section>`;
  document.body.append(widget);
  const launcher = widget.querySelector('.gull-chat-launcher');
  const panel = widget.querySelector('.gull-chat-panel');
  const options = widget.querySelector('.gull-chat-options');
  const whatsapp = widget.querySelector('.gull-chat-whatsapp');
  const history = widget.querySelector('.gull-chat-history');
  const typing = widget.querySelector('.gull-chat-typing');
  const soundButton = widget.querySelector('.gull-chat-sound');
  let soundEnabled = true;
  let audio;
  let timer;
  let started = false;
  const queue = [];
  function enableAudio() {
    if (!soundEnabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!audio && Audio) audio = new Audio();
      if (audio?.state === 'suspended') void audio.resume().catch(() => {});
    } catch { /* The visual conversation also works without audio. */ }
  }
  function bing() {
    if (!soundEnabled || audio?.state !== 'running' || document.hidden) return;
    const start = audio.currentTime;
    for (const [offset, frequency] of [[0, 880], [0.12, 1175]]) {
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      tone.frequency.value = frequency;
      volume.gain.setValueAtTime(0, start + offset);
      volume.gain.linearRampToValueAtTime(0.035, start + offset + 0.015);
      volume.gain.exponentialRampToValueAtTime(0.001, start + offset + 0.2);
      tone.connect(volume); volume.connect(audio.destination);
      tone.start(start + offset); tone.stop(start + offset + 0.22);
      tone.onended = () => { tone.disconnect(); volume.disconnect(); };
    }
  }
  function appendMessage(text, fromUser = false) {
    const bubble = document.createElement('p');
    bubble.className = fromUser ? 'gull-chat-user' : 'gull-chat-bubble gull-chat-incoming';
    bubble.textContent = text; history.append(bubble);
    bubble.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (!fromUser) bing();
  }
  function deliverNext() {
    if (timer || panel.hidden || document.hidden || !queue.length) return;
    typing.hidden = false;
    const pending = queue[0];
    timer = window.setTimeout(() => {
      timer = null; queue.shift(); typing.hidden = true;
      appendMessage(pending.text);
      pending.after?.();
      deliverNext();
    }, pending.delay);
  }
  function pause() { window.clearTimeout(timer); timer = null; typing.hidden = true; }
  soundButton.onclick = () => {
    soundEnabled = !soundEnabled;
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.setAttribute('aria-label', soundEnabled ? 'Chat-Ton ausschalten' : 'Chat-Ton einschalten');
    soundButton.textContent = soundEnabled ? '♪' : '♪̸';
    enableAudio();
  };
  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) {
      enableAudio();
      widget.querySelector('#gull-chat-title').focus();
      if (!started) {
        started = true;
        queue.push(
          { text: 'Moin! Ich bin deine Hamburger Möwe. 👋', delay: 600 },
          { text: 'Auto zulassen oder abmelden? Unser Team hilft dir dabei.', delay: 1100 },
          { text: 'Auch bei deinen Kennzeichen helfe ich dir gern weiter.', delay: 1300 },
          { text: 'Was steht bei dir an? Wähle unten dein Thema. ⚓', delay: 1100, after: () => { options.hidden = false; options.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } },
        );
      }
      deliverNext();
    } else { pause(); launcher.focus(); }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else deliverNext(); });
  launcher.onclick = () => setOpen(panel.hidden);
  widget.querySelector('.gull-chat-close').onclick = () => setOpen(false);
  widget.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); setOpen(false); } });
  for (const [label, message] of topics) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    button.setAttribute('aria-pressed', 'false');
    button.onclick = () => {
      const url = `https://wa.me/4915906808767?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      for (const option of options.children) option.setAttribute('aria-pressed', String(option === button));
      appendMessage(label, true);
      appendMessage('Weiter geht’s auf WhatsApp! Deine Frage ist schon vorbereitet. 💬');
      whatsapp.href = url;
      whatsapp.hidden = false;
    };
    options.append(button);
  }
}
