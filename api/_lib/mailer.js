const path = require("path");
const nodemailer = require("nodemailer");

function getRecipients() {
  return (process.env.smtp_empaenger || "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function digitsOnly(value) {
  return String(value ?? "").replace(/[^\d+]/g, "");
}

function buildLeadHtml({ name, phone, email, topic, message }) {
  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safeEmail = escapeHtml(email);
  const safeTopic = escapeHtml(topic);
  const safeMessage = escapeHtml(message || "-").replace(/\n/g, "<br />");

  const whatsappNumber = digitsOnly(phone).replace(/^00/, "").replace(/^\+/, "");
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Moin ${name}, vielen Dank für deine Anfrage bei Moin Flinka zum Thema "${topic}". Wie können wir dir weiterhelfen?`
  )}`;
  const callHref = `tel:${digitsOnly(phone)}`;
  const emailHref = `mailto:${email}?subject=${encodeURIComponent(`Deine Anfrage bei Moin Flinka: ${topic}`)}`;

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Neuer Lead</title>
  </head>
  <body style="margin:0; padding:0; background-color:#eaf7fe; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eaf7fe; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 12px 28px rgba(9,41,84,0.14);">
            <tr>
              <td align="center" style="background-color:#f5fbff; padding:24px 20px;">
                <img
                  src="cid:moinflinkalogo"
                  width="180"
                  alt="Moin Flinka"
                  style="display:block; max-width:180px; width:100%; height:auto; border:0;"
                />
              </td>
            </tr>
            <tr>
              <td style="background-color:#f1070e; padding:4px;"></td>
            </tr>
            <tr>
              <td style="padding:26px 24px 6px;">
                <p style="margin:0 0 4px; color:#516a86; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;">
                  Neue Anfrage &uuml;ber moin-flinka.de
                </p>
                <h1 style="margin:0 0 18px; color:#092954; font-size:22px; line-height:1.3; font-family:Arial, Helvetica, sans-serif;">
                  ${safeName} interessiert sich f&uuml;r &bdquo;${safeTopic}&ldquo;
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5fbff; border:1px solid #dcebf5; border-radius:10px;">
                  <tr>
                    <td style="padding:16px 18px; font-size:14px; color:#203a5e; border-bottom:1px solid #dcebf5;">
                      <strong style="color:#092954;">Name</strong><br />${safeName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 18px; font-size:14px; color:#203a5e; border-bottom:1px solid #dcebf5;">
                      <strong style="color:#092954;">Telefon</strong><br />${safePhone}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 18px; font-size:14px; color:#203a5e; border-bottom:1px solid #dcebf5;">
                      <strong style="color:#092954;">E-Mail</strong><br />${safeEmail}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 18px; font-size:14px; color:#203a5e; border-bottom:1px solid #dcebf5;">
                      <strong style="color:#092954;">Thema</strong><br />${safeTopic}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 18px; font-size:14px; color:#203a5e;">
                      <strong style="color:#092954;">Nachricht</strong><br />${safeMessage}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px 6px;">
                <p style="margin:0 0 14px; color:#516a86; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;">
                  Jetzt direkt Kontakt aufnehmen
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:10px;">
                      <a
                        href="${whatsappHref}"
                        style="display:block; background-color:#42a4c8; color:#ffffff; text-decoration:none; font-weight:800; font-size:14px; text-align:center; padding:14px 12px; border-radius:8px; font-family:Arial, Helvetica, sans-serif;"
                        >WhatsApp schreiben</a
                      >
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:10px;">
                      <a
                        href="${callHref}"
                        style="display:block; background-color:#092954; color:#ffffff; text-decoration:none; font-weight:800; font-size:14px; text-align:center; padding:14px 12px; border-radius:8px; font-family:Arial, Helvetica, sans-serif;"
                        >Jetzt anrufen</a
                      >
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <a
                        href="${emailHref}"
                        style="display:block; background-color:#f1070e; color:#ffffff; text-decoration:none; font-weight:800; font-size:14px; text-align:center; padding:14px 12px; border-radius:8px; font-family:Arial, Helvetica, sans-serif;"
                        >E-Mail schreiben</a
                      >
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 26px;">
                <p style="margin:0; color:#a9c2d8; font-size:11px; text-align:center;">
                  Automatische Lead-Benachrichtigung von moin-flinka.de
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildPaymentConfirmedHtml({ name, phone, email, topic, message }) {
  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safeEmail = escapeHtml(email);
  const safeTopic = escapeHtml(topic);
  const safeMessage = escapeHtml(message || "-").replace(/\n/g, "<br />");

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Zahlung eingegangen</title>
  </head>
  <body style="margin:0; padding:0; background-color:#eaf7fe; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eaf7fe; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 12px 28px rgba(9,41,84,0.14);">
            <tr>
              <td align="center" style="background-color:#f5fbff; padding:24px 20px;">
                <img
                  src="cid:moinflinkalogo"
                  width="180"
                  alt="Moin Flinka"
                  style="display:block; max-width:180px; width:100%; height:auto; border:0;"
                />
              </td>
            </tr>
            <tr>
              <td style="background-color:#1a9b4f; padding:4px;"></td>
            </tr>
            <tr>
              <td style="padding:26px 24px 6px;">
                <p style="margin:0 0 4px; color:#1a9b4f; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;">
                  Zahlung eingegangen &uuml;ber moin-flinka.de
                </p>
                <h1 style="margin:0 0 18px; color:#092954; font-size:22px; line-height:1.3; font-family:Arial, Helvetica, sans-serif;">
                  ${safeName} hat &bdquo;${safeTopic}&ldquo; bezahlt
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5fbff; border:1px solid #dcebf5; border-radius:10px;">
                  <tr>
                    <td style="padding:16px 18px; font-size:14px; color:#203a5e; border-bottom:1px solid #dcebf5;">
                      <strong style="color:#092954;">Name</strong><br />${safeName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 18px; font-size:14px; color:#203a5e; border-bottom:1px solid #dcebf5;">
                      <strong style="color:#092954;">Telefon</strong><br />${safePhone}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 18px; font-size:14px; color:#203a5e; border-bottom:1px solid #dcebf5;">
                      <strong style="color:#092954;">E-Mail</strong><br />${safeEmail}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 18px; font-size:14px; color:#203a5e;">
                      <strong style="color:#092954;">Bestelldetails</strong><br />${safeMessage}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 26px;">
                <p style="margin:0; color:#a9c2d8; font-size:11px; text-align:center;">
                  Automatische Zahlungsbestätigung von moin-flinka.de (Stripe-Webhook)
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildCustomerThankYouHtml({ name, productLabel, plateLabel, summaryLines }) {
  const safeName = escapeHtml(name);
  const safeProduct = escapeHtml(productLabel);
  const safePlate = escapeHtml(plateLabel);
  const safeSummary = summaryLines.map((line) => escapeHtml(line)).join("<br />");

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vielen Dank für deine Bestellung</title>
  </head>
  <body style="margin:0; padding:0; background-color:#eaf7fe; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eaf7fe; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 12px 28px rgba(9,41,84,0.14);">
            <tr>
              <td align="center" style="background-color:#f5fbff; padding:24px 20px;">
                <img
                  src="cid:moinflinkalogo"
                  width="180"
                  alt="Moin Flinka"
                  style="display:block; max-width:180px; width:100%; height:auto; border:0;"
                />
              </td>
            </tr>
            <tr>
              <td style="background-color:#1a9b4f; padding:4px;"></td>
            </tr>
            <tr>
              <td style="padding:26px 24px 6px;">
                <p style="margin:0 0 4px; color:#1a9b4f; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;">
                  Bestellung eingegangen &middot; Zahlung erfolgreich
                </p>
                <h1 style="margin:0 0 12px; color:#092954; font-size:22px; line-height:1.3; font-family:Arial, Helvetica, sans-serif;">
                  Moin ${safeName}, vielen Dank f&uuml;r deine Bestellung!
                </h1>
                <p style="margin:0 0 18px; color:#203a5e; font-size:14px; line-height:1.6;">
                  Deine Bestellung ist bei uns eingegangen und deine Zahlung wurde erfolgreich durchgef&uuml;hrt. Deine Bestellung wird umgehend bearbeitet.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5fbff; border:1px solid #dcebf5; border-radius:10px; margin-bottom:14px;">
                  <tr>
                    <td style="padding:16px 18px; font-size:14px; color:#203a5e; border-bottom:1px solid #dcebf5;">
                      <strong style="color:#092954;">Produkt</strong><br />${safeProduct}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 18px; font-size:14px; color:#203a5e;">
                      <strong style="color:#092954;">Kennzeichen</strong><br />${safePlate}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px 0;">
                <p style="margin:0; color:#203a5e; font-size:14px; line-height:1.6;">
                  Deine Rechnung senden wir dir automatisch per E-Mail zu, sobald sie vorliegt.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5fbff; border:1px solid #dcebf5; border-radius:10px;">
                  <tr>
                    <td style="padding:16px 18px; font-size:14px; color:#203a5e;">
                      ${safeSummary}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 26px;">
                <p style="margin:0; color:#a9c2d8; font-size:11px; text-align:center;">
                  Bei Fragen erreichst du uns unter info@moin-flinka.de oder +49 1590 6808767.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildCustomerInvoiceHtml({ name, plateLabel, invoicePdfUrl }) {
  const safeName = escapeHtml(name);
  const safePlate = escapeHtml(plateLabel);

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Deine Rechnung</title>
  </head>
  <body style="margin:0; padding:0; background-color:#eaf7fe; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eaf7fe; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 12px 28px rgba(9,41,84,0.14);">
            <tr>
              <td align="center" style="background-color:#f5fbff; padding:24px 20px;">
                <img
                  src="cid:moinflinkalogo"
                  width="180"
                  alt="Moin Flinka"
                  style="display:block; max-width:180px; width:100%; height:auto; border:0;"
                />
              </td>
            </tr>
            <tr>
              <td style="background-color:#092954; padding:4px;"></td>
            </tr>
            <tr>
              <td style="padding:26px 24px 6px;">
                <p style="margin:0 0 4px; color:#092954; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;">
                  Deine Rechnung
                </p>
                <h1 style="margin:0 0 12px; color:#092954; font-size:22px; line-height:1.3; font-family:Arial, Helvetica, sans-serif;">
                  Moin ${safeName}, hier ist deine Rechnung!
                </h1>
                <p style="margin:0 0 18px; color:#203a5e; font-size:14px; line-height:1.6;">
                  Anbei findest du die Rechnung zu deiner Bestellung f&uuml;r dein Kennzeichen <strong>${safePlate}</strong> als PDF im Anhang.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <a
                        href="${invoicePdfUrl}"
                        style="display:block; background-color:#092954; color:#ffffff; text-decoration:none; font-weight:800; font-size:14px; text-align:center; padding:14px 12px; border-radius:8px; font-family:Arial, Helvetica, sans-serif;"
                        >Rechnung herunterladen (PDF)</a
                      >
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 26px;">
                <p style="margin:0; color:#a9c2d8; font-size:11px; text-align:center;">
                  Bei Fragen erreichst du uns unter info@moin-flinka.de oder +49 1590 6808767.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const SMTP_ACCOUNTS = {
  default: { server: "smtp_server", user: "smtp_user", password: "smtp_passwort" },
  order: { server: "order_smtp_server", user: "order_smtp_user", password: "order_smtp_passwort" },
};

async function sendMail({ subject, text, html, replyTo, to, attachments = [], account = "default" }) {
  const envKeys = SMTP_ACCOUNTS[account];
  const smtpServer = process.env[envKeys.server];
  const smtpUser = process.env[envKeys.user];
  const smtpPassword = process.env[envKeys.password];
  const recipients = to || getRecipients();
  const hasRecipients = Array.isArray(recipients) ? recipients.length > 0 : Boolean(recipients);

  if (!smtpServer || !smtpUser || !smtpPassword || !hasRecipients) {
    const error = new Error("SMTP ist nicht konfiguriert.");
    error.configError = true;
    throw error;
  }

  const transporter = nodemailer.createTransport({
    host: smtpServer,
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPassword },
  });

  const logoPath = path.join(__dirname, "..", "..", "assets", "img", "email-logo.png");

  await transporter.sendMail({
    from: `"Moin Flinka Website" <${smtpUser}>`,
    to: recipients,
    replyTo,
    subject,
    text,
    html,
    attachments: [
      {
        filename: "moin-flinka-logo.png",
        path: logoPath,
        cid: "moinflinkalogo",
      },
      ...attachments,
    ],
  });
}

module.exports = {
  getRecipients,
  escapeHtml,
  digitsOnly,
  buildLeadHtml,
  buildPaymentConfirmedHtml,
  buildCustomerThankYouHtml,
  buildCustomerInvoiceHtml,
  sendMail,
};
