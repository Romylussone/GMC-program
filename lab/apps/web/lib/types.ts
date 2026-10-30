export type Preferences = {
  city: string;
  district: string;
  transaction: "rent" | "sale";
  type: string;
  budget: number;
  bedrooms: number;
};
export type User = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "seeker" | "owner" | "agency";
  favorites: string[];
  preferences: Preferences;
};
export type Person = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
};
export type Property = {
  _id: string;
  title: string;
  description: string;
  transaction: "rent" | "sale";
  type: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  images: string[];
  panorama: string;
  amenities: string[];
  status: string;
  owner: Person;
  score?: number;
  reasons?: string[];
};
export type Lead = {
  _id: string;
  property: Property;
  seeker: Person;
  owner: Person;
  stage: string;
  notes: string;
  messages: { sender: string; body: string; sentAt: string }[];
};
export type Appointment = {
  _id: string;
  property: Property;
  seeker: Person;
  owner: Person;
  startsAt: string;
  status: string;
  message: string;
};
export const types: Record<string, string> = {
  apartment: "Appartement",
  villa: "Villa",
  house: "Maison",
  land: "Terrain",
  office: "Bureau",
};
export const stages: Record<string, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  qualified: "Qualifié",
  won: "Gagné",
  lost: "Perdu",
};
export const visitStatuses: Record<string, string> = {
  pending: "À confirmer",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Effectuée",
};
export const money = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
export const dateTime = (s: string) =>
  new Intl.DateTimeFormat("fr-CI", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(new Date(s));
