const stripe = require("./_lib/stripe-client");
const { metadataToOrder, metadataToPricing } = require("./_lib/plate-order");
const { buildReceiptPdf } = require("./_lib/receipt-pdf");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const sessionId = req.query.session_id;
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return res.status(400).json({ ok: false, error: "Ungültige Session." });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["invoice"] });
    if (session.payment_status !== "paid") {
      return res.status(404).json({ ok: false, error: "Zahlung nicht gefunden." });
    }

    const invoice = session.invoice && typeof session.invoice === "object" ? session.invoice : null;
    if (invoice?.invoice_pdf) {
      res.writeHead(302, { Location: invoice.invoice_pdf });
      return res.end();
    }

    const order = metadataToOrder(session.metadata || {});
    const pricing = metadataToPricing(session.metadata || {});
    const pdfBuffer = await buildReceiptPdf({ session, order, pricing });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="Bestellbestaetigung-Moin-Flinka.pdf"');
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("Beleg konnte nicht erstellt werden", error);
    return res.status(502).json({ ok: false, error: "Beleg konnte nicht geladen werden." });
  }
};
