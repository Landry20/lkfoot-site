// POST /api/inscription — crée un compte et son profil, renvoie un jeton de session.
// Corps : { email, pseudo, motDePasse, nomManager?, age?, nomEquipe?, clubId? }
const { sql, hashPassword, createSession, send, preflight, readBody, emailOk } = require('../lib/db');

module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { erreur: 'Méthode non autorisée' });
  try {
    const b = await readBody(req);
    const email = String(b.email || '').trim().toLowerCase();
    const pseudo = String(b.pseudo || '').trim();
    const motDePasse = String(b.motDePasse || '');
    if (!emailOk(email)) return send(res, 400, { erreur: 'Adresse e-mail invalide' });
    if (pseudo.length < 2 || pseudo.length > 30) return send(res, 400, { erreur: 'Le pseudo doit faire entre 2 et 30 caractères' });
    if (motDePasse.length < 6 || motDePasse.length > 100) return send(res, 400, { erreur: 'Le mot de passe doit faire au moins 6 caractères' });

    const existing = await sql()`select 1 from comptes where email = ${email}`;
    if (existing.length) return send(res, 409, { erreur: 'Un compte existe déjà avec cet e-mail' });

    const rows = await sql()`insert into comptes (email, pseudo, mot_de_passe_hash)
                             values (${email}, ${pseudo}, ${hashPassword(motDePasse)}) returning id`;
    const id = rows[0].id;
    const age = Number.isInteger(b.age) ? b.age : (parseInt(b.age, 10) || null);
    await sql()`insert into profils (compte_id, nom_manager, age, nom_equipe, club_id)
                values (${id}, ${String(b.nomManager || pseudo).slice(0, 40)}, ${age},
                        ${String(b.nomEquipe || '').slice(0, 40)}, ${String(b.clubId || '').slice(0, 40)})`;
    const jeton = await createSession(id);
    return send(res, 201, { jeton, pseudo });
  } catch (e) {
    console.error(e);
    return send(res, 500, { erreur: 'Erreur du serveur' });
  }
};
