const prices = require("../../plate-prices.json");

const PLATE_TYPE_LABELS = {
  normal: "Normales Kennzeichen",
  motorcycle: "Motorrad-Kennzeichen",
  electric: "E-Kennzeichen",
  historic: "Oldtimer",
};

const PLATE_VARIANT_LABELS = {
  standard: "Standard",
  electric: "E-Kennzeichen",
  historic: "H-Kennzeichen",
};

function money(cents) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function getSuffix(body) {
  return { electric: "E", historic: "H" }[body.plateVariant] || "";
}

function validatePlateOrder(body) {
  const suffix = getSuffix(body);
  const required = ["name", "phone", "email", "city", "letters", "digits", "street", "postcode", "town"];
  const invalid =
    required.some((key) => typeof body[key] !== "string" || !body[key].trim() || body[key].length > 200) ||
    !/^[A-ZÄÖÜ]{1,3}$/.test(body.city) ||
    !/^[A-Z]{1,2}$/.test(body.letters) ||
    !/^[1-9][0-9]{0,3}$/.test(body.digits) ||
    (body.city + body.letters + body.digits + suffix).length > 8 ||
    !/^[0-9]{5}$/.test(body.postcode) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ||
    !["shipping", "local"].includes(body.delivery) ||
    body.quantity !== (body.plateType === "motorcycle" ? 1 : 2) ||
    body.privacy !== "on" ||
    !["normal", "motorcycle", "electric", "historic"].includes(body.plateType) ||
    !["standard", "electric", "historic"].includes(body.plateVariant) ||
    (body.plateType === "electric" && body.plateVariant !== "electric") ||
    (body.plateType === "historic" && body.plateVariant !== "historic") ||
    ["season", "carbon", "environmentSticker"].some((key) => typeof body[key] !== "boolean") ||
    (body.season &&
      (!/^(0[1-9]|1[0-2])$/.test(body.seasonStart) ||
        !/^(0[1-9]|1[0-2])$/.test(body.seasonEnd) ||
        Number(body.seasonEnd) <= Number(body.seasonStart))) ||
    (body.notes != null && (typeof body.notes !== "string" || body.notes.length > 1000));

  return invalid ? { ok: false, error: "Bitte prüfe deine Bestellangaben." } : { ok: true };
}

function computePricing(body) {
  const basePriceCents = body.quantity === 1 ? prices.single : prices.pair;
  const extrasPriceCents = (body.carbon ? prices.carbon : 0) + (body.environmentSticker ? prices.environmentSticker : 0);
  const deliveryPriceCents = prices[body.delivery];
  return {
    basePriceCents,
    extrasPriceCents,
    deliveryPriceCents,
    totalPriceCents: basePriceCents + extrasPriceCents + deliveryPriceCents,
  };
}

function pricesMatch(body, pricing) {
  return (
    body.basePriceCents === pricing.basePriceCents &&
    body.extrasPriceCents === pricing.extrasPriceCents &&
    body.deliveryPriceCents === pricing.deliveryPriceCents &&
    body.totalPriceCents === pricing.totalPriceCents
  );
}

function buildOrderSummaryLines(body, pricing) {
  const suffix = getSuffix(body);
  return [
    `Kennzeichen: ${body.city} ${body.letters} ${body.digits}${suffix}`,
    `Kennzeichentyp: ${PLATE_TYPE_LABELS[body.plateType]}`,
    `Ausführung: ${PLATE_VARIANT_LABELS[body.plateVariant]}`,
    `Saisonkennzeichen: ${body.season ? `${body.seasonStart}–${body.seasonEnd}` : "Nein"}`,
    `Menge: ${body.quantity} ${body.quantity === 1 ? "Schild" : "Schilder (Satz)"}`,
    `Grundpreis: ${money(pricing.basePriceCents)}`,
    `Carbon-Optik: ${body.carbon ? money(prices.carbon) : "Nein"}`,
    `Grüne Umweltplakette: ${body.environmentSticker ? money(prices.environmentSticker) : "Nein"}`,
    `Lieferung: ${body.delivery === "shipping" ? "DHL Express am nächsten Tag" : "Hamburg-Express mit eigenen Kurierfahrern; Bestellung vor 12:00 Uhr, Lieferung am selben Nachmittag"}: ${money(pricing.deliveryPriceCents)}`,
    `Gesamtpreis: ${money(pricing.totalPriceCents)}`,
    `Liefer- und Rechnungsadresse: ${body.name}, ${body.street}, ${body.postcode} ${body.town}, Deutschland`,
    `Hinweise / abweichende Rechnungsadresse: ${body.notes || "Keine"}`,
  ];
}

module.exports = {
  prices,
  money,
  getSuffix,
  validatePlateOrder,
  computePricing,
  pricesMatch,
  buildOrderSummaryLines,
  PLATE_TYPE_LABELS,
  PLATE_VARIANT_LABELS,
};
