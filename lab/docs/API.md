# API Artparts.ci

Base locale : `http://localhost:4000/api`. Depuis Next.js, utiliser `/api`. Format JSON, prix en FCFA, dates ISO 8601 en UTC (Abidjan = UTC). Les appels authentifiés utilisent le cookie `artparts_session`, reçu à l’inscription ou à la connexion. Postman conserve automatiquement ce cookie.

| Méthode      | Route                   | Accès / comportement                                                                        |
| ------------ | ----------------------- | ------------------------------------------------------------------------------------------- |
| GET          | `/health`               | État API et connexion MongoDB                                                               |
| POST         | `/auth/register`        | `name`, `email`, `password` (10+ caractères), `phone`, `role` (`seeker`, `owner`, `agency`) |
| POST         | `/auth/login`           | `email`, `password` ; crée le cookie de session                                             |
| POST         | `/auth/logout`          | Efface le cookie                                                                            |
| GET          | `/auth/me`              | Compte courant sans mot de passe                                                            |
| GET          | `/properties`           | Catalogue public et paginé                                                                  |
| GET          | `/properties/:id`       | Détail d’un bien publié                                                                     |
| POST         | `/properties`           | Professionnel : créer une annonce                                                           |
| PATCH        | `/properties/:id`       | Propriétaire de l’annonce : modifier les champs                                             |
| DELETE       | `/properties/:id`       | Propriétaire de l’annonce : archiver                                                        |
| GET          | `/me/properties`        | Annonces du professionnel, tous statuts                                                     |
| GET          | `/me/favorites`         | Favoris publiés du compte courant                                                           |
| PUT / DELETE | `/me/favorites/:id`     | Ajouter / retirer un favori (idempotent)                                                    |
| PATCH        | `/me/preferences`       | Enregistrer l’ensemble des critères                                                         |
| GET          | `/me/recommendations`   | Jusqu’à 12 biens avec `score` et `reasons`                                                  |
| POST         | `/properties/:id/leads` | `message` ; ouvre/alimente une conversation                                                 |
| GET          | `/me/leads`             | Conversations accessibles au compte ; notes internes masquées aux clients                   |
| PATCH        | `/leads/:id`            | Professionnel propriétaire : `stage`, `notes`                                               |
| POST         | `/leads/:id/messages`   | Participant : `message`                                                                     |
| POST         | `/appointments`         | `propertyId`, `startsAt`, `message` facultatif                                              |
| GET          | `/me/appointments`      | Rendez-vous accessibles au compte                                                           |
| PATCH        | `/appointments/:id`     | `status` : `confirmed`, `cancelled`, `completed` selon les droits et transitions            |
| GET          | `/me/stats`             | Professionnel : annonces publiées, prospects, visites à venir, conversion                   |

Recherche : `q`, `city`, `district`, `transaction=rent|sale`, `type=apartment|villa|house|land|office`, `minPrice`, `maxPrice`, `bedrooms` (minimum), `tour=true`, `sort=recent|price-asc|price-desc`, `page`, `limit` (1–60). Réponse : `{ items, total, page, pages }`.

```http
GET /api/properties?transaction=rent&q=Cocody&maxPrice=500000&bedrooms=2&sort=price-asc
```

Exemple d’annonce :

```json
{
  "title": "Appartement lumineux à Cocody",
  "description": "Un appartement spacieux, avec terrasse, proche des commerces et des écoles.",
  "transaction": "rent",
  "type": "apartment",
  "price": 350000,
  "area": 120,
  "bedrooms": 3,
  "bathrooms": 2,
  "city": "Abidjan",
  "district": "Cocody",
  "address": "Cocody, Abidjan",
  "latitude": 5.35,
  "longitude": -3.98,
  "images": ["https://votre-hebergeur.ci/salon.jpg"],
  "panorama": "",
  "amenities": ["Parking", "Terrasse"],
  "status": "published"
}
```

Préférences :

```json
{
  "city": "Abidjan",
  "district": "Cocody",
  "transaction": "rent",
  "type": "apartment",
  "budget": 500000,
  "bedrooms": 2
}
```

Qualification : `new`, `contacted`, `qualified`, `won`, `lost`. Une conversation unique par client et bien, avec historique des messages. Les statistiques de conversion correspondent au nombre de prospects `won` divisé par le nombre total de prospects.

Codes : `200` lecture/modification, `201` création, `204` suppression logique/favori/déconnexion, `400` entrée invalide, `401` session requise, `403` rôle/origine refusé, `404` ressource indisponible ou inaccessible, `409` email/créneau déjà utilisé ou transition concurrente, `429` limite atteinte, `500` erreur interne, `503` base indisponible sur la route de santé.

Erreur : `{ "message": "…", "errors": [{ "field": "price", "message": "…" }] }` ; `errors` est présent pour les erreurs de validation Zod.
