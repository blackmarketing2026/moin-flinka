const stripe = require("./_lib/stripe-client");
const { prices, getSuffix, validatePlateOrder, computePricing, pricesMatch } = require("./_lib/plate-order");

const TEST_PRICING = { basePriceCents: 50, extrasPriceCents: 0, deliveryPriceCents: 0, totalPriceCents: 50 };

const SHORT_DELIVERY_LABELS = {
  standard: "Klassischer DHL-Versand",
  express: "DHL-Express (nächster Tag)",
  courier: "Eigener Kurier (noch am selben Tag)",
};

let cachedVatTaxRateId = null;
async function getGermanVatTaxRateId() {
  if (cachedVatTaxRateId) return cachedVatTaxRateId;
  const existing = await stripe.taxRates.list({ active: true, limit: 100 });
  const found = existing.data.find((rate) => rate.inclusive === true && rate.percentage === 19 && rate.country === "DE");
  if (found) {
    cachedVatTaxRateId = found.id;
    return cachedVatTaxRateId;
  }
  const created = await stripe.taxRates.create({
    display_name: "MwSt.",
    percentage: 19,
    inclusive: true,
    country: "DE",
    description: "Gesetzliche Mehrwertsteuer Deutschland (19%, in den Preisen enthalten)",
  });
  cachedVatTaxRateId = created.id;
  return cachedVatTaxRateId;
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

  if (!body || typeof body !== "object" || Array.isArray(body) || body.orderType !== "plate") {
    return res.status(400).json({ ok: false, error: "Ungültige Anfrage." });
  }

  const validation = validatePlateOrder(body);
  if (!validation.ok) {
    return res.status(400).json({ ok: false, error: validation.error });
  }

  const testMode = body.testMode === true;
  const pricing = testMode ? TEST_PRICING : computePricing(body);
  if (!pricesMatch(body, pricing)) {
    return res.status(400).json({ ok: false, error: "Der Preis hat sich geändert. Bitte lade die Seite neu und prüfe deine Auswahl." });
  }

  const suffix = getSuffix(body);
  const quantityLabel = body.quantity === 1 ? "1 Schild" : "2 Schilder (Satz)";
  const seasonLabel = body.season ? ` · Saison ${body.seasonStart}–${body.seasonEnd}` : "";
  const deliveryLabel = SHORT_DELIVERY_LABELS[body.delivery];

  const origin = req.headers.origin || "https://www.moin-flinka.de";
  const refererPath = (() => {
    try {
      return new URL(req.headers.referer).pathname;
    } catch {
      return null;
    }
  })();
  const returnPath = refererPath && refererPath.startsWith("/kennzeichen") ? refererPath : "/kennzeichen-deutschland";
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
    testMode: String(testMode),
    basePriceCents: String(pricing.basePriceCents),
    extrasPriceCents: String(pricing.extrasPriceCents),
    deliveryPriceCents: String(pricing.deliveryPriceCents),
    totalPriceCents: String(pricing.totalPriceCents),
  };

  try {
    const vatTaxRateId = await getGermanVatTaxRateId();
    const lineItem = (name, unit_amount) => ({
      price_data: { currency: "eur", product_data: { name }, unit_amount },
      quantity: 1,
      tax_rates: [vatTaxRateId],
    });

    const line_items = testMode
      ? [lineItem(`TEST-Bestellung ${body.city} ${body.letters} ${body.digits}${suffix}`, pricing.totalPriceCents)]
      : [lineItem(`Kennzeichen ${body.city} ${body.letters} ${body.digits}${suffix} · ${quantityLabel}${seasonLabel}`, pricing.basePriceCents)];
    if (!testMode) {
      if (body.carbon) line_items.push(lineItem("Carbon-Optik", prices.carbon));
      if (body.environmentSticker) line_items.push(lineItem("Grüne Umweltplakette", prices.environmentSticker));
      line_items.push(lineItem(deliveryLabel, pricing.deliveryPriceCents));
    }

    const customer = await stripe.customers.create({
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: {
        line1: body.street,
        postal_code: body.postcode,
        city: body.town,
        country: "DE",
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "de",
      line_items,
      customer: customer.id,
      invoice_creation: { enabled: true, invoice_data: { metadata } },
      success_url: `${origin}/dankesseite-stripe?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${returnPath}?checkout=cancelled#formular`,
      allow_promotion_codes: true,
      metadata,
      payment_intent_data: { metadata },
    });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Session fehlgeschlagen", error);
    return res.status(502).json({ ok: false, error: "Zahlung konnte nicht gestartet werden." });
  }
};
