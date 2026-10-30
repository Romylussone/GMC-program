export interface RecommendationProperty {
  price: number;
  city: string;
  district: string;
  transaction: string;
  type: string;
  bedrooms?: number | null;
}
export interface Preferences {
  budget: number;
  city: string;
  district?: string;
  transaction: string;
  type?: string;
  bedrooms: number;
}
export function scoreProperty(
  property: RecommendationProperty,
  prefs: Preferences,
) {
  let score = 0;
  const reasons: string[] = [];
  if (property.transaction === prefs.transaction) {
    score += 25;
    reasons.push("Même projet");
  }
  if (property.city.toLowerCase() === prefs.city.toLowerCase()) {
    score += 15;
    reasons.push("Ville recherchée");
  }
  if (
    prefs.district &&
    property.district.toLowerCase() === prefs.district.toLowerCase()
  ) {
    score += 15;
    reasons.push("Quartier préféré");
  }
  if (property.price <= prefs.budget) {
    score += 25;
    reasons.push("Dans votre budget");
  } else score += Math.max(0, 25 - (property.price / prefs.budget - 1) * 50);
  if (prefs.type && property.type === prefs.type) {
    score += 10;
    reasons.push("Type souhaité");
  }
  if ((property.bedrooms || 0) >= prefs.bedrooms) {
    score += 10;
    reasons.push("Nombre de chambres adapté");
  }
  return { score: Math.round(score), reasons };
}
