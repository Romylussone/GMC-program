import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Heart,
  Truck,
  RotateCcw,
  ShoppingBag,
  SlidersHorizontal,
  X,
  Leaf,
  LoaderCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import {
  Button,
  IconButton,
  ProductCard,
  Benefits,
  Newsletter,
  Accordion,
  CartLine,
} from './components.jsx';
import { useShop, api } from './store.jsx';
import { categories, images, money } from '../shared/catalog.js';

export function Home() {
  const { products } = useShop();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span /> L’ALLURE D’UNE NOUVELLE SAISON
          </div>
          <h1>
            Le style,
            <br />
            <em>simplement.</em>
          </h1>
          <p>
            Des pièces essentielles. Des matières choisies.
            <br />
            Une garde-robe qui traverse le temps, avec vous.
          </p>
          <Button to="/boutique">
            Découvrir la collection <ArrowRight size={18} />
          </Button>
          <div className="hero-footnote">
            <span className="small-line" /> COLLECTION AUTOMNE — HIVER 2026
          </div>
          <span className="hero-index">01 — 03</span>
        </div>
        <div className="hero-image">
          <img
            src={images.hero}
            alt="Une silhouette urbaine et intemporelle, collection MAISON automne-hiver"
            fetchPriority="high"
          />
          <span className="hero-image-label">LES BEAUX JOURS DU QUOTIDIEN.</span>
          <Link
            to="/boutique?genre=Femme"
            className="hero-discover"
            aria-label="Découvrir la collection femme"
          >
            <ArrowUpRight size={27} strokeWidth={1.25} />
          </Link>
          <div className="hero-image-bottom">
            <span>L’essentiel, autrement.</span>
            <span>PARIS, FRANCE · 48°51′ N</span>
          </div>
        </div>
      </section>
      <div className="benefits-container">
        <Benefits />
      </div>
      <section className="section featured-section" id="selection">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BIEN CHOISIS. BIEN PORTÉS.</span>
            <h2>Vos prochains essentiels.</h2>
          </div>
          <Link className="arrow-link" to="/boutique">
            Toute la collection <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {products.slice(0, 4).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
        <div className="collection-note">
          <span>Des coupes justes, de belles matières, et rien de superflu.</span>
          <span>
            Faits pour votre quotidien <span className="asterisk">✳</span>
          </span>
        </div>
      </section>
      <section className="section univers-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">À CHACUN SON ALLURE</span>
            <h2>Votre style, votre univers.</h2>
          </div>
          <p>
            La même envie de simplicité.
            <br />
            Mille façons de la porter.
          </p>
        </div>
        <div className="univers-grid">
          <Link to="/boutique?genre=Femme" className="universe-card">
            <img
              src={images.women}
              alt="La collection femme, une mode libre et spontanée"
              loading="lazy"
            />
            <span className="universe-top">L’ALLURE AU FÉMININ</span>
            <div>
              <h3>Pour elle.</h3>
              <span>
                Découvrir la sélection <ArrowUpRight size={22} />
              </span>
            </div>
          </Link>
          <Link to="/boutique?genre=Homme" className="universe-card">
            <img
              src={images.men}
              alt="La collection homme, des silhouettes intemporelles"
              loading="lazy"
            />
            <span className="universe-top">L’ÉLÉGANCE AU NATUREL</span>
            <div>
              <h3>Pour lui.</h3>
              <span>
                Découvrir la sélection <ArrowUpRight size={22} />
              </span>
            </div>
          </Link>
          <Link to="/boutique?genre=Accessoires" className="accessory-card">
            <span className="eyebrow">LE DÉTAIL QUI CHANGE TOUT</span>
            <h3>
              La touche
              <br />
              <em>finale.</em>
            </h3>
            <img
              src={products.find((p) => p.id === 'sac-margot')?.image}
              alt="Le sac Margot, accessoire essentiel"
              loading="lazy"
            />
            <span>
              Nos accessoires <ArrowUpRight size={21} />
            </span>
          </Link>
        </div>
      </section>
      <section className="story-section">
        <div className="story-image">
          <img
            src={images.story}
            alt="L’atmosphère lumineuse et épurée d’un atelier de vêtements"
            loading="lazy"
          />
          <span>UN CERTAIN SENS DE L’ESSENTIEL.</span>
        </div>
        <div className="story-copy">
          <span className="eyebrow">PLUS QU’UN VESTIAIRE, UN ÉTAT D’ESPRIT.</span>
          <h2>
            Moins, mais
            <br />
            <em>mieux.</em>
          </h2>
          <p>
            Nous croyons aux vêtements qu’on aime longtemps. Aux coupes qui tombent juste. Aux
            petits détails qui font toute la différence.
          </p>
          <p>
            MAISON, c’est une invitation à revenir à l’essentiel, sans jamais renoncer à son style.
          </p>
          <Link className="arrow-link" to="/maison">
            Entrez dans la Maison <ArrowUpRight size={19} />
          </Link>
          <span className="story-seal">
            M<span>DEPUIS 2026</span>
          </span>
        </div>
      </section>
      <section className="quote-section">
        <span className="eyebrow">NOTRE PHILOSOPHIE</span>
        <p>
          « Le plus beau vêtement est celui
          <br />
          dans lequel on se sent <em>soi-même.</em> »
        </p>
        <span className="quote-attribution">L’ESPRIT MAISON</span>
      </section>
      <Newsletter />
    </>
  );
}

