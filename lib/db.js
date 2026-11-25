// Accès à la base Neon. La chaîne de connexion vient UNIQUEMENT de la variable d'environnement
// DATABASE_URL (réglée chez Vercel) : elle n'est jamais dans le code ni dans l'APK.
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

let sqlClient = null;
function sql() {
  if (!sqlClient) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquante');
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
}

// ---- Mots de passe : scrypt avec sel aléatoire (format « sel:empreinte » en hexadécimal)
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return salt.toString('hex') + ':' + hash.toString('hex');
}
function checkPassword(password, stored) {
  const [saltHex, hashHex] = String(stored).split(':');
  if (!saltHex || !hashHex) return false;
  const hash = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
  const expected = Buffer.from(hashHex, 'hex');
  return expected.length === hash.length && crypto.timingSafeEqual(expected, hash);
}

// ---- Sessions : jeton aléatoire valable 60 jours
async function createSession(compteId) {
  const jeton = crypto.randomBytes(32).toString('hex');
  await sql()`insert into sessions (jeton, compte_id, expire_le) values (${jeton}, ${compteId}, now() + interval '60 days')`;
  return jeton;
}
async function accountFromRequest(req) {
  const auth = req.headers['authorization'] || '';
  const jeton = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!/^[a-f0-9]{64}$/.test(jeton)) return null;
  const rows = await sql()`select compte_id from sessions where jeton = ${jeton} and expire_le > now()`;
  return rows.length ? rows[0].compte_id : null;
}

// ---- Réponses JSON (+ CORS pour le jeu et le site)
function send(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.status(status).send(JSON.stringify(body));
}
function preflight(req, res) {
  if (req.method === 'OPTIONS') { send(res, 204, {}); return true; }
  return false;
}
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}

const emailOk = (e) => typeof e === 'string' && e.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

module.exports = { sql, hashPassword, checkPassword, createSession, accountFromRequest, send, preflight, readBody, emailOk };
