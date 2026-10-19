# MAISON — Le style, simplement.

Boutique de vêtements **MERN** : MongoDB / Mongoose, Express, React et Node.js. Interface française, direction artistique ivoire et vert forêt, typographies éditoriales et photographies de mode. La mise en page s’adapte au mobile, à la tablette et au bureau.

## Démarrer

Node.js **22 LTS** recommandé (minimum 20.19).

```sh
npm install
npm run dev
```

Ouvrir **http://localhost:5173**. Vite sert React sur le port 5173 et transmet les requêtes `/api` à Express sur le port 3001.

**Sans configuration**, la boutique fonctionne en démonstration : catalogue de huit pièces, recherche, filtres, favoris, panier et simulation de commande. Les coordonnées de livraison ne sont pas enregistrées et aucun paiement n’est exécuté. Les favoris et le panier sont conservés dans le navigateur. Les comptes nécessitent MongoDB.

## Fonctionnalités

- Accueil éditorial, collections femme / homme / accessoires, nouveautés et page de marque.
- Catalogue avec recherche, filtres par catégorie, univers, taille et budget, et tri par prix ou nouveautés.
- Fiches produit : matière, entretien, tailles, couleurs, disponibilité par variante et pièces associées.
- Favoris et panier persistants ; modification des quantités et calcul des frais de livraison.
- Commande invitée ou connectée, calcul des prix côté serveur, déduction atomique des stocks, protection contre les commandes répétées et les ventes au-delà du stock.
- Comptes : inscription, connexion, déconnexion et historique personnel. Mots de passe hachés avec scrypt et session JWT dans un cookie HttpOnly.
- Inscription à la newsletter avec consentement, enregistrée dans MongoDB. L’envoi d’e-mails n’est pas intégré.
- Pages d’aide, guide des tailles, informations et confidentialité.
- Dialogues accessibles au clavier, fermeture avec Échap, zones de statut et respect de la préférence de mouvement réduit.

Le paiement proposé est **à la livraison**. Aucun paiement bancaire, espace d’administration, suivi transporteur ou envoi automatique d’e-mails n’est inclus. Les photographies, références et compositions constituent un catalogue illustratif à remplacer par vos données réelles. Les différentes couleurs ne disposent pas de photos distinctes.

La limitation des requêtes Express s’applique par instance. Pour une boutique commerciale très fréquentée, compléter cette protection avec les règles de la plateforme ou un stockage de limites partagé.

## Connecter MongoDB

Copier `.env.example` vers `.env` puis renseigner :

```dotenv
MONGODB_URI=mongodb+srv://UTILISATEUR:MOT_DE_PASSE@CLUSTER/maison
JWT_SECRET=une-cle-aleatoire-longue-d-au-moins-32-caracteres
APP_ORIGIN=http://localhost:5173
ENABLE_ORDERS=false
```

Créer une clé de session avec :

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Initialiser le catalogue et les index :

```sh
npm run seed
```

Le script ajoute les produits absents avec 12 unités par variante. Le relancer ne modifie ni les produits existants ni leurs stocks. Les commandes utilisent des transactions : **MongoDB Atlas ou un replica set est requis**, pas un serveur MongoDB autonome.

Les comptes et la newsletter deviennent disponibles dès que MongoDB et la clé de session sont configurés. Les commandes restent fermées tant que `ENABLE_ORDERS` ne vaut pas `true`. Définir cette valeur après avoir configuré vos produits, tarifs, modalités de livraison, mentions du commerçant et conditions de vente dans `src/pages.jsx`. Sans MongoDB, le parcours reste une simulation même si cette variable vaut `true`.

Les secrets sont exclusivement côté serveur. Ne jamais les préfixer par `VITE_`, ni committer `.env`.

## Déployer sur Vercel

Le frontend et l’API sont déployables **dans un seul projet**, sur le même domaine. L’entrée `api/index.js` expose Express en fonction Vercel et `vercel.json` configure les routes API et la navigation React.

