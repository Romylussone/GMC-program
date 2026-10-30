import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { User, Property, Lead, Appointment } from "./models.js";

await mongoose.connect(config.MONGODB_URI);
await Promise.all([
  User.init(),
  Property.init(),
  Lead.init(),
  Appointment.init(),
]);
const password = await bcrypt.hash(
  process.env.DEMO_PASSWORD || "Artparts2026!",
  12,
);
async function demoUser(
  email: string,
  name: string,
  role: "agency" | "seeker",
) {
  return User.findOneAndUpdate(
    { email },
    {
      $setOnInsert: {
        email,
        name,
        role,
        password,
        phone: "+225 07 00 00 00 00",
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
}
const owner = await demoUser(
  "agence@artparts.ci",
  "Maison Ivoire · Agence",
  "agency",
);
const seeker = await demoUser("client@artparts.ci", "Aminata Koné", "seeker");
const photos = [
  "photo-1600596542815-ffad4c1539a9",
  "photo-1600585154340-be6161a56a0c",
  "photo-1600607687939-ce8a6c25118c",
  "photo-1600566753086-00f18fb6b3ea",
  "photo-1600047509807-ba8f99d2cdde",
  "photo-1600210492486-724fe5c67fb0",
];
const data = [
  {
    title: "Villa d’architecte avec piscine",
    district: "Cocody Riviera 4",
    type: "villa",
    transaction: "sale",
    price: 185000000,
    area: 420,
    bedrooms: 5,
    bathrooms: 4,
    latitude: 5.365,
    longitude: -3.947,
  },
  {
    title: "Un appartement baigné de lumière",
    district: "Marcory Zone 4",
    type: "apartment",
    transaction: "rent",
    price: 650000,
    area: 145,
    bedrooms: 3,
    bathrooms: 2,
    latitude: 5.293,
    longitude: -3.982,
  },
  {
    title: "Le calme, au cœur de la Riviera",
    district: "Cocody Riviera 3",
    type: "house",
    transaction: "rent",
    price: 450000,
    area: 180,
    bedrooms: 3,
    bathrooms: 2,
    latitude: 5.369,
    longitude: -3.968,
  },
  {
    title: "Un cocon contemporain aux Deux Plateaux",
    district: "Cocody Deux Plateaux",
    type: "apartment",
    transaction: "rent",
    price: 300000,
    area: 95,
    bedrooms: 2,
    bathrooms: 2,
    latitude: 5.387,
    longitude: -3.995,
  },
  {
    title: "Une villa ouverte sur le jardin",
    district: "Bingerville",
    type: "villa",
    transaction: "sale",
    price: 95000000,
    area: 320,
    bedrooms: 4,
    bathrooms: 3,
    latitude: 5.355,
    longitude: -3.899,
  },
  {
    title: "Votre prochain bureau au Plateau",
    district: "Plateau",
    type: "office",
    transaction: "rent",
    price: 850000,
    area: 160,
    bedrooms: 0,
    bathrooms: 2,
    latitude: 5.324,
    longitude: -4.023,
  },
  {
    title: "Terrain pour votre projet de vie",
    district: "Bingerville",
    type: "land",
    transaction: "sale",
    price: 25000000,
    area: 600,
    bedrooms: 0,
    bathrooms: 0,
    latitude: 5.37,
    longitude: -3.88,
  },
  {
    title: "Appartement avec terrasse panoramique",
    district: "Treichville",
    type: "apartment",
    transaction: "sale",
    price: 62000000,
    area: 120,
    bedrooms: 2,
    bathrooms: 2,
    latitude: 5.302,
    longitude: -4.005,
  },
];
for (let i = 0; i < data.length; i++) {
  const p = data[i];
  await Property.updateOne(
    { owner: owner._id, title: p.title },
    {
      $setOnInsert: {
        ...p,
        city: "Abidjan",
        address: `${p.district}, Abidjan, Côte d’Ivoire`,
        owner: owner._id,
        description:
          "Annonce de démonstration. Découvrez des volumes généreux et un cadre de vie agréable, à proximité des commerces et des services. Ce bien dispose de finitions soignées et d’un accès facile aux principaux axes de la ville. Les photographies et le panorama sont des illustrations et ne représentent pas un bien réellement commercialisé.",
        images: [0, 1, 2].map(
          (offset) =>
            `https://images.unsplash.com/${photos[(i + offset) % photos.length]}?auto=format&fit=crop&w=1400&q=85`,
        ),
        panorama: i < 4 ? "https://pannellum.org/images/alma.jpg" : "",
        amenities:
          p.type === "land"
            ? ["Accès routier", "Électricité à proximité"]
            : [
                "Parking",
                "Sécurité 24 h/24",
                "Climatisation",
                ...(p.type === "villa" ? ["Piscine", "Jardin"] : ["Terrasse"]),
              ],
        status: "published",
      },
    },
    { upsert: true, runValidators: true },
  );
}
const property = await Property.findOne({
  owner: owner._id,
  transaction: "rent",
});
if (property)
  await Lead.updateOne(
    { property: property._id, seeker: seeker._id },
    {
      $setOnInsert: {
        owner: owner._id,
        stage: "qualified",
        notes: "Budget cohérent. Préfère une visite le matin.",
        messages: [
          {
            sender: seeker._id,
            body: "Bonjour, ce bien m’intéresse. Est-il toujours disponible ?",
          },
          {
            sender: owner._id,
            body: "Bonjour Aminata, oui ! Vous pouvez choisir un créneau de visite sur la fiche du bien.",
          },
        ],
      },
    },
    { upsert: true },
  );
console.log(
  "Données de démonstration ajoutées sans effacer les données existantes.",
);
console.log(
  "Comptes : agence@artparts.ci et client@artparts.ci. Mot de passe : DEMO_PASSWORD ou celui documenté.",
);
await mongoose.disconnect();
