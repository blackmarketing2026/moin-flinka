const stripe = require("./_lib/stripe-client");
const { prices, getSuffix, validatePlateOrder, computePricing, pricesMatch } = require("./_lib/plate-order");

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

  if (!body || typeof body !== "object" || Array.isArray(body) || body.orderType !== "plate") {
    return res.status(400).json({ ok: false, error: "Ungültige Anfrage." });
  }

  const validation = validatePlateOrder(body);
  if (!validation.ok) {
    return res.status(400).json({ ok: false, error: validation.error });
  }

  const pricing = computePricing(body);
  if (!pricesMatch(body, pricing)) {
    return res.status(400).json({ ok: false, error: "Der Preis hat sich geändert. Bitte lade die Seite neu und prüfe deine Auswahl." });
  }

  const suffix = getSuffix(body);
  const quantityLabel = body.quantity === 1 ? "1 Schild" : "2 Schilder (Satz)";
  const deliveryLabel =
    body.delivery === "shipping" ? "DHL Express (nächster Tag)" : "Hamburg-Express (eigene Kurierfahrer)";

  const lineItem = (name, unit_amount) => ({
    price_data: { currency: "eur", product_data: { name }, unit_amount },
    quantity: 1,
  });

  const line_items = [
    lineItem(`Kennzeichen ${body.city} ${body.letters} ${body.digits}${suffix} · ${quantityLabel}`, pricing.basePriceCents),
  ];
  if (body.carbon) line_items.push(lineItem("Carbon-Optik", prices.carbon));
  if (body.environmentSticker) line_items.push(lineItem("Grüne Umweltplakette", prices.environmentSticker));
  line_items.push(lineItem(deliveryLabel, pricing.deliveryPriceCents));

  const origin = req.headers.origin || "https://www.moin-flinka.de";
  const metadata = {
    plateType: body.plateType,
    plateVariant: body.plateVariant,
    city: body.city,
    letters: body.letters,
    digits: body.digits,
    season: String(body.season),
    seasonStart: body.seasonStart || "",
    seasonEnd: body.seasonEnd || "",
    quantity: String(body.quantity),
    carbon: String(body.carbon),
    environmentSticker: String(body.environmentSticker),
    delivery: body.delivery,
    name: body.name,
    phone: body.phone,
    email: body.email,
    street: body.street,
    postcode: body.postcode,
    town: body.town,
    notes: (body.notes || "").slice(0, 500),
    basePriceCents: String(pricing.basePriceCents),
    extrasPriceCents: String(pricing.extrasPriceCents),
    deliveryPriceCents: String(pricing.deliveryPriceCents),
    totalPriceCents: String(pricing.totalPriceCents),
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "de",
      payment_method_types: ["card"],
      line_items,
      customer_email: body.email,
      customer_creation: "always",
      invoice_creation: { enabled: true },
      success_url: `${origin}/dankesseite-stripe?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/kennzeichen-stripe?checkout=cancelled#formular`,
      metadata,
      payment_intent_data: { metadata },
    });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Session fehlgeschlagen", error);
    return res.status(502).json({ ok: false, error: "Zahlung konnte nicht gestartet werden." });
  }
};
