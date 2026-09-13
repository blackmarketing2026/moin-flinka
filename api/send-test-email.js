const { sendMail, buildCustomerThankYouHtml, buildCustomerInvoiceHtml } = require("./_lib/mailer");
const { buildOrderSummaryLines, getSuffix, PLATE_TYPE_LABELS } = require("./_lib/plate-order");
const { buildReceiptPdf } = require("./_lib/receipt-pdf");

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
    letters: "AB",
    digits: "1234",
    plateType: "normal",
    plateVariant: "standard",
    season: false,
    delivery: "shipping",
    carbon: true,
    environmentSticker: true,
    quantity: 2,
    street: "Musterstraße 12",
    postcode: "20095",
    town: "Hamburg",
    notes: "",
    testMode: false,
  };
  const pricing = {
    basePriceCents: 2990,
    extrasPriceCents: 990,
    deliveryPriceCents: 990,
    totalPriceCents: 2990 + 990 + 990,
  };

  const summaryLines = buildOrderSummaryLines(order, pricing);
  const productLabel = PLATE_TYPE_LABELS[order.plateType];
  const plateLabel = `${order.city} ${order.letters} ${order.digits}${getSuffix(order)}`;
  const fakeSession = { id: "cs_test_sample123456", created: Math.floor(Date.now() / 1000) };

  try {
    await sendMail({
      to: order.email,
      subject: "[VORSCHAU] Vielen Dank für deine Bestellung - Moin Flinka",
      text: [
        `Moin ${order.name}, vielen Dank für deine Bestellung!`,
        "Deine Bestellung ist bei uns eingegangen und deine Zahlung wurde erfolgreich durchgeführt. Deine Bestellung wird umgehend bearbeitet.",
        "",
        `Produkt: ${productLabel}`,
        `Kennzeichen: ${plateLabel}`,
        "",
        "Deine Rechnung senden wir dir automatisch per E-Mail zu, sobald sie vorliegt.",
        "",
        ...summaryLines,
      ].join("\n"),
      html: buildCustomerThankYouHtml({ name: order.name, productLabel, plateLabel, summaryLines }),
      account: "order",
    });

    const pdfBuffer = await buildReceiptPdf({ session: fakeSession, order, pricing });

    await sendMail({
      to: order.email,
      subject: "[VORSCHAU] Deine Rechnung zur Bestellung - Moin Flinka",
      text: [
        `Moin ${order.name}, anbei deine Rechnung zu deiner Bestellung für dein Kennzeichen ${plateLabel}.`,
        "Du findest sie als PDF im Anhang dieser E-Mail.",
      ].join("\n"),
      html: buildCustomerInvoiceHtml({ name: order.name, plateLabel, invoicePdfUrl: "#" }),
      attachments: [{ filename: "Rechnung-Moin-Flinka.pdf", content: pdfBuffer }],
      account: "order",
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Test-E-Mail fehlgeschlagen", error);
    return res.status(500).json({ ok: false, error: String(error && error.message) });
  }
};
