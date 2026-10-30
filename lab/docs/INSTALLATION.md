# Artparts.ci — guide de démarrage

Application immobilière en français pour la Côte d’Ivoire, réalisée à partir du cahier des charges de [readme.md](../readme.md). La base demandée a été remplacée par **MongoDB**, avec Mongoose. Les données sont persistantes ; aucune base simulée n’est utilisée.

## Démarrer en local

Prérequis : Node.js **20.19 minimum** (22 LTS conseillé), npm, Docker Desktop démarré ou un serveur MongoDB 8 accessible.

Depuis la racine du projet :

```powershell
npm install
npm run setup
docker compose up -d mongo
npm run seed
npm run dev
```

Ouvrir **http://localhost:3100**. L’API écoute sur http://localhost:4000/api et sa disponibilité se vérifie à `/api/health`.

`setup` génère une clé de session aléatoire et conserve les configurations déjà présentes. `seed` ajoute les données de démonstration sans effacer les autres données et sans réinitialiser les comptes existants. Il est facultatif pour une base vide destinée à de vraies annonces.

| Compte de démonstration | Email              | Mot de passe initial |
| ----------------------- | ------------------ | -------------------- |
| Agence                  | agence@artparts.ci | Artparts2026!        |
| Client                  | client@artparts.ci | Artparts2026!        |

Le mot de passe initial peut être remplacé par la variable `DEMO_PASSWORD` **avant le premier seed**. Les annonces, contacts, coordonnées, photos et visites du seed sont fictifs ou illustratifs. Le panorama partagé sert uniquement à démontrer le lecteur 360°, il ne correspond pas aux biens.

## Parcours disponibles

- **Visiteur** : catalogue, recherche par ville/quartier, vente/location, type, budget, chambres, présence de visite 360°, tri, pagination, carte interactive, fiches et galerie.
- **Client** : inscription/connexion, favoris persistants, préférences, recommandations avec score explicable, prise de rendez-vous, annulation, conversations avec les professionnels.
- **Propriétaire/agence** : publication, brouillon, modification, archivage/restauration via le statut, URL de photos et panorama, suivi des prospects, qualification, notes internes, réponses aux messages, confirmation des visites, indicateurs commerciaux.

Pour essayer : se connecter comme client, ouvrir une annonce en location, envoyer un message et demander une visite. Se connecter ensuite comme agence et retrouver la conversation dans **Mes prospects**, puis confirmer la demande dans **Mes rendez-vous**.

Les visites durent une heure, entre 8 h et 18 h GMT, dans les 90 prochains jours. Deux visites actives ne peuvent pas partager le même créneau pour un professionnel ou un client. Une annulation libère le créneau. Une visite ne peut être marquée effectuée que par le professionnel, après son heure de début et après confirmation.

## Configuration

`apps/api/.env` :

| Variable      | Usage                                                                       |
| ------------- | --------------------------------------------------------------------------- |
| `PORT`        | Port API, 4000 par défaut                                                   |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/artparts` par défaut ; compatible Atlas          |
| `JWT_SECRET`  | Secret obligatoire d’au moins 32 caractères, généré par `setup`             |
| `WEB_ORIGIN`  | Origine exacte du site, `http://localhost:3100` en local                    |
| `NODE_ENV`    | `development`, `test` ou `production` ; cookie sécurisé HTTPS en production |

`apps/web/.env.local` : `API_URL=http://127.0.0.1:4000`. Le navigateur appelle `/api` sur le même site ; Next.js transmet ces appels à Express. Aucun secret MongoDB ou JWT n’est envoyé au navigateur.

Pour Atlas, modifier uniquement `MONGODB_URI`, avec un utilisateur dédié et les accès réseau adaptés. Docker n’est alors pas nécessaire. Ne jamais committer les fichiers `.env`.

## Vérifier et compiler

```powershell
npm run typecheck
npm test
npm run build
```

Une vérification HTTP complète est également disponible, avec l’application démarrée et les données de démonstration présentes : `npm run smoke`. Elle contrôle les pages, le proxy Next.js, la connexion, le cookie de session, les favoris et les recommandations. `SMOKE_URL` et `SMOKE_EMAIL` permettent d’adapter la cible et le compte ; `DEMO_PASSWORD` permet d’adapter le mot de passe.

