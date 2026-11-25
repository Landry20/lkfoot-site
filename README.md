# LK FOOTBALL — site et API

- `public/` : site de présentation du jeu (téléchargement de l'APK Android). On ne s'inscrit pas sur le site.
- `api/` : API utilisée **par le jeu** (inscription, connexion, sauvegarde du profil), reliée à la base Neon.
- `db/schema.sql` : tables `comptes`, `sessions`, `profils`.

## Variables d'environnement (Vercel)

- `DATABASE_URL` : chaîne de connexion Neon. Elle n'est jamais dans ce dépôt ni dans l'APK.

## API

| Méthode | Chemin | Corps / en-tête |
|---|---|---|
| POST | `/api/inscription` | `{ email, pseudo, motDePasse, nomManager, age, nomEquipe, clubId }` → `{ jeton }` |
| POST | `/api/connexion` | `{ email, motDePasse }` → `{ jeton, profil }` |
| GET / POST | `/api/profil` | `Authorization: Bearer <jeton>` |

L'APK est publié dans les *Releases* du dépôt sous le nom `LK-Football.apk`.
