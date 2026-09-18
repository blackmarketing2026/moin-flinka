const stripe = require("./_lib/stripe-client");
const { sendMail, buildPaymentConfirmedHtml, buildCustomerThankYouHtml, buildCustomerInvoiceHtml } = require("./_lib/mailer");
const {
  isCompletedPayment,
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

const PLATE_PRODUCTION_RECIPIENTS = ["info@kfzzulassung.eu", "moinflinka@function-concept.de"];

async function notifyPlateProduction(session, order, pricing) {
  const testPrefix = order.testMode ? "[TEST] " : "";
  const message = [
    ...(order.testMode ? ["⚠️ TESTBESTELLUNG – Gesamtpreis manuell auf 0,50 € gesetzt."] : []),
    ...buildOrderSummaryLines(order, pricing),
    `Stripe-Zahlung eingegangen (Session ${session.id}).`,
  ].join("\n");

  await sendMail({
    to: PLATE_PRODUCTION_RECIPIENTS,
    subject: `${testPrefix}Neue Bestellung eingegangen - Kennzeichen Moin Flinka`,
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

async function notifyOrderReceived(session, order, pricing) {
  const testPrefix = order.testMode ? "[TEST] " : "";
  const summaryLines = order.testMode
    ? ["⚠️ TESTBESTELLUNG – Gesamtpreis manuell auf 0,50 € gesetzt.", ...buildOrderSummaryLines(order, pricing)]
    : buildOrderSummaryLines(order, pricing);

  const productLabel = PLATE_TYPE_LABELS[order.plateType] || order.plateType;
  const plateLabel = `${order.city} ${order.letters} ${order.digits}${getSuffix(order)}`;

  await sendMail({
    to: order.email,
    subject: `${testPrefix}Vielen Dank für deine Bestellung - Moin Flinka`,
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
}

async function notifyInvoiceReady(invoice) {
  if (!invoice.metadata || !invoice.metadata.plateType) return;
  if (!invoice.invoice_pdf) return;

  const order = metadataToOrder(invoice.metadata);
  const testPrefix = order.testMode ? "[TEST] " : "";
  const plateLabel = `${order.city} ${order.letters} ${order.digits}${getSuffix(order)}`;

  await sendMail({
    to: order.email,
    subject: `${testPrefix}Deine Rechnung zur Bestellung - Moin Flinka`,
    text: [
      `Moin ${order.name}, anbei deine Rechnung zu deiner Bestellung für dein Kennzeichen ${plateLabel}.`,
      `Du kannst sie hier herunterladen: ${invoice.invoice_pdf}`,
      "Du findest sie außerdem als PDF im Anhang dieser E-Mail.",
    ].join("\n"),
    html: buildCustomerInvoiceHtml({ name: order.name, plateLabel, invoicePdfUrl: invoice.invoice_pdf }),
    attachments: [{ filename: "Rechnung-Moin-Flinka.pdf", path: invoice.invoice_pdf }],
    account: "order",
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
    if (isCompletedPayment(session)) {
      const order = metadataToOrder(session.metadata || {});
      const pricing = { ...metadataToPricing(session.metadata || {}), totalPriceCents: session.amount_total };

      try {
        await notifyBusiness(session, order, pricing);
      } catch (error) {
        console.error("Interne Benachrichtigung nach Zahlung fehlgeschlagen", error);
      }

      try {
        await notifyPlateProduction(session, order, pricing);
      } catch (error) {
        console.error("Kennzeichen-Produktionsmail fehlgeschlagen", error);
      }

      try {
        await notifyOrderReceived(session, order, pricing);
      } catch (error) {
        console.error("Kunden-Bestätigungsmail nach Zahlung fehlgeschlagen", error);
      }
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    try {
      await notifyInvoiceReady(invoice);
    } catch (error) {
      console.error("Rechnungs-Mail an Kunden fehlgeschlagen", error);
    }
  }

  return res.status(200).json({ received: true });
};
