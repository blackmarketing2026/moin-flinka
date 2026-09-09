const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const prices = require("../plate-prices.json");

function getRecipients() {
  return (process.env.smtp_empaenger || "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
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

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).json({ ok: false, error: "Ungültige Anfrage." });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ ok: false, error: "Ungültige Anfrage." });
  }
  let { name, phone, email, topic, message } = body;
  if (body.orderType === "plate") {
    const suffix = { electric: "E", historic: "H" }[body.plateVariant] || "";
    const required = ["name", "phone", "email", "city", "letters", "digits", "street", "postcode", "town"];
    if (required.some(key => typeof body[key] !== "string" || !body[key].trim() || body[key].length > 200) ||
        !/^[A-ZÄÖÜ]{1,3}$/.test(body.city) || !/^[A-Z]{1,2}$/.test(body.letters) ||
        !/^[1-9][0-9]{0,3}$/.test(body.digits) || (body.city + body.letters + body.digits + suffix).length > 8 ||
        !/^[0-9]{5}$/.test(body.postcode) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ||
        !["shipping", "local"].includes(body.delivery) || ![1, 2].includes(body.quantity) || body.privacy !== "on" ||
        !["normal", "motorcycle", "electric"].includes(body.plateType) ||
        !["standard", "electric", "historic"].includes(body.plateVariant) ||
        (body.plateType === "electric" && body.plateVariant !== "electric") ||
        ["season", "carbon", "environmentSticker"].some(key => typeof body[key] !== "boolean") ||
        (body.season && (!/^(0[1-9]|1[0-2])$/.test(body.seasonStart) || !/^(0[1-9]|1[0-2])$/.test(body.seasonEnd) || Number(body.seasonEnd) <= Number(body.seasonStart))) ||
        (body.notes != null && (typeof body.notes !== "string" || body.notes.length > 1000))) {
      return res.status(400).json({ ok: false, error: "Bitte prüfe deine Bestellangaben." });
    }
    const basePriceCents = body.quantity === 1 ? prices.single : prices.pair;
    const extrasPriceCents = (body.carbon ? prices.carbon : 0) + (body.environmentSticker ? prices.environmentSticker : 0);
    const deliveryPriceCents = prices[body.delivery];
    const totalPriceCents = basePriceCents + extrasPriceCents + deliveryPriceCents;
    if (body.basePriceCents !== basePriceCents || body.extrasPriceCents !== extrasPriceCents ||
        body.deliveryPriceCents !== deliveryPriceCents || body.totalPriceCents !== totalPriceCents) {
      return res.status(400).json({ ok: false, error: "Der Preis hat sich geändert. Bitte lade die Seite neu und prüfe deine Auswahl." });
    }
    const money = cents => (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
    topic = "Kennzeichen-Bestellanfrage";
    message = [
      `Kennzeichen: ${body.city} ${body.letters} ${body.digits}${suffix}`,
      `Kennzeichentyp: ${{ normal: "Normales Kennzeichen", motorcycle: "Motorrad-Kennzeichen", electric: "E-Kennzeichen" }[body.plateType]}`,
      `Ausführung: ${{ standard: "Standard", electric: "E-Kennzeichen", historic: "H-Kennzeichen" }[body.plateVariant]}`,
      `Saisonkennzeichen: ${body.season ? `${body.seasonStart}–${body.seasonEnd}` : "Nein"}`,
      `Menge: ${body.quantity} ${body.quantity === 1 ? "Schild" : "Schilder (Satz)"}`,
      `Grundpreis: ${money(basePriceCents)}`,
      `Carbon-Optik: ${body.carbon ? money(prices.carbon) : "Nein"}`,
      `Grüne Umweltplakette: ${body.environmentSticker ? money(prices.environmentSticker) : "Nein"}`,
      `Lieferung: ${body.delivery === "shipping" ? "DHL Expressversand" : "Express-Lieferung innerhalb Hamburgs"}: ${money(deliveryPriceCents)}`,
      `Gesamtpreis: ${money(totalPriceCents)}`,
      `Liefer- und Rechnungsadresse: ${name}, ${body.street}, ${body.postcode} ${body.town}, Deutschland`,
      `Hinweise / abweichende Rechnungsadresse: ${body.notes || "Keine"}`,
      "Unverbindliche Bestellanfrage. Rechnung per E-Mail senden. Prägung Montag bis Freitag; Vorbestellung Samstag und Sonntag möglich.",
      "Datenschutz: zugestimmt",
    ].join("\n");
  }

  if (!name || !phone || !email || !topic) {
    return res.status(400).json({ ok: false, error: "Pflichtfelder fehlen." });
  }

  const smtpServer = process.env.smtp_server;
  const smtpUser = process.env.smtp_user;
  const smtpPassword = process.env.smtp_passwort;
  const recipients = getRecipients();

  if (!smtpServer || !smtpUser || !smtpPassword || recipients.length === 0) {
    console.error("SMTP-Konfiguration unvollständig.");
    return res.status(500).json({ ok: false, error: "SMTP ist nicht konfiguriert." });
  }

  const transporter = nodemailer.createTransport({
    host: smtpServer,
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPassword },
  });

  const logoPath = path.join(__dirname, "..", "assets", "img", "email-logo.png");

  try {
    await transporter.sendMail({
      from: `"Moin Flinka Website" <${smtpUser}>`,
      to: recipients,
      replyTo: email,
      subject: body.orderType === "plate" ? "Kennzeichen-Bestellanfrage - Moin Flinka" : "Lead - Moin-Flinka",
      text: [
        `Name: ${name}`,
        `Telefon: ${phone}`,
        `E-Mail: ${email}`,
        `Thema: ${topic}`,
        "",
        "Nachricht:",
        message || "-",
      ].join("\n"),
      html: buildLeadHtml({ name, phone, email, topic, message }),
      attachments: [
        {
          filename: "moin-flinka-logo.png",
          path: logoPath,
          cid: "moinflinkalogo",
        },
      ],
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("SMTP-Versand fehlgeschlagen", error);
    return res.status(502).json({ ok: false, error: "Versand fehlgeschlagen." });
  }
};