1. Importer le dépôt Git dans Vercel. Si vous conservez ce projet dans le dépôt GMC-program, choisir `checkpoints/ecommerce-clothes-app` comme **Root Directory**.
2. Choisir **Vite**, la commande de build `npm run build` et le dossier de sortie `dist`. Les valeurs sont déjà définies dans `vercel.json`.
3. Utiliser Node.js 22 et ajouter les variables d’environnement serveur ci-dessus. Remplacer `APP_ORIGIN` par l’URL publique exacte, sans slash final. Définir `NODE_ENV=production` si la plateforme ne le fournit pas déjà.
4. Initialiser MongoDB une fois avec `npm run seed` depuis votre ordinateur en utilisant la même base Atlas.
5. Déployer et vérifier `/api/health`, `/api/products`, puis `/boutique` et une fiche produit en accès direct.

Pour publier une **démo**, les variables MongoDB et JWT peuvent rester absentes. La fonction Express est néanmoins nécessaire pour la simulation de commande.

Références officielles : [Vite sur Vercel](https://vercel.com/docs/frameworks/frontend/vite) et [configuration des réécritures](https://vercel.com/docs/routing/rewrites).

## Déployer sur Netlify

`netlify.toml` configure le build, le dossier publié, la fonction Express et les réécritures. `netlify/functions/api.js` adapte Express avec `serverless-http`.

1. Importer le dépôt et sélectionner `checkpoints/ecommerce-clothes-app` comme **Base directory** s’il reste dans le dépôt GMC-program ; sinon laisser la racine du projet.
2. Utiliser la commande `npm run build`, le dossier publié `dist` et les fonctions `netlify/functions`. Netlify lit normalement ces réglages dans `netlify.toml`.
3. Ajouter les mêmes variables d’environnement, accessibles aux **Functions**, avec `APP_ORIGIN=https://votre-boutique.netlify.app` et `NODE_ENV=production`.
4. Initialiser le catalogue MongoDB, puis déployer via Git et vérifier les mêmes routes.

Un simple glisser-déposer de `dist` publie uniquement la vitrine statique : **le déploiement via Git ou Netlify CLI est nécessaire pour inclure l’API**.

Référence officielle : [Express avec un frontend sur Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/express/).

## Vérifier le projet

```sh
npm test
npm run build
```

La suite principale vérifie les calculs, les validations et erreurs API, le consentement, les filtres, le tri, la recherche, les favoris, le panier, les quantités et le parcours de commande React dans un DOM de test.

Les tests MongoDB utilisent une base locale jetable et unique. Pour les exécuter avec Docker :

```sh
docker run --rm -d --name codex-maison-mongo-test -p 127.0.0.1:27137:27017 mongo:8.0 --replSet rs0 --bind_ip_all
docker exec codex-maison-mongo-test mongosh --quiet --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'
npm run test:mongo
docker stop codex-maison-mongo-test
```

Ces tests couvrent l’authentification, les cookies, l’isolation des historiques, les commandes persistantes, l’idempotence, l’annulation des réservations en cas d’échec et deux commandes simultanées sur la dernière unité. `TEST_MONGODB_URI` permet de choisir un autre replica set **local**. La suite refuse les hôtes distants et ne supprime que sa propre base temporaire.

Pour inspecter le build React : `npm run preview`. Cette commande sert uniquement les fichiers statiques ; utiliser `npm run dev` pour le parcours complet avec l’API, ou les outils de développement de Netlify / Vercel pour tester leurs fonctions.

## Structure

```text
src/                   Interface React, composants, pages et état de la boutique
shared/catalog.js      Catalogue initial, prix en centimes et règles de livraison
server/                API Express, modèles Mongoose, commandes et initialisation
api/index.js           Entrée de la fonction Vercel
netlify/functions/     Entrée de la fonction Netlify
public/images/         Photos incluses dans le projet
scripts/               Téléchargement des photos de démonstration
tests/                 Tests API, React et intégration MongoDB
```

Les photos sont déjà incluses et ne dépendent pas d’un chargement Unsplash à la consultation. `node scripts/fetch-images.mjs` retélécharge les fichiers manquants. Les polices sont chargées depuis Google Fonts, avec une police de secours locale. Voir `ATTRIBUTION.md` pour les sources des images.
