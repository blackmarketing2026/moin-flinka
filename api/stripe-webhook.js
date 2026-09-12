const stripe = require("./_lib/stripe-client");
const { sendMail, buildPaymentConfirmedHtml, buildCustomerThankYouHtml } = require("./_lib/mailer");
const {
  buildOrderSummaryLines,
  getSuffix,
  metadataToOrder,
  metadataToPricing,
  PLATE_TYPE_LABELS,
} = require("./_lib/plate-order");

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function notifyBusiness(session, order, pricing) {
  const testPrefix = order.testMode ? "[TEST] " : "";
  const message = [
    ...(order.testMode ? ["⚠️ TESTBESTELLUNG – Gesamtpreis manuell auf 0,50 € gesetzt."] : []),
    ...buildOrderSummaryLines(order, pricing),
    `Stripe-Zahlung eingegangen (Session ${session.id}).`,
  ].join("\n");

  await sendMail({
    subject: `${testPrefix}Zahlung eingegangen - Kennzeichen-Bestellung Moin Flinka`,
    text: [`Name: ${order.name}`, `Telefon: ${order.phone}`, `E-Mail: ${order.email}`, "", message].join("\n"),
    html: buildPaymentConfirmedHtml({
      name: order.name,
      phone: order.phone,
      email: order.email,
      topic: "Kennzeichen-Bestellung",
      message,
    }),
    replyTo: order.email,
  });
}

async function notifyCustomer(session, order, pricing) {
  const testPrefix = order.testMode ? "[TEST] " : "";
  const summaryLines = order.testMode
    ? ["⚠️ TESTBESTELLUNG – Gesamtpreis manuell auf 0,50 € gesetzt.", ...buildOrderSummaryLines(order, pricing)]
    : buildOrderSummaryLines(order, pricing);

  let invoicePdfUrl = null;
  if (session.invoice) {
    try {
      const invoice = await stripe.invoices.retrieve(session.invoice);
      invoicePdfUrl = invoice.invoice_pdf || null;
    } catch (error) {
      console.error("Rechnungs-PDF konnte nicht geladen werden", error);
    }
  }

  const productLabel = PLATE_TYPE_LABELS[order.plateType] || order.plateType;
  const plateLabel = `${order.city} ${order.letters} ${order.digits}${getSuffix(order)}`;

  await sendMail({
    to: order.email,
    subject: `${testPrefix}Vielen Dank für deine Bestellung - Moin Flinka`,
    text: [
      `Moin ${order.name}, vielen Dank für deine Bestellung!`,
      "Deine Bestellung ist bei uns eingegangen und deine Zahlung wurde erfolgreich durchgeführt.",
      "",
      `Produkt: ${productLabel}`,
      `Kennzeichen: ${plateLabel}`,
      "",
      invoicePdfUrl
        ? `Deine Rechnung kannst du hier herunterladen: ${invoicePdfUrl}\nDu findest sie außerdem als PDF im Anhang dieser E-Mail.`
        : "Deine Rechnung folgt in Kürze separat.",
      "",
      ...summaryLines,
    ].join("\n"),
    html: buildCustomerThankYouHtml({ name: order.name, productLabel, plateLabel, invoicePdfUrl, summaryLines }),
    attachments: invoicePdfUrl ? [{ filename: "Rechnung-Moin-Flinka.pdf", path: invoicePdfUrl }] : [],
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Stripe-Webhook: ungültige Signatur", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  const isCheckoutEvent =
    event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded";

  if (isCheckoutEvent) {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      const order = metadataToOrder(session.metadata || {});
      const pricing = metadataToPricing(session.metadata || {});

      try {
        await notifyBusiness(session, order, pricing);
      } catch (error) {
        console.error("Interne Benachrichtigung nach Zahlung fehlgeschlagen", error);
      }

      try {
        await notifyCustomer(session, order, pricing);
      } catch (error) {
        console.error("Kunden-Bestätigungsmail nach Zahlung fehlgeschlagen", error);
      }
    }
  }

  return res.status(200).json({ received: true });
};
