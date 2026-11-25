// GET  /api/profil — profil du joueur connecté (en-tête Authorization: Bearer <jeton>)
// POST /api/profil — enregistre la progression : { nomManager?, age?, nomEquipe?, clubId?, donneesEquipe?, piecesOr?, pieces? }
const { sql, accountFromRequest, send, preflight, readBody } = require('../lib/db');

module.exports = async (req, res) => {
  if (preflight(req, res)) return;
  try {
    const id = await accountFromRequest(req);
    if (!id) return send(res, 401, { erreur: 'Session expirée, reconnecte-toi' });

    if (req.method === 'GET') {
      const p = await sql()`select c.pseudo, c.email, p.nom_manager, p.age, p.nom_equipe, p.club_id, p.donnees_equipe::text as donnees_equipe, p.pieces_or, p.pieces
                            from comptes c left join profils p on p.compte_id = c.id where c.id = ${id}`;
      return send(res, 200, { profil: p[0] || null });
    }
    if (req.method === 'POST') {
      const b = await readBody(req);
      let donnees = null;
      if (b.donneesEquipe !== undefined) {
        donnees = typeof b.donneesEquipe === 'string' ? b.donneesEquipe : JSON.stringify(b.donneesEquipe);
        if (donnees.length > 400000) return send(res, 413, { erreur: 'Sauvegarde trop grosse' });
        JSON.parse(donnees); // vérifie que c'est du JSON valide
      }
      await sql()`update profils set
          nom_manager    = coalesce(${b.nomManager ?? null}, nom_manager),
          age            = coalesce(${b.age ?? null}, age),
          nom_equipe     = coalesce(${b.nomEquipe ?? null}, nom_equipe),
          club_id        = coalesce(${b.clubId ?? null}, club_id),
          donnees_equipe = coalesce(${donnees}::jsonb, donnees_equipe),
          pieces_or      = coalesce(${b.piecesOr ?? null}, pieces_or),
          pieces         = coalesce(${b.pieces ?? null}, pieces),
          maj_le         = now()
        where compte_id = ${id}`;
      return send(res, 200, { ok: true });
    }
    return send(res, 405, { erreur: 'Méthode non autorisée' });
  } catch (e) {
    console.error(e);
    return send(res, 500, { erreur: 'Erreur du serveur' });
  }
};
