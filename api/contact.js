const { buildLeadHtml, sendMail } = require("./_lib/mailer");
const { validatePlateOrder, computePricing, pricesMatch, buildOrderSummaryLines } = require("./_lib/plate-order");

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
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
    const validation = validatePlateOrder(body);
    if (!validation.ok) {
      return res.status(400).json({ ok: false, error: validation.error });
    }
    const pricing = computePricing(body);
    if (!pricesMatch(body, pricing)) {
      return res.status(400).json({ ok: false, error: "Der Preis hat sich geändert. Bitte lade die Seite neu und prüfe deine Auswahl." });
    }
    topic = "Kennzeichen-Bestellanfrage";
    message = [
      ...buildOrderSummaryLines(body, pricing),
      "Unverbindliche Bestellanfrage. Rechnung per E-Mail senden. Prägung Montag bis Freitag; Vorbestellung Samstag und Sonntag möglich.",
      "Datenschutz: zugestimmt",
    ].join("\n");
  }

  if (!name || !phone || !email || !topic) {
    return res.status(400).json({ ok: false, error: "Pflichtfelder fehlen." });
  }

  try {
    await sendMail({
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
      replyTo: email,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    if (error.configError) {
      console.error("SMTP-Konfiguration unvollständig.");
      return res.status(500).json({ ok: false, error: "SMTP ist nicht konfiguriert." });
    }
    console.error("SMTP-Versand fehlgeschlagen", error);
    return res.status(502).json({ ok: false, error: "Versand fehlgeschlagen." });
  }
};