export function Shop() {
  const { products, offline } = useShop();
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const gender = params.get('genre') || '';
  const category = params.get('categorie') || '';
  const newArrival = params.get('nouveautes') === 'oui';
  const query = params.get('q') || '';
  const sort = params.get('tri') || 'selection';
  const size = params.get('taille') || '';
  const maxPrice = Number(params.get('prix')) || 250;
  function change(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  let result = products.filter(
    (p) =>
      (!gender || p.gender === gender) &&
      (!category || p.category === category) &&
      (!newArrival || p.newArrival) &&
      (!size || p.sizes.includes(size)) &&
      p.price <= maxPrice * 100 &&
      (!query ||
        `${p.name} ${p.category} ${p.material}`
          .toLocaleLowerCase('fr')
          .includes(query.toLocaleLowerCase('fr'))),
  );
  if (sort === 'prix-asc') result = [...result].sort((a, b) => a.price - b.price);
  if (sort === 'prix-desc') result = [...result].sort((a, b) => b.price - a.price);
  if (sort === 'nouveautes')
    result = [...result].sort((a, b) => Number(b.newArrival) - Number(a.newArrival));
  const title = query
    ? `À la recherche de « ${query} »`
    : newArrival
      ? 'Un nouvel essentiel.'
      : gender === 'Femme'
        ? 'Le vestiaire féminin.'
        : gender === 'Homme'
          ? 'Le vestiaire masculin.'
          : gender === 'Accessoires'
            ? 'La touche finale.'
            : 'La collection.';
  return (
    <div className="shop-page">
      <div className="page-intro">
        <div className="breadcrumb">
          <Link to="/">Accueil</Link>
          <span>/</span>
          <span>La collection</span>
        </div>
        <span className="eyebrow">DES PIÈCES À AIMER LONGTEMPS</span>
        <h1>{title}</h1>
        <p>Vos essentiels de saison, choisis avec soin. À porter à votre façon.</p>
      </div>
      <div className="shop-toolbar">
        <div className="category-tabs">
          {categories.map((c) => (
            <button
              key={c}
              className={(category || 'Tout voir') === c ? 'active' : ''}
              onClick={() => change('categorie', c === 'Tout voir' ? '' : c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="shop-tools">
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={16} /> Filtres
          </button>
          <label className="sort-label">
            <span className="sr-only">Trier les produits</span>
            <select value={sort} onChange={(e) => change('tri', e.target.value)}>
              <option value="selection">Notre sélection</option>
              <option value="prix-asc">Prix croissant</option>
              <option value="prix-desc">Prix décroissant</option>
              <option value="nouveautes">Nouveautés</option>
            </select>
          </label>
        </div>
      </div>
      {showFilters && (
        <div className="filter-panel">
          <label>
            Univers
            <select value={gender} onChange={(e) => change('genre', e.target.value)}>
              <option value="">Tous les univers</option>
              <option>Femme</option>
              <option>Homme</option>
              <option>Accessoires</option>
            </select>
          </label>
          <label>
            Taille
            <select value={size} onChange={(e) => change('taille', e.target.value)}>
              <option value="">Toutes les tailles</option>
              {['XS', 'S', 'M', 'L', 'XL', 'Unique'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Budget : {money(maxPrice * 100)} maximum
            <input
              type="range"
              min="50"
              max="250"
              step="10"
              value={maxPrice}
              onChange={(e) => change('prix', e.target.value)}
            />
          </label>
          <button className="text-button" onClick={() => setParams({})}>
            Tout réinitialiser
          </button>
        </div>
      )}
      <div className="results-meta">
        <span>
          {result.length} pièce{result.length > 1 ? 's' : ''}
        </span>
        <div>
          {gender && (
            <button onClick={() => change('genre', '')}>
              {gender}
              <X size={12} />
            </button>
          )}
          {newArrival && (
            <button onClick={() => change('nouveautes', '')}>
              Nouveautés
              <X size={12} />
            </button>
          )}
          {query && (
            <button onClick={() => change('q', '')}>
              {query}
              <X size={12} />
            </button>
          )}
        </div>
        {offline && <small>Aperçu hors connexion · catalogue de démonstration</small>}
      </div>
      {result.length ? (
        <div className="product-grid shop-product-grid">
          {result.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <SearchIllustration />
          <h2>Aucune pièce pour cette sélection.</h2>
          <p>Un autre filtre, et peut-être votre prochain coup de cœur.</p>
          <Button onClick={() => setParams({})}>
            Voir toute la collection <ArrowRight size={16} />
          </Button>
        </div>
      )}
      <Benefits compact />
    </div>
  );
}
function SearchIllustration() {
  return <SlidersHorizontal size={38} strokeWidth={1} />;
}

export function Product() {
  const { id } = useParams();
  const { products, addToCart, favorites, toggleFavorite } = useShop();
  const product = products.find((p) => p.id === id);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    setSize(product?.sizes.length === 1 ? product.sizes[0] : '');
    setColor(product?.colors[0]?.name || '');
    setError('');
  }, [id, product?.id]);
  if (!product) return <NotFound />;
  const stock = size ? product.inventory?.find((v) => v.key === `${size}:${color}`)?.stock : null;
  const related = products.filter((p) => p.id !== id && p.gender === product.gender).slice(0, 4);
  return (
    <div className="product-page">
      <div className="breadcrumb">
        <Link to="/">Accueil</Link>
        <span>/</span>
        <Link to={`/boutique?genre=${product.gender}`}>{product.gender}</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>
      <div className="product-detail">
        <div className="detail-image">
          <img
            src={product.image}
            alt={product.name}
            style={{ objectPosition: product.position }}
          />
          {product.badge && <span className="product-badge">{product.badge}</span>}
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{product.category} · COLLECTION MAISON</span>
          <h1>{product.name}</h1>
          <div className="detail-price">
            {money(product.price)}{' '}
            {product.originalPrice && (
              <span className="old-price">{money(product.originalPrice)}</span>
            )}
            <small>TTC</small>
          </div>
          <p className="product-description">{product.description}</p>
          <div className="variant-group">
            <span>
              Couleur : <strong>{color}</strong>
            </span>
            <div className="detail-swatches">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  className={`swatch ${color === c.name ? 'selected' : ''}`}
                  aria-label={c.name}
                  aria-pressed={color === c.name}
                  style={{ '--swatch': c.hex }}
                  onClick={() => setColor(c.name)}
                />
              ))}
            </div>
          </div>
          <div className="variant-group">
            <div className="size-heading">
              <span>
                Taille : <strong>{size || 'à sélectionner'}</strong>
              </span>
              <Link to="/aide#tailles">
                Guide des tailles <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="size-options">
              {product.sizes.map((s) => {
                const out = product.inventory?.find((v) => v.key === `${s}:${color}`)?.stock === 0;
                return (
                  <button
                    key={s}
                    disabled={out}
                    className={size === s ? 'selected' : ''}
                    aria-pressed={size === s}
                    onClick={() => {
                      setSize(s);
                      setError('');
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="add-row">
            <Button
              disabled={stock === 0}
              onClick={() => {
                if (!size) {
                  setError('Choisissez votre taille pour ajouter cette pièce.');
                  return;
                }
                addToCart(product, size, color);
              }}
            >
              {stock === 0 ? 'Indisponible' : 'Ajouter à mon panier'}
              <ShoppingBag size={18} />
            </Button>
            <IconButton
              label={favorites.includes(id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              className={favorites.includes(id) ? 'is-favorite' : ''}
              onClick={() => toggleFavorite(id)}
              aria-pressed={favorites.includes(id)}
            >
              <Heart
                size={21}
                fill={favorites.includes(id) ? 'currentColor' : 'none'}
                strokeWidth={1.5}
              />
            </IconButton>
          </div>
          <div className="product-reassurance">
            <span>
              <Truck size={17} /> Livraison offerte dès 100 €
            </span>
            <span>
              <RotateCcw size={17} /> Retours sous 30 jours
            </span>
          </div>
          <Accordion title="Matières & entretien" open>
            <p>{product.material}.</p>
            <p>
              Lavage délicat à 30 °C, à l’envers. Séchage à l’air libre. Pour les pièces en laine et
              en cuir, privilégiez un entretien professionnel.
            </p>
          </Accordion>
          <Accordion title="Coupe & tailles">
            <p>
              Coupe régulière. Prenez votre taille habituelle. Entre deux tailles, choisissez la
              plus grande pour un porté plus ample. Consultez notre guide pour les mesures
              détaillées.
            </p>
          </Accordion>
          <Accordion title="Livraison & retours">
            <p>
              Livraison en France, Belgique et Luxembourg. Frais de port : 5,90 €, offerts dès 100
              €. Délai indicatif : 3 à 5 jours ouvrés après confirmation. Retours sous 30 jours. Les
              conditions présentées sont celles de la boutique de démonstration.
            </p>
          </Accordion>
          <p className="photo-note">
            Photos d’illustration. La sélection de couleur n’altère pas la photographie.
          </p>
        </div>
      </div>
      {related.length > 0 && (
        <section className="related-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LA BELLE ASSOCIATION</span>
              <h2>Dans le même esprit.</h2>
            </div>
            <Link className="arrow-link" to="/boutique">
              Tout voir <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function Checkout() {
  const { items, subtotal, shipping, total, demo, offline, user, setCart, setPanel } = useShop();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const request = useRef({ fingerprint: '', key: '' });
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const body = {
      customer: {
        name: form.name,
        email: form.email,
        address: form.address,
        city: form.city,
        postalCode: form.postalCode,
        country: form.country,
      },
      items: items.map(({ productId, size, color, quantity }) => ({
        productId,
        size,
        color,
        quantity,
      })),
      consent: form.consent === 'on',
    };
    const fingerprint = JSON.stringify(body);
    if (request.current.fingerprint !== fingerprint)
      request.current = { fingerprint, key: crypto.randomUUID() };
    try {
      const result = await api('/orders', {
        method: 'POST',
        body: JSON.stringify({ ...body, idempotencyKey: request.current.key }),
      });
      setOrder(result);
      setCart([]);
    } catch (e) {
      setError(e.message || 'La connexion a été interrompue. Réessayez avec le même panier.');
    } finally {
      setBusy(false);
    }
  }
  if (order)
    return (
      <div className="confirmation">
        <span className="confirmation-icon">
          <CheckCircle2 size={46} strokeWidth={1.2} />
        </span>
        <span className="eyebrow">
          {order.demo ? 'SIMULATION TERMINÉE' : 'MERCI POUR VOTRE CONFIANCE'}
        </span>
        <h1>{order.demo ? 'Tout est prêt pour la suite.' : 'Votre commande est confirmée.'}</h1>
        <p>
          {order.demo
            ? 'Ceci est une commande de démonstration. Aucun paiement n’a été effectué, aucune livraison ne sera réalisée et vos coordonnées n’ont pas été enregistrées.'
            : 'Votre commande a été enregistrée. Le règlement se fera à la livraison. Conservez votre référence pour toute demande.'}
        </p>
        <div className="order-ticket">
          <span>
            Référence <strong>{order.reference}</strong>
          </span>
          <span>
            Total TTC <strong>{money(order.total)}</strong>
          </span>
          <span>
            Paiement <strong>{order.demo ? 'Simulation' : 'À la livraison'}</strong>
          </span>
        </div>
        <Button to="/boutique">
          Revenir à la collection <ArrowRight size={18} />
        </Button>
      </div>
    );
  if (!items.length)
    return (
      <div className="empty-state page-empty">
        <ShoppingBag size={44} strokeWidth={1} />
        <h1>Votre panier attend ses essentiels.</h1>
        <p>Ajoutez une pièce pour commencer votre commande.</p>
        <Button to="/boutique">
          Découvrir la collection <ArrowRight size={18} />
        </Button>
      </div>
    );
  return (
    <div className="checkout-page">
      <div className="breadcrumb">
        <Link to="/">Accueil</Link>
        <span>/</span>
        <span>Votre commande</span>
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">LES DERNIERS DÉTAILS</span>
          <h1>Presque chez vous.</h1>
        </div>
        <span className="checkout-trust">
          <ShieldCheck size={17} /> Vos informations restent privées
        </span>
      </div>
      {(demo || offline) && (
        <div className="demo-notice">
          <Leaf size={18} />
          <span>
            <strong>Vous explorez notre boutique de démonstration.</strong> Cette commande sera une
            simulation, sans paiement ni livraison. Utilisez des coordonnées fictives.
          </span>
        </div>
      )}
      <div className="checkout-layout">
        <form onSubmit={submit} className="checkout-form">
          <div className="checkout-step">
            <span>01</span>
            <h2>Vos coordonnées</h2>
            {!user && (
              <button type="button" className="text-button" onClick={() => setPanel('account')}>
                Déjà un compte ?
              </button>
            )}
          </div>
          <label>
            Nom complet
            <input
              name="name"
              autoComplete="name"
              defaultValue={user?.name || ''}
              minLength={2}
              maxLength={100}
              required
              placeholder="Camille Dupont"
            />
          </label>
          <label>
            Adresse e-mail
            <input
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={user?.email || ''}
              maxLength={254}
              required
              placeholder="camille@exemple.fr"
            />
          </label>
          <div className="checkout-step">
            <span>02</span>
            <h2>Votre adresse de livraison</h2>
          </div>
          <label>
            Adresse
            <input
              name="address"
              autoComplete="street-address"
              minLength={5}
              maxLength={200}
              required
              placeholder="12 rue des Fleurs"
            />
          </label>
          <div className="field-row">
            <label>
              Code postal
              <input
                name="postalCode"
                autoComplete="postal-code"
                minLength={3}
                maxLength={16}
                required
                placeholder="75002"
              />
            </label>
            <label>
              Ville
              <input
                name="city"
                autoComplete="address-level2"
                minLength={2}
                maxLength={100}
                required
                placeholder="Paris"
              />
            </label>
          </div>
          <label>
            Pays
            <select name="country" autoComplete="country-name">
              <option>France</option>
              <option>Belgique</option>
              <option>Luxembourg</option>
            </select>
          </label>
          <div className="checkout-step">
            <span>03</span>
            <h2>Le paiement, simplement</h2>
          </div>
          <div className="payment-option">
            <span className="radio-checked" />
            <div>
              <strong>{demo ? 'Simulation de commande' : 'Paiement à la livraison'}</strong>
              <p>
                {demo
                  ? 'Aucune carte bancaire demandée. Aucun montant débité.'
                  : 'Vous réglez votre commande lors de sa réception. Aucun débit en ligne.'}
              </p>
            </div>
            <ShieldCheck size={23} strokeWidth={1.3} />
          </div>
          <label className="consent checkout-consent">
            <input name="consent" type="checkbox" required />
            <span>
              J’ai lu et j’accepte les{' '}
              <Link to="/informations" target="_blank">
                conditions de vente
              </Link>{' '}
              et la{' '}
              <Link to="/informations#confidentialite" target="_blank">
                politique de confidentialité
              </Link>
              .
            </span>
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button className="checkout-submit" disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle size={18} className="spin" /> Enregistrement…
              </>
            ) : (
              <>
                {demo ? 'Simuler ma commande' : 'Confirmer ma commande'} · {money(total)}
                <ArrowRight size={18} />
              </>
            )}
          </Button>
          <p className="checkout-fineprint">
            {demo
              ? 'Vos coordonnées ne sont pas enregistrées en mode démonstration.'
              : 'Les prix et les stocks sont vérifiés au moment de la confirmation.'}
          </p>
        </form>
        <aside className="checkout-summary">
          <div className="summary-heading">
            <h2>Votre sélection</h2>
            <button className="text-button" onClick={() => setPanel('cart')}>
              Modifier
            </button>
          </div>
          {items.map((item) => (
            <CartLine key={`${item.productId}-${item.size}-${item.color}`} item={item} readonly />
          ))}
          <div className="cart-summary">
            <p>
              <span>Sous-total</span>
              <span>{money(subtotal)}</span>
            </p>
            <p>
              <span>Livraison</span>
              <span>{shipping ? money(shipping) : 'Offerte'}</span>
            </p>
            <p className="total-line">
              <strong>Total TTC</strong>
              <strong>{money(total)}</strong>
            </p>
          </div>
          <div className="summary-benefits">
            <span>
              <Truck size={17} /> Livraison estimée : 3 à 5 jours ouvrés
            </span>
            <span>
              <RotateCcw size={17} /> Retours sous 30 jours
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function Maison() {
  return (
    <>
      <section className="about-hero">
        <div>
          <span className="eyebrow">BIENVENUE CHEZ NOUS</span>
          <h1>
            Une certaine idée
            <br />
            de <em>l’essentiel.</em>
          </h1>
          <p>
            Moins de bruit. Plus de sens. Une Maison ouverte à celles et ceux qui veulent s’habiller
            avec simplicité, sans jamais renoncer à leur singularité.
          </p>
          <Link className="arrow-link" to="/boutique">
            Trouver mes essentiels <ArrowUpRight size={18} />
          </Link>
        </div>
        <img src={images.story} alt="Une boutique baignée de lumière naturelle" />
      </section>
      <section className="about-text section">
        <span className="eyebrow">L’ESPRIT MAISON</span>
        <h2>
          Des vêtements pour vivre,
          <br />
          <em>tout simplement.</em>
        </h2>
        <p>
          MAISON est née d’une envie : imaginer un vestiaire où chaque pièce trouve naturellement sa
          place. Des couleurs qui s’accordent, des coupes que l’on retrouve, des vêtements que l’on
          porte et que l’on reporte.
        </p>
        <p>
          Notre collection de démonstration explore cette idée à travers des essentiels féminins et
          masculins. Elle donne vie à une boutique pensée pour être aussi agréable à parcourir
          qu’une belle garde-robe à composer.
        </p>
      </section>
      <section className="values-section section" id="matieres">
        {[
          {
            number: '01',
            title: 'La matière, d’abord.',
            text: 'Coton, lin, laine : chaque fiche précise la composition de la pièce. Le bon choix commence par une information claire.',
          },
          {
            number: '02',
            title: 'Le temps comme allié.',
            text: 'Des coupes simples, une palette naturelle et des détails discrets. Notre inspiration : les vêtements que l’on aime retrouver.',
          },
          {
            number: '03',
            title: 'Vous, au centre.',
            text: 'Un guide des tailles, un panier facile à retrouver et un parcours de commande sans détour. Tout simplement.',
          },
        ].map((v) => (
          <article key={v.number}>
            <span>{v.number}</span>
            <h3>{v.title}</h3>
            <p>{v.text}</p>
          </article>
        ))}
      </section>
      <Newsletter />
    </>
  );
}

export function Help() {
  return (
    <div className="information-page">
      <div className="page-intro">
        <span className="eyebrow">À VOS CÔTÉS</span>
        <h1>Un peu d’aide ?</h1>
        <p>Les réponses aux petites questions qui font la différence.</p>
      </div>
      <div className="help-layout">
        <aside>
          <a href="#livraison">Livraison</a>
          <a href="#retours">Retours</a>
          <a href="#tailles">Guide des tailles</a>
          <a href="#contact">Nous contacter</a>
        </aside>
        <div>
          <section id="livraison">
            <h2>La livraison</h2>
            <Accordion title="Où livrez-vous ?" open>
              <p>
                La boutique prévoit des livraisons en France métropolitaine, en Belgique et au
                Luxembourg. En mode démonstration, aucune commande n’est expédiée.
              </p>
            </Accordion>
            <Accordion title="Quels sont les frais et délais ?">
              <p>
                La livraison standard est proposée à 5,90 € et offerte dès 100 € d’achat. Délai
                indicatif : 3 à 5 jours ouvrés après confirmation. Ces conditions doivent être
                validées par le commerçant avant l’ouverture réelle.
              </p>
            </Accordion>
            <Accordion title="Comment payer ma commande ?">
              <p>
                La boutique propose le paiement à la livraison lorsque les commandes sont activées.
                Le mode démonstration ne demande aucune carte et ne débite aucun montant.
              </p>
            </Accordion>
          </section>
          <section id="retours">
            <h2>Changer d’avis, c’est permis.</h2>
            <p>
              Notre politique de démonstration prévoit un retour sous 30 jours pour les articles non
              portés, non lavés et munis de leur étiquette. Contactez la boutique avec votre
              référence avant tout envoi. L’adresse et les modalités de retour seront précisées par
              le commerçant lors de la mise en service.
            </p>
          </section>
          <section id="tailles">
            <h2>Trouver la bonne taille.</h2>
            <p>
              Mesures du corps indicatives, en centimètres. Mesurez sans serrer, sur des vêtements
              légers. Pour un porté ample, choisissez la taille supérieure.
            </p>
            <div className="size-table-wrap">
              <table>
                <caption>Guide indicatif de la collection</caption>
                <thead>
                  <tr>
                    <th>Taille</th>
                    <th>Poitrine</th>
                    <th>Taille</th>
                    <th>Hanches</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['XS', '80–84', '60–64', '86–90'],
                    ['S', '85–89', '65–69', '91–95'],
                    ['M', '90–94', '70–74', '96–100'],
                    ['L', '95–101', '75–81', '101–107'],
                    ['XL', '102–108', '82–88', '108–114'],
                  ].map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, i) => (
                        <td key={i}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted">
              Les mesures de démonstration sont à adapter à vos fournisseurs avant la vente.
            </p>
          </section>
          <section id="contact">
            <h2>On est là pour vous.</h2>
            <p>
              Cette boutique est un projet de démonstration. Aucun service client n’est encore
              ouvert. Les coordonnées du commerçant seront affichées ici avant l’ouverture des
              commandes réelles.
            </p>
            <Button to="/boutique">
              Revenir à la collection <ArrowRight size={17} />
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}

export function Information() {
  return (
    <div className="information-page legal-page">
      <div className="page-intro">
        <span className="eyebrow">EN TOUTE TRANSPARENCE</span>
        <h1>Les informations utiles.</h1>
        <p>Conditions de démonstration et fonctionnement de la boutique.</p>
      </div>
      <section>
        <h2>Une boutique de démonstration</h2>
        <p>
          MAISON est une application e-commerce de démonstration. Les photographies sont des
          illustrations issues d’Unsplash ; les références, compositions et prix servent à présenter
          le fonctionnement de l’application. Aucune certification environnementale n’est
          revendiquée.
        </p>
        <p>
          En mode démonstration, les commandes sont simulées : aucun paiement, aucune expédition et
          aucun enregistrement des coordonnées de livraison. Les informations légales du commerçant,
          son adresse, ses coordonnées et ses conditions définitives devront être ajoutées avant
          toute ouverture commerciale.
        </p>
      </section>
      <section>
        <h2>Commandes et paiement</h2>
        <p>
          Les prix sont affichés en euros, TTC, avec le détail des frais de livraison avant
          confirmation. La livraison est offerte dès 100 € ; sinon, son montant est de 5,90 €. Le
          seul moyen de paiement prévu est le règlement à la livraison. Aucun paiement par carte
          bancaire n’est intégré.
        </p>
        <p>
          Les commandes réelles nécessitent l’activation explicite de la boutique par son
          propriétaire. Les disponibilités et les prix sont recalculés côté serveur au moment de la
          commande. Les comptes connectés peuvent retrouver leurs commandes dans leur espace
          personnel. Les invités conservent leur référence à l’écran ; aucun e-mail de confirmation
          automatique n’est envoyé.
        </p>
      </section>
      <section id="confidentialite">
        <h2>Vos données, simplement.</h2>
        <p>
          Le panier et les favoris sont enregistrés localement dans votre navigateur pour faciliter
          votre visite. Vous pouvez les effacer depuis les réglages du navigateur. Aucun outil
          publicitaire ni analytique n’est installé.
        </p>
        <p>
          Lorsque la base de données est configurée, les comptes et les abonnements à la newsletter
          sont enregistrés dans MongoDB. Lorsque les commandes réelles sont activées, leurs
          coordonnées et articles sont également enregistrés. Les mots de passe sont hachés. Un
          cookie de session sécurisé et inaccessible à JavaScript est utilisé pour la connexion. La
          newsletter enregistre le consentement ; l’envoi des e-mails reste à configurer.
        </p>
        <p>
          Les photographies sont servies avec la boutique. Les polices sont chargées depuis Google
          Fonts, qui reçoit les informations techniques habituelles de connexion. Aucun autre
          partage de données n’est prévu par l’application.
        </p>
        <p>
          Le responsable de traitement, ses coordonnées, les durées de conservation ainsi que les
          modalités d’exercice des droits et de désinscription devront être renseignés par le
          commerçant avant la mise en service.
        </p>
      </section>
      <section>
        <h2>Livraisons et retours</h2>
        <p>
          Les zones proposées sont la France métropolitaine, la Belgique et le Luxembourg. La
          politique de démonstration prévoit des retours sous 30 jours. Les conditions commerciales
          finales doivent être validées et publiées par le commerçant avant l’ouverture.
        </p>
        <Link className="arrow-link" to="/aide">
          Consulter l’aide <ArrowUpRight size={17} />
        </Link>
      </section>
    </div>
  );
}

export function Account() {
  const { user, setPanel } = useShop();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    setError('');
    api('/orders')
      .then((data) => {
        if (alive) setOrders(data.orders);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user]);
  return (
    <div className="account-page">
      <span className="eyebrow">VOTRE ESPACE MAISON</span>
      <h1>{user ? `Bonjour, ${user.name}.` : 'Comme à la maison.'}</h1>
      {user ? (
        <>
          <p>Retrouvez ici vos dernières commandes.</p>
          {loading ? (
            <p role="status">
              <LoaderCircle className="spin" size={20} /> Chargement des commandes…
            </p>
          ) : error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : orders.length ? (
            <div className="order-history">
              {orders.map((order) => (
                <article key={order.reference}>
                  <div>
                    <strong>{order.reference}</strong>
                    <span>
                      {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(
                        new Date(order.createdAt),
                      )}
                    </span>
                    <span>Confirmée · Paiement à la livraison</span>
                    <strong>{money(order.total)}</strong>
                  </div>
                  {order.items.map((item, index) => (
                    <p key={index}>
                      {item.name} · {item.color} · {item.size} × {item.quantity}
                    </p>
                  ))}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ShoppingBag size={38} strokeWidth={1} />
              <h2>Votre histoire commence ici.</h2>
              <p>Vos commandes apparaîtront dès votre premier achat connecté.</p>
              <Button to="/boutique">
                Découvrir la collection <ArrowRight size={17} />
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <p>Connectez-vous pour retrouver vos commandes et vos informations.</p>
          <Button onClick={() => setPanel('account')}>
            Me connecter <ArrowRight size={17} />
          </Button>
          <p className="muted">
            Les comptes nécessitent une connexion MongoDB. Le panier reste accessible sans compte.
          </p>
        </>
      )}
    </div>
  );
}

export function NotFound() {
  return (
    <div className="empty-state page-empty">
      <span className="eyebrow">404 · UN PETIT DÉTOUR</span>
      <h1>Cette page a filé.</h1>
      <p>Il reste de belles pièces à découvrir.</p>
      <Button to="/boutique">
        Retrouver la collection <ArrowRight size={17} />
      </Button>
    </div>
  );
}
