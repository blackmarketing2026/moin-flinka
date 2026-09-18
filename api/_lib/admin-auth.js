const { createHmac, timingSafeEqual, createHash, randomBytes } = require('node:crypto');
const attempts = new Map();
const hash = value => createHash('sha256').update(value).digest();
const same = (a, b) => timingSafeEqual(hash(a), hash(b));
const sign = value => createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(value).digest('hex');
function configured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12 && process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length >= 32);
}
function authorized(req) {
  if (!configured()) return false;
  const token = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('mf_admin='))?.slice(9) || '';
  const [expiry, nonce, signature] = token.split('.');
  return /^\d+$/.test(expiry || '') && Number(expiry) > Date.now() && Boolean(nonce && signature) && same(signature, sign(`${expiry}.${nonce}`));
}
function login(req, res, password, username) {
  if (!configured()) return res.status(503).json({ ok: false, error: 'Admin-Zugang muss auf dem Server eingerichtet werden.' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0];
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  const entry = attempts.get(ip) || { count: 0, until: now + 15 * 60 * 1000 };
  if (entry.count >= 5) return res.status(429).json({ ok: false, error: 'Zu viele Versuche. Bitte in 15 Minuten erneut versuchen.' });
  entry.count++;
  attempts.set(ip, entry);
  if (username !== 'admin' || typeof password !== 'string' || !same(password, process.env.ADMIN_PASSWORD)) return res.status(401).json({ ok: false, error: 'Zugangsdaten ungültig.' });
  attempts.delete(ip);
  const value = `${now + 8 * 60 * 60 * 1000}.${randomBytes(24).toString('hex')}`;
  res.setHeader('Set-Cookie', `mf_admin=${value}.${sign(value)}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=28800`);
  return res.status(200).json({ ok: true });
}
module.exports = { authorized, login };
