// POST /api/connexion — vérifie e-mail + mot de passe, renvoie un jeton de session et le profil.
// Corps : { email, motDePasse }
const { sql, checkPassword, createSession, send, preflight, readBody } = require('../lib/db');

module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { erreur: 'Méthode non autorisée' });
  try {
    const b = await readBody(req);
    const email = String(b.email || '').trim().toLowerCase();
    const motDePasse = String(b.motDePasse || '');
    const rows = await sql()`select id, pseudo, mot_de_passe_hash from comptes where email = ${email}`;
    if (!rows.length || !checkPassword(motDePasse, rows[0].mot_de_passe_hash))
      return send(res, 401, { erreur: 'E-mail ou mot de passe incorrect' });
    const id = rows[0].id;
    await sql()`update comptes set derniere_connexion = now() where id = ${id}`;
    const jeton = await createSession(id);
    const p = await sql()`select nom_manager, age, nom_equipe, club_id, donnees_equipe::text as donnees_equipe, pieces_or, pieces from profils where compte_id = ${id}`;
    return send(res, 200, { jeton, pseudo: rows[0].pseudo, profil: p[0] || null });
  } catch (e) {
    console.error(e);
    return send(res, 500, { erreur: 'Erreur du serveur' });
  }
};
