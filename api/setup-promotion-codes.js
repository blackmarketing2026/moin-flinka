const stripe = require("./_lib/stripe-client");

const DISCOUNT_CODES = [
  { code: "MoinRX10", percentOff: 10 },
  { code: "MoinQL15", percentOff: 15 },
  { code: "MoinZV20", percentOff: 20 },
  { code: "MoinKW25", percentOff: 25 },
];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!process.env.TEST_EMAIL_TOKEN || req.query.token !== process.env.TEST_EMAIL_TOKEN) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  const results = [];
  try {
    for (const { code, percentOff } of DISCOUNT_CODES) {
      const existing = await stripe.promotionCodes.list({ code, limit: 1 });
      if (existing.data.length > 0) {
        const found = existing.data[0];
        results.push({ code, status: "already exists", id: found.id, active: found.active });
        continue;
      }

      const coupon = await stripe.coupons.create({
        percent_off: percentOff,
        duration: "once",
        name: `Moin Flinka ${percentOff}% Rabatt`,
      });
      const promotionCode = await stripe.promotionCodes.create({
        promotion: { type: "coupon", coupon: coupon.id },
        code,
        active: true,
      });
      results.push({ code, status: "created", id: promotionCode.id, couponId: coupon.id, percentOff });
    }

    return res.status(200).json({ ok: true, results });
  } catch (error) {
    console.error("Rabattcode-Setup fehlgeschlagen", error);
    return res.status(500).json({ ok: false, error: String(error && error.message), results });
  }
};
