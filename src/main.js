import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "./styles.css";

import logoUrl from "../assets/img/moin-flinka-logo.png";
import gullUrl from "../assets/img/moin-flinka-moewe.png";
import { CONTACT, FORM_ENDPOINT_NOTE } from "./config.js";
import { benefits, faqs, heroBenefits, services, steps, topics } from "./data.js";
import { icon } from "./icons.js";

const emailHref = CONTACT.EMAIL_ADDRESS.includes("@") ? `mailto:${CONTACT.EMAIL_ADDRESS}` : "#kontakt";

document.querySelector("#app").innerHTML = `
  <div class="topbar">
    <div class="container topbar-inner">
      <p>Schnelle Kfz-Zulassung in Hamburg? Jetzt anrufen: ${CONTACT.PHONE_DISPLAY}</p>
      <a class="topbar-call" href="${CONTACT.PHONE_LINK}" aria-label="Jetzt telefonisch anrufen">${icon.phone()}<span>Jetzt anrufen</span></a>
    </div>
  </div>

  <header class="site-header" id="top">
    <div class="container header-inner">
      <a class="brand" href="#top" aria-label="Moin Flinka Startseite">
        <img src="${logoUrl}" alt="Moin Flinka - Express Kfz-Zulassung & Schilder" width="1182" height="300" />
      </a>
      <nav class="nav" id="mainNav" aria-label="Hauptnavigation">
        <a href="#leistungen">Leistungen</a>
        <a href="#ablauf">Ablauf</a>
        <a href="#faq">FAQ</a>
        <a href="#kontakt">Kontakt</a>
      </nav>
      <div class="header-actions">
        <a class="btn btn-light" href="${CONTACT.WHATSAPP_LINK}" target="_blank" rel="noopener">${icon.whatsapp()}<span>WhatsApp</span></a>
        <a class="btn btn-primary" href="#kontakt">Jetzt anfragen</a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mainNav" aria-label="Navigation öffnen">${icon.menu()}</button>
      </div>
    </div>
  </header>

  <main>
    <section class="hero" aria-labelledby="hero-title">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Express Kfz-Zulassung &amp; Schilder in Hamburg</p>
          <h1 id="hero-title"><span>Heute zulassen.</span><span>Schilder bekommen.</span><span>Direkt losfahren.</span></h1>
          <p class="hero-text">Moin Flinka ist Ihr schneller Ansprechpartner für Kfz-Zulassungen, Online-Zulassungen und Kfz-Kennzeichen in Hamburg. Wir übernehmen die Abwicklung unkompliziert, persönlich und zuverlässig.</p>
          <ul class="hero-benefits">
            ${heroBenefits.map((item) => `<li><span class="benefit-icon">${icon[item.icon]()}</span><span>${item.text}</span></li>`).join("")}
          </ul>
          <div class="hero-actions">
            <a class="btn btn-primary" href="${CONTACT.WHATSAPP_LINK}" target="_blank" rel="noopener">${icon.whatsapp()}<span>Jetzt per WhatsApp anfragen</span></a>
            <a class="btn btn-secondary" href="${CONTACT.PHONE_LINK}">${icon.phone()}<span>Jetzt anrufen</span></a>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-circle"></div>
          <div class="speedlines speedlines-a"><i></i><i></i><i></i></div>
          <img class="hero-gull" src="${gullUrl}" alt="Moin Flinka Möwe mit Kfz-Kennzeichen" width="1155" height="835" />
          <div class="hamburg-skyline" aria-hidden="true">
            <span class="crane crane-one"></span><span class="crane crane-two"></span><span class="tower"></span>
          </div>
          <div class="background-birds" aria-hidden="true"><span></span><span></span></div>
          <div class="wave-lines" aria-hidden="true"></div>
        </div>
      </div>
    </section>

    <section class="services-section" id="leistungen">
      <div class="section-waves left" aria-hidden="true"></div>
      <div class="section-waves right" aria-hidden="true"></div>
      <div class="container">
        <div class="section-head">
          <h2>Kfz-Zulassung und Kennzeichen in Hamburg</h2>
          <p>Ob Neuzulassung, Ummeldung, Abmeldung oder neue Kennzeichen: Moin Flinka sorgt dafür, dass Sie sich nicht selbst mit langen Wartezeiten und komplizierten Abläufen beschäftigen müssen. Ihr Zulassungsdienst Hamburg für Online-Zulassung Hamburg, i-Kfz Hamburg, Kfz-Schilder Hamburg, Autoschilder Hamburg und Wunschkennzeichen Hamburg.</p>
        </div>
        <div class="service-grid">
          ${services.map((item) => `
            <article class="service-card">
              <div class="service-icon">${icon[item.icon]()}</div>
              <h3>${item.title}</h3>
              <p>${item.text}</p>
            </article>
          `).join("")}
        </div>
        <div class="center"><a class="btn btn-primary" href="#kontakt">Service jetzt anfragen</a></div>
      </div>
    </section>

    <section class="benefits-section">
      <div class="container">
        <div class="section-head compact"><h2>Schnell. Persönlich. Norddeutsch unkompliziert.</h2></div>
        <div class="benefit-grid">
          ${benefits.map((item) => `
            <article class="benefit-card">
              <div class="round-icon">${icon[item.icon]()}</div>
              <h3>${item.title}</h3>
              <p>${item.text}</p>
            </article>
          `).join("")}
        </div>

        <div class="process" id="ablauf">
          <h2>So funktioniert Ihre Anfrage</h2>
          <div class="process-grid">
            ${steps.map((item, index) => `
              <article class="process-step">
                <div class="step-number">${index + 1}</div>
                <div class="step-icon">${icon[item.icon]()}</div>
                <h3>${index + 1}. ${item.title}</h3>
                <p>${item.text}</p>
              </article>
            `).join("")}
          </div>
        </div>
      </div>
    </section>

    <section class="documents-section" aria-labelledby="documents-title">
      <div class="container">
        <h2 class="documents-kicker" id="documents-title">Moin sagen. Anfrage stellen. <span>Flinka</span> losfahren.</h2>
        <div class="documents-card">
          <div class="documents-art">${icon.checklist()}</div>
          <div class="documents-copy">
            <h3>Welche Unterlagen werden benötigt?</h3>
            <p>Welche Dokumente erforderlich sind, hängt von Ihrem individuellen Zulassungsvorgang ab. Häufig werden unter anderem Personalausweis, Zulassungsbescheinigung, eVB-Nummer, SEPA-Mandat und gegebenenfalls TÜV-Nachweis benötigt.</p>
            <div class="notice"><span>${icon.check()}</span><strong>Nach Ihrer Anfrage erhalten Sie eine passende Übersicht der benötigten Unterlagen.</strong></div>
          </div>
        </div>
      </div>
    </section>

    <section class="faq-section" id="faq">
      <div class="container faq-grid">
        <div class="faq-illustration" aria-hidden="true"><div class="lighthouse"></div><div class="light-birds"><span></span><span></span></div></div>
        <div class="faq-content">
          <h2>Häufige Fragen</h2>
          <div class="accordion" data-accordion>
            ${faqs.map((item, index) => `
              <article class="faq-item ${index === 0 ? "is-open" : ""}">
                <h3>
                  <button type="button" id="faq-button-${index}" aria-expanded="${index === 0}" aria-controls="faq-panel-${index}">
                    <span>${item.question}</span>${icon.chevron()}
                  </button>
                </h3>
                <div class="faq-panel" id="faq-panel-${index}" role="region" aria-labelledby="faq-button-${index}" ${index === 0 ? "" : "hidden"}>
                  <p>${item.answer}</p>
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      </div>
    </section>

    <section class="contact-section" id="kontakt">
      <div class="container contact-grid">
        <div class="contact-copy">
          <h2>Jetzt Kfz-Zulassung oder Schilder anfragen</h2>
          <p>Schreiben Sie uns kurz, was Sie benötigen. Wir melden uns über Ihren gewünschten Kontaktweg bei Ihnen.</p>
          <div class="contact-cards">
            <article class="contact-card">
              <div class="contact-icon whatsapp">${icon.whatsapp()}</div>
              <h3>WhatsApp</h3>
              <a class="btn btn-primary small" href="${CONTACT.WHATSAPP_LINK}" target="_blank" rel="noopener">WhatsApp öffnen</a>
            </article>
            <article class="contact-card">
              <div class="contact-icon">${icon.phone()}</div>
              <h3>Telefon</h3>
              <p>${CONTACT.PHONE_DISPLAY}</p>
              <a class="btn btn-primary small" href="${CONTACT.PHONE_LINK}">Jetzt anrufen</a>
            </article>
            <article class="contact-card">
              <div class="contact-icon">${icon.mail()}</div>
              <h3>E-Mail</h3>
              <p>${CONTACT.EMAIL_ADDRESS}</p>
              <a class="btn btn-primary small" href="${emailHref}">E-Mail schreiben</a>
            </article>
          </div>
          <div class="phone-mock" aria-hidden="true">
            <div class="phone-screen">
              <strong>Heute zulassen.<br>Schilder bekommen.<br>Direkt losfahren.</strong>
              <img src="${logoUrl}" alt="" width="1182" height="300" loading="lazy" />
            </div>
          </div>
        </div>

        <form class="contact-form" novalidate>
          <div class="form-row">
            <label>Vor- und Nachname<input name="name" autocomplete="name" required /></label>
            <label>Telefonnummer<input name="phone" type="tel" autocomplete="tel" required /></label>
          </div>
          <label>E-Mail-Adresse<input name="email" type="email" autocomplete="email" required /></label>
          <fieldset>
            <legend>Bevorzugter Kontaktweg</legend>
            <label><input type="radio" name="contactWay" value="WhatsApp" checked /> WhatsApp</label>
            <label><input type="radio" name="contactWay" value="Telefon" /> Telefon</label>
            <label><input type="radio" name="contactWay" value="E-Mail" /> E-Mail</label>
          </fieldset>
          <label>Worum geht es?
            <select name="topic" required>
              <option value="">Bitte auswählen</option>
              ${topics.map((topic) => `<option>${topic}</option>`).join("")}
            </select>
          </label>
          <label>Nachricht<textarea name="message" rows="5"></textarea></label>
          <label class="privacy"><input name="privacy" type="checkbox" required /> <span>Ich habe die <a href="#datenschutz">Datenschutzerklärung</a> zur Kenntnis genommen.</span></label>
          <button class="btn btn-primary submit" type="submit">Kostenlos und unverbindlich anfragen</button>
          <p class="trust-note">${icon.check()} <span>Ihre Angaben werden nur zur Bearbeitung Ihrer Anfrage verwendet. ${FORM_ENDPOINT_NOTE}</span></p>
          <p class="form-status" role="status" aria-live="polite"></p>
        </form>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <a class="footer-logo" href="#top"><img src="${logoUrl}" alt="Moin Flinka - Express Kfz-Zulassung & Schilder" width="1182" height="300" loading="lazy" /></a>
      <p>Moin Flinka – Ihr Ansprechpartner für Kfz-Zulassung, Online-Zulassung und Kfz-Schilder in Hamburg. Kennzeichen liefern lassen in Hamburg? Fragen Sie direkt an.</p>
      <div class="footer-contact">
        <a href="${CONTACT.PHONE_LINK}">${icon.phone()}<span>${CONTACT.PHONE_DISPLAY}</span></a>
        <a href="${CONTACT.WHATSAPP_LINK}" target="_blank" rel="noopener">${icon.whatsapp()}<span>WhatsApp</span></a>
        <a href="${emailHref}">${icon.mail()}<span>${CONTACT.EMAIL_ADDRESS}</span></a>
      </div>
      <div class="footer-art" aria-hidden="true"><span class="footer-crane one"></span><span class="footer-crane two"></span><span class="footer-waves"></span></div>
    </div>
    <div class="container footer-bottom">
      <div><a href="#impressum" id="impressum">Impressum</a><a href="#datenschutz" id="datenschutz">Datenschutzerklärung</a></div>
      <span>www.moin-flinka.de</span>
    </div>
  </footer>

  <div class="mobile-quickbar">
    <a href="${CONTACT.PHONE_LINK}">${icon.phone()}<span>Anrufen</span></a>
    <a href="${CONTACT.WHATSAPP_LINK}" target="_blank" rel="noopener">${icon.whatsapp()}<span>WhatsApp</span></a>
    <a href="#kontakt">${icon.mail()}<span>Anfrage</span></a>
  </div>
