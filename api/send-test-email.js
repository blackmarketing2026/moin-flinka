const { sendMail, buildCustomerThankYouHtml } = require("./_lib/mailer");
const { buildOrderSummaryLines, getSuffix, PLATE_TYPE_LABELS } = require("./_lib/plate-order");

const TEST_RECIPIENT = "sjesse18@gmail.com";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!process.env.TEST_EMAIL_TOKEN || req.query.token !== process.env.TEST_EMAIL_TOKEN) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  const order = {
    name: "Max Mustermann",
    email: TEST_RECIPIENT,
    city: "HH",
    letters: "MF",
    digits: "123",
    plateType: "normal",
    plateVariant: "standard",
    season: false,
    delivery: "shipping",
    carbon: true,
    environmentSticker: true,
    quantity: 2,
    street: "Musterstraße 1",
    postcode: "20095",
    town: "Hamburg",
    notes: "",
    testMode: false,
  };
  const pricing = {
    basePriceCents: 1999,
    extrasPriceCents: 1998,
    deliveryPriceCents: 2640,
    totalPriceCents: 1999 + 1998 + 2640,
  };

  const summaryLines = buildOrderSummaryLines(order, pricing);
  const productLabel = PLATE_TYPE_LABELS[order.plateType];
  const plateLabel = `${order.city} ${order.letters} ${order.digits}${getSuffix(order)}`;

  try {
    await sendMail({
      to: order.email,
      subject: "[VORSCHAU] Vielen Dank für deine Bestellung - Moin Flinka",
      text: [
        `Moin ${order.name}, vielen Dank für deine Bestellung!`,
        "Deine Bestellung ist bei uns eingegangen und deine Zahlung wurde erfolgreich durchgeführt.",
        "",
        `Produkt: ${productLabel}`,
        `Kennzeichen: ${plateLabel}`,
        "",
        "Dies ist eine Vorschau-E-Mail zum Testen des Layouts.",
        "",
        ...summaryLines,
      ].join("\n"),
      html: buildCustomerThankYouHtml({
        name: order.name,
        productLabel,
        plateLabel,
        invoicePdfUrl: "https://www.moin-flinka.de/kennzeichen-stripe",
        summaryLines,
      }),
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Test-E-Mail fehlgeschlagen", error);
    return res.status(500).json({ ok: false, error: String(error && error.message) });
  }
};
