const stripe = require("./_lib/stripe-client");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const code = typeof req.query.code === "string" ? req.query.code.trim() : "";
  if (!code) {
    return res.status(400).json({ ok: false, error: "Kein Rabattcode angegeben." });
  }

  try {
    const list = await stripe.promotionCodes.list({ code, active: true, limit: 1 });
    const promotionCode = list.data[0];
    if (!promotionCode) {
      return res.status(200).json({ ok: false, error: "Rabattcode ungültig oder abgelaufen." });
    }

    const couponId = promotionCode.promotion && promotionCode.promotion.coupon;
    const coupon = couponId ? await stripe.coupons.retrieve(couponId) : null;
    if (!coupon || !coupon.valid || coupon.percent_off == null) {
      return res.status(200).json({ ok: false, error: "Rabattcode ungültig oder abgelaufen." });
    }

    return res.status(200).json({ ok: true, percentOff: coupon.percent_off });
  } catch (error) {
    console.error("Rabattcode-Prüfung fehlgeschlagen", error);
    return res.status(502).json({ ok: false, error: "Rabattcode konnte nicht geprüft werden." });
  }
};
