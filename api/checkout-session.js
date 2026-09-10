const stripe = require("./_lib/stripe-client");
const { getSuffix, money } = require("./_lib/plate-order");

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

    const metadata = session.metadata || {};
    const suffix = getSuffix(metadata);
    const plate = `${metadata.city || ""} ${metadata.letters || ""} ${metadata.digits || ""}${suffix}`.trim();
    const totalPriceCents = Number(metadata.totalPriceCents) || session.amount_total || 0;
    const invoice = session.invoice && typeof session.invoice === "object" ? session.invoice : null;

    return res.status(200).json({
      ok: true,
      plate,
      totalPriceFormatted: money(totalPriceCents),
      invoicePdfUrl: invoice?.invoice_pdf || null,
      testMode: metadata.testMode === "true",
    });
  } catch (error) {
    console.error("Checkout-Session konnte nicht geladen werden", error);
    return res.status(502).json({ ok: false, error: "Bestellung konnte nicht geladen werden." });
  }
};
