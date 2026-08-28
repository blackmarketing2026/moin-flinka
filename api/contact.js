const nodemailer = require("nodemailer");

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

  const { name, phone, email, topic, message } = body;

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

  try {
    await transporter.sendMail({
      from: `"Moin Flinka Website" <${smtpUser}>`,
      to: recipients,
      replyTo: email,
      subject: `Neue Kontaktanfrage: ${topic}`,
      text: [
        `Name: ${name}`,
        `Telefon: ${phone}`,
        `E-Mail: ${email}`,
        `Thema: ${topic}`,
        "",
        "Nachricht:",
        message || "-",
      ].join("\n"),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("SMTP-Versand fehlgeschlagen", error);
    return res.status(502).json({ ok: false, error: "Versand fehlgeschlagen." });
  }
};
