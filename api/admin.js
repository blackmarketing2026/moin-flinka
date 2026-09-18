const stripe = require('./_lib/stripe-client');
const { authorized, login } = require('./_lib/admin-auth');
const { getSuffix, isCompletedPayment } = require('./_lib/plate-order');
const statuses = ['Eingegangen', 'Gedruckt', 'Zum Ausliefern bereit'];
const orderView = s => ({ id: s.id, created: s.created, amount: s.amount_total, currency: s.currency, status: s.metadata.fulfillmentStatus || statuses[0], plate: `${s.metadata.city} ${s.metadata.letters} ${s.metadata.digits}${getSuffix(s.metadata)}`, customer: { name: s.metadata.name, email: s.metadata.email, phone: s.metadata.phone, street: s.metadata.street, postcode: s.metadata.postcode, town: s.metadata.town }, details: s.metadata, paymentStatus: s.payment_status });
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ ok: false }); }
  try {
    let body = {};
    if (req.method === 'POST') {
      const origin = req.headers.origin;
      const expected = new URL(process.env.SITE_URL || 'https://www.moin-flinka.de').origin;
      if (!origin || new URL(origin).origin !== expected) return res.status(403).json({ ok: false, error: 'Anfrage nicht erlaubt.' });
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      if (body.action === 'login') return login(req, res, body.password, body.username);
    }
    if (!authorized(req)) return res.status(401).json({ ok: false, error: 'Bitte anmelden.' });
    if (req.method === 'GET') {
      if (req.query.resource === 'payment-config') {
        const account = await stripe.accounts.retrieve();
        return res.status(200).json({ ok: true, accountId: account.id, liveMode: process.env.STRIPE_SECRET_KEY.startsWith('sk_live_'), embeddedPaymentConfigured: Boolean(process.env.STRIPE_PUBLISHABLE_KEY) });
      }
      if (req.query.resource === 'discounts') {
        const result = await stripe.promotionCodes.list({ limit: 100, ...(req.query.cursor ? { starting_after: req.query.cursor } : {}) });
        const codes = await Promise.all(result.data.map(async p => {
          const ref = p.promotion?.coupon || p.coupon;
          const coupon = typeof ref === 'string' ? await stripe.coupons.retrieve(ref) : ref;
          return { id: p.id, code: p.code, active: p.active, percentOff: coupon?.percent_off, redeemed: p.times_redeemed, maxRedemptions: p.max_redemptions, expiresAt: p.expires_at };
        }));
        return res.status(200).json({ ok: true, codes, nextCursor: result.has_more ? result.data.at(-1).id : null });
      }
      if (req.query.id) {
        const session = await stripe.checkout.sessions.retrieve(req.query.id);
        if (!session.metadata.plateType || session.metadata.adminDeleted === 'true' || !isCompletedPayment(session)) return res.status(404).json({ ok: false, error: 'Bestellung nicht gefunden.' });
        return res.status(200).json({ ok: true, order: orderView(session) });
      }
      const result = await stripe.checkout.sessions.list({ limit: 100, ...(req.query.cursor ? { starting_after: req.query.cursor } : {}) });
      return res.status(200).json({ ok: true, orders: result.data.filter(s => isCompletedPayment(s) && s.metadata.plateType && s.metadata.adminDeleted !== 'true').map(orderView), nextCursor: result.has_more ? result.data.at(-1).id : null });
    }
    if (body.action === 'logout') {
      res.setHeader('Set-Cookie', 'mf_admin=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0');
      return res.status(200).json({ ok: true });
    }
    if (body.action === 'delete-orders') {
      if (!Array.isArray(body.ids) || body.ids.length < 1 || body.ids.length > 100 || body.ids.some(id => typeof id !== 'string' || !/^cs_[A-Za-z0-9_]{1,250}$/.test(id))) return res.status(400).json({ ok: false, error: 'Bitte 1 bis 100 Bestellungen ausw\u00e4hlen.' });
      const ids = [...new Set(body.ids)];
      // Validate the whole selection before making any changes.
      for (const id of ids) {
        const session = await stripe.checkout.sessions.retrieve(id);
        if (!session.metadata.plateType || !isCompletedPayment(session)) return res.status(404).json({ ok: false, error: 'Bestellung nicht gefunden.' });
      }
      const deletedIds = [], failedIds = [];
      for (const id of ids) {
        try {
          await stripe.checkout.sessions.update(id, { metadata: { adminDeleted: 'true', adminDeletedAt: String(Math.floor(Date.now() / 1000)) } });
          deletedIds.push(id);
        } catch { failedIds.push(id); }
      }
      return res.status(200).json({ ok: true, deletedIds, failedIds });
    }
    if (body.action === 'status') {
      if (!statuses.includes(body.status) || typeof body.id !== 'string') return res.status(400).json({ ok: false, error: 'Ungültiger Status.' });
      const session = await stripe.checkout.sessions.retrieve(body.id);
      if (!session.metadata.plateType || session.metadata.adminDeleted === 'true' || !isCompletedPayment(session)) return res.status(404).json({ ok: false, error: 'Bestellung nicht gefunden.' });
      await stripe.checkout.sessions.update(body.id, { metadata: { fulfillmentStatus: body.status } });
      return res.status(200).json({ ok: true });
    }
    if (body.action === 'create-discount') {
      const code = String(body.code || '').trim().toUpperCase();
      const percent = Number(body.percent);
      const max = body.max ? Number(body.max) : null;
      const expiry = body.expires ? Math.floor(new Date(body.expires).getTime() / 1000) : null;
      if (!/^[A-Z0-9_-]{3,40}$/.test(code) || !Number.isFinite(percent) || percent <= 0 || percent > 100 || (max !== null && (!Number.isInteger(max) || max < 1)) || (expiry !== null && (!Number.isFinite(expiry) || expiry <= Date.now() / 1000))) return res.status(400).json({ ok: false, error: 'Bitte Rabattangaben prüfen.' });
      const duplicate = await stripe.promotionCodes.list({ code, active: true, limit: 1 });
      if (duplicate.data.length) return res.status(409).json({ ok: false, error: 'Dieser Code ist bereits aktiv.' });
      const coupon = await stripe.coupons.create({ percent_off: percent, duration: 'once', name: code });
      await stripe.promotionCodes.create({ promotion: { type: 'coupon', coupon: coupon.id }, code, ...(max ? { max_redemptions: max } : {}), ...(expiry ? { expires_at: expiry } : {}) });
      return res.status(200).json({ ok: true });
    }
    if (body.action === 'toggle-discount' && typeof body.id === 'string' && typeof body.active === 'boolean') {
      await stripe.promotionCodes.update(body.id, { active: body.active });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ ok: false, error: 'Ungültige Anfrage.' });
  } catch (error) {
    console.error('Admin-Anfrage fehlgeschlagen', error.type || error.name);
    return res.status(502).json({ ok: false, error: 'Die Anfrage konnte nicht abgeschlossen werden. Bitte erneut versuchen.' });
  }
};
