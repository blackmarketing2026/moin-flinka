import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "./styles.css";

const configNode = document.querySelector("#site-config");
const siteConfig = configNode ? JSON.parse(configNode.textContent) : {};

const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector("#mainNav");

if (menuButton && nav) {
  const menuIcon = menuButton.querySelector(".icon-menu");
  const closeIcon = menuButton.querySelector(".icon-close");

  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Navigation schlie\u00dfen" : "Navigation \u00f6ffnen");
    if (menuIcon) menuIcon.hidden = isOpen;
    if (closeIcon) closeIcon.hidden = !isOpen;
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Navigation \u00f6ffnen");
      if (menuIcon) menuIcon.hidden = false;
      if (closeIcon) closeIcon.hidden = true;
    });
  });
}

const faqButtons = [...document.querySelectorAll(".faq-item button")];

function setFaq(button, open) {
  const item = button.closest(".faq-item");
  const panel = document.querySelector(`#${button.getAttribute("aria-controls")}`);
  if (!item || !panel) return;

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

if (form) {
  const status = form.querySelector(".form-status");
  const endpoint = form.dataset.formEndpoint || siteConfig.FORM_ENDPOINT || "";

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
            error.textContent = field.validity.valueMissing ? "Bitte ausf\u00fcllen." : "Bitte g\u00fcltig ausf\u00fcllen.";
            label.append(error);
          }
        }
      });
      status.textContent = "Bitte pr\u00fcfen Sie die markierten Felder.";
      status.className = "form-status is-error";
      return;
    }

    if (!endpoint) {
      status.textContent =
        "Das Formular ist vorbereitet. Zum echten Versand muss FORM_ENDPOINT im site-config-Block in index.html eingetragen werden.";
      status.className = "form-status is-info";
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
      });

      if (response.ok) {
        form.reset();
        status.textContent = "Ihre Anfrage wurde versendet.";
        status.className = "form-status is-success";
      } else {
        status.textContent = "Der Versand war nicht m\u00f6glich. Bitte versuchen Sie es telefonisch oder per WhatsApp.";
        status.className = "form-status is-error";
      }
    } catch {
      status.textContent = "Der Versand war nicht m\u00f6glich. Bitte versuchen Sie es telefonisch oder per WhatsApp.";
      status.className = "form-status is-error";
    }
  });
}
