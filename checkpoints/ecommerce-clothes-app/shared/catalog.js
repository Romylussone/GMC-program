const photo = (id) => `/images/${id}.jpg`;

export const images = {
  hero: photo('photo-1539109136881-3be0616acf4b', 1600),
  women: photo('photo-1483985988355-763728e1935b', 1000),
  men: photo('photo-1617137968427-85924c800a22', 1000),
  story: photo('photo-1441986300917-64674bd600d8', 1200),
};

export const products = [
  {
    id: 'manteau-gabrielle',
    name: 'Le manteau Gabrielle',
    category: 'Manteaux',
    gender: 'Femme',
    price: 18900,
    originalPrice: null,
    badge: 'Nouveauté',
    newArrival: true,
    image: photo('photo-1539533018447-63fcce2678e3'),
    position: 'center 35%',
    colors: [
      { name: 'Camel', hex: '#b39475' },
      { name: 'Écru', hex: '#e4dfd3' },
      { name: 'Noir', hex: '#292b29' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    material: '70 % laine, 30 % polyester recyclé',
    description:
      'Une coupe enveloppante, un tombé impeccable. Avec ses lignes épurées et sa ceinture à nouer, Gabrielle accompagne naturellement les premiers jours frais. La pièce que l’on retrouve avec plaisir, saison après saison.',
  },
  {
    id: 'maille-camille',
    name: 'La maille Camille',
    category: 'Mailles',
    gender: 'Femme',
    price: 7900,
    originalPrice: null,
    badge: 'Coup de cœur',
    newArrival: false,
    image: photo('photo-1434389677669-e08b4cac3105'),
    position: 'center',
    colors: [
      { name: 'Écru', hex: '#e6dfd0' },
      { name: 'Taupe', hex: '#a49a8d' },
      { name: 'Sauge', hex: '#8b9783' },
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    material: '100 % coton biologique',
    description:
      'Le réconfort d’une belle maille, la simplicité d’une coupe intemporelle. Camille se porte sur un jean comme sur une jupe, pour ces journées où l’on veut simplement se sentir bien.',
  },
  {
    id: 'chemise-arthur',
    name: 'La chemise Arthur',
    category: 'Chemises',
    gender: 'Homme',
    price: 6900,
    originalPrice: 8900,
    badge: '-22 %',
    newArrival: false,
    image: photo('photo-1598033129183-c4f50c736f10'),
    position: 'center 35%',
    colors: [
      { name: 'Sable', hex: '#cdc0a5' },
      { name: 'Blanc', hex: '#f2f0e9' },
      { name: 'Bleu', hex: '#7b8e9b' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    material: '100 % lin',
    description:
      'Un lin léger et une allure décontractée. Arthur revisite la chemise essentielle avec une coupe droite et de jolis détails, à porter seule ou ouverte sur un t-shirt.',
  },
  {
    id: 'pantalon-louise',
    name: 'Le pantalon Louise',
    category: 'Pantalons',
    gender: 'Femme',
    price: 8900,
    originalPrice: null,
    badge: 'Nouveauté',
    newArrival: true,
    image: photo('photo-1473966968600-fa801b869a1a'),
    position: 'center 48%',
    colors: [
      { name: 'Sable', hex: '#c8bca5' },
      { name: 'Noir', hex: '#282928' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    material: '98 % coton, 2 % élasthanne',
    description:
      'Une taille haute, une jambe fluide, une liberté de mouvement. Louise dessine une silhouette simple et élégante, du premier café aux derniers rendez-vous.',
  },
  {
    id: 'veste-auguste',
    name: 'La veste Auguste',
    category: 'Manteaux',
    gender: 'Homme',
    price: 13900,
    originalPrice: null,
    badge: 'Nouveauté',
    newArrival: true,
    image: photo('photo-1591047139829-d91aecb6caea'),
    position: 'center',
    colors: [
      { name: 'Olive', hex: '#6f7156' },
      { name: 'Marine', hex: '#343d48' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    material: '100 % coton',
    description:
      'Inspirée des vestes de travail et pensée pour le quotidien. Auguste associe une toile résistante, des poches généreuses et une coupe qui traverse les saisons.',
  },
  {
    id: 'robe-juliette',
    name: 'La robe Juliette',
    category: 'Robes',
    gender: 'Femme',
    price: 11900,
    originalPrice: 14900,
    badge: '-20 %',
    newArrival: false,
    image: photo('photo-1515372039744-b8f02a3ae446'),
    position: 'center 30%',
    colors: [
      { name: 'Écru', hex: '#e3d8c7' },
      { name: 'Terracotta', hex: '#ad7562' },
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    material: '100 % viscose',
    description:
      'Une robe légère qui suit vos mouvements. Sa taille délicatement marquée et sa longueur midi font de Juliette une pièce facile à aimer, facile à porter.',
  },
  {
    id: 'sac-margot',
    name: 'Le sac Margot',
    category: 'Accessoires',
    gender: 'Accessoires',
    price: 9900,
    originalPrice: null,
    badge: null,
    newArrival: false,
    image: photo('photo-1548036328-c9fa89d128fa'),
    position: 'center',
    colors: [
      { name: 'Cognac', hex: '#986b45' },
      { name: 'Noir', hex: '#282928' },
    ],
    sizes: ['Unique'],
    material: 'Cuir de vachette, doublure coton',
    description:
      'Le juste équilibre entre forme et fonction. Avec sa bandoulière réglable et son format compact, Margot garde vos essentiels à portée de main.',
  },
  {
    id: 'pull-gaspard',
    name: 'Le pull Gaspard',
    category: 'Mailles',
    gender: 'Homme',
    price: 9500,
    originalPrice: null,
    badge: 'Nouveauté',
    newArrival: true,
    image: photo('photo-1620799140408-edc6dcb6d633'),
    position: 'center',
    colors: [
      { name: 'Marine', hex: '#343e48' },
      { name: 'Écru', hex: '#e6dfd0' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    material: '80 % laine, 20 % polyamide',
    description:
      'Un col rond, une maille douce et une coupe juste. Gaspard est cet essentiel que l’on choisit sans hésiter pour les matins frais et les week-ends tranquilles.',
  },
];

export const categories = [
  'Tout voir',
  'Manteaux',
  'Mailles',
  'Chemises',
  'Pantalons',
  'Robes',
  'Accessoires',
];
export const shippingThreshold = 10000;
export const shippingFee = 590;
export const money = (cents) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
export const variantKey = (size, color) => `${size}:${color}`;