Les tests nécessitent MongoDB. Ils utilisent une base **`artparts_test_<identifiant aléatoire>`** et suppriment uniquement cette base à la fin. `TEST_MONGODB_URI` permet de choisir le serveur de test ; le nom de base est toujours isolé. Ils couvrent les sessions, permissions, brouillons, recherche, favoris, confidentialité des notes, messagerie, créneaux concurrents, transitions des visites, recommandations, statistiques et archivage.

Après compilation, lancer dans deux terminaux :

```powershell
npm run start -w apps/api
```

```powershell
npm run start -w apps/web
```

Pour arrêter le développement, `Ctrl+C`. Pour arrêter MongoDB : `docker compose stop`. Son volume conserve les données.

## Architecture

```text
apps/web/             Next.js App Router, React, TypeScript, CSS responsive
  app/                Accueil, catalogue, fiches, authentification, espace
  components/         Formulaires, carte, annonces, messagerie, rendez-vous
  lib/                Client API, types et libellés
apps/api/             Node.js, Express 5, TypeScript
  src/app.ts          Routes REST, permissions et gestion des erreurs
  src/models.ts       Schémas Mongoose et index MongoDB
  src/validation.ts   Validation des entrées Zod
  src/recommendations.ts  Classement par critères explicites
  src/seed.ts         Jeu de démonstration réexécutable
  tests/              Tests d’intégration Supertest sur MongoDB
scripts/setup.mjs     Configuration locale et génération du secret
docker-compose.yml   MongoDB avec volume persistant
docs/API.md          Contrat des endpoints et exemples
```

Collections : `users`, `properties`, `leads`, `appointments`. Les références relient propriétaires, biens et clients. Les index uniques empêchent les comptes en double, les prospects en double pour un même bien/client et les conflits de réservation. L’archivage des annonces conserve les conversations et les rendez-vous existants.

Authentification par JWT signé dans un cookie `HttpOnly`, `SameSite=Lax`, mots de passe hachés avec bcrypt, limitation de débit, Helmet, validation Zod et contrôle de l’origine des mutations. Les droits sont vérifiés côté serveur. Les notes internes sont masquées aux clients. Les URLs de média doivent être en HTTPS.

## Périmètre et services externes

- Les recommandations sont un **classement déterministe**, sans modèle d’apprentissage : projet (25 points), ville (15), quartier (15), budget (25), type (10), chambres (10). Un dépassement de budget réduit le score. Le score maximal est 100 ; un critère laissé indifférent n’ajoute pas ses points. Les résultats sont limités au type de transaction choisi.
- Carte Leaflet et tuiles OpenStreetMap, avec attribution. Images de démonstration Unsplash, polices Google Fonts, lecteur Pannellum externe. Ces ressources nécessitent une connexion ; pour une exploitation importante, prévoir un hébergement adapté des tuiles/médias/polices et du lecteur.
- Publication d’images **par URL**, sans téléversement de fichiers. Le panorama doit être équirectangulaire (ratio 2:1), avec CORS autorisé côté hébergeur.
- Messagerie et confirmations dans l’application ; pas d’envoi d’emails/SMS, pas de synchronisation calendrier ni de paiement.
- Le rôle professionnel est choisi à l’inscription. La plateforme ne prétend pas vérifier l’identité, la propriété d’un bien ou la fiabilité juridique d’une annonce.
- En production : HTTPS, MongoDB avec authentification et sauvegardes, secrets propres à l’environnement, gestion des limites de débit partagée si plusieurs instances, et comptes de démonstration exclus de la base réelle.

## Dépannage

- **API indisponible** : vérifier `apps/api/.env`, le secret, `docker compose ps` et `/api/health`.
- **Port 27017 occupé** : utiliser un autre port dans Compose et reporter ce port dans `MONGODB_URI` (et `TEST_MONGODB_URI` pour les tests).
- Le frontend utilise le port **3100**, pour éviter le service déjà présent sur le port 3000 de cette machine. Pour changer de port, adapter les scripts `dev`/`start` du frontend, `WEB_ORIGIN` et `SMOKE_URL`.
- **Origine refusée** : accéder par `localhost:3100` comme configuré, ou ajuster `WEB_ORIGIN` à l’origine exacte utilisée.
- **Panorama noir/erreur** : contrôler le lien direct, le format et les en-têtes CORS de l’image. Les photos ordinaires ne constituent pas un panorama 360°.
- **Pas d’annonces** : exécuter `npm run seed` ou publier une annonce avec un compte professionnel.