`;

const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector("#mainNav");

menuButton.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Navigation schließen" : "Navigation öffnen");
  menuButton.innerHTML = isOpen ? icon.close() : icon.menu();
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Navigation öffnen");
    menuButton.innerHTML = icon.menu();
  });
});

const faqButtons = [...document.querySelectorAll(".faq-item button")];

function setFaq(button, open) {
  const item = button.closest(".faq-item");
  const panel = document.querySelector(`#${button.getAttribute("aria-controls")}`);
  button.setAttribute("aria-expanded", String(open));
  item.classList.toggle("is-open", open);
  panel.hidden = !open;
}

faqButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    const shouldOpen = button.getAttribute("aria-expanded") !== "true";
    faqButtons.forEach((entry) => setFaq(entry, false));
    setFaq(button, shouldOpen);
  });

  button.addEventListener("keydown", (event) => {
    const last = faqButtons.length - 1;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      faqButtons[index === last ? 0 : index + 1].focus();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      faqButtons[index === 0 ? last : index - 1].focus();
    }
    if (event.key === "Home") {
      event.preventDefault();
      faqButtons[0].focus();
    }
    if (event.key === "End") {
      event.preventDefault();
      faqButtons[last].focus();
    }
  });
});

const form = document.querySelector(".contact-form");
const status = form.querySelector(".form-status");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "";
  form.querySelectorAll(".field-error").forEach((error) => error.remove());
  form.querySelectorAll(".invalid").forEach((field) => field.classList.remove("invalid"));

  if (!form.checkValidity()) {
    [...form.elements].forEach((field) => {
      if (field instanceof HTMLElement && "validity" in field && !field.validity.valid) {
        field.classList.add("invalid");
        const label = field.closest("label") || field.closest("fieldset");
        if (label && !label.querySelector(".field-error")) {
          const error = document.createElement("span");
          error.className = "field-error";
          error.textContent = field.validity.valueMissing
            ? "Bitte ausfüllen."
            : "Bitte gültig ausfüllen.";
          label.append(error);
        }
      }
    });
    status.textContent = "Bitte prüfen Sie die markierten Felder.";
    status.className = "form-status is-error";
    return;
  }

  if (!CONTACT.FORM_ENDPOINT) {
    status.textContent =
      "Das Formular ist vorbereitet. Zum echten Versand muss FORM_ENDPOINT in src/config.js eingetragen werden.";
    status.className = "form-status is-info";
    return;
  }

  const response = await fetch(CONTACT.FORM_ENDPOINT, {
    method: "POST",
    body: new FormData(form),
  });

  if (response.ok) {
    form.reset();
    status.textContent = "Ihre Anfrage wurde versendet.";
    status.className = "form-status is-success";
  } else {
    status.textContent = "Der Versand war nicht möglich. Bitte versuchen Sie es telefonisch oder per WhatsApp.";
    status.className = "form-status is-error";
  }
});
