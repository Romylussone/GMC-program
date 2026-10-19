import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  UserRound,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Minus,
  Plus,
  Trash2,
  Check,
  Truck,
  RotateCcw,
  ShieldCheck,
  Leaf,
  LoaderCircle,
  ChevronDown,
} from 'lucide-react';
import { useShop, api } from './store.jsx';
import { money, shippingThreshold } from '../shared/catalog.js';

export function IconButton({ label, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
export function Button({ to, children, secondary, className = '', ...props }) {
  const classes = `button ${secondary ? 'button-secondary' : ''} ${className}`;
  return to ? (
    <Link to={to} className={classes} {...props}>
      {children}
    </Link>
  ) : (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
export function Brand({ footer = false }) {
  return (
    <Link to="/" className={`brand ${footer ? 'brand-footer' : ''}`} aria-label="MAISON, accueil">
      MAISON<span>LE STYLE, SIMPLEMENT.</span>
    </Link>
  );
}

export function Header() {
  const { count, favorites, setPanel, user } = useShop();
  return (
    <>
      <div className="announcement">
        <span>Un peu de nous, beaucoup de vous.</span>
        <span>
          Livraison offerte dès 100 € <ArrowRight size={12} />
        </span>
        <Link to="/aide">Livraison & retours</Link>
      </div>
      <header className="header">
        <div className="header-inner">
          <IconButton
            label="Ouvrir le menu"
            className="mobile-menu"
            onClick={() => setPanel('menu')}
          >
            <Menu size={23} />
          </IconButton>
          <Brand />
          <nav aria-label="Navigation principale" className="main-nav">
            <NavLink to="/" end>
              Accueil
            </NavLink>
            <Link to="/boutique?nouveautes=oui">
              Nouveautés
              <span className="nav-dot" />
            </Link>
            <Link to="/boutique?genre=Femme">Femme</Link>
            <Link to="/boutique?genre=Homme">Homme</Link>
            <Link to="/boutique?genre=Accessoires">Accessoires</Link>
            <NavLink to="/maison">La Maison</NavLink>
          </nav>
          <div className="header-actions">
            <IconButton label="Rechercher" onClick={() => setPanel('search')}>
              <Search size={21} strokeWidth={1.5} />
            </IconButton>
            <IconButton
              label={user ? 'Mon compte' : 'Se connecter'}
              className="account-icon"
              onClick={() => setPanel('account')}
            >
              <UserRound size={21} strokeWidth={1.5} />
              {user && <span className="user-dot" />}
            </IconButton>
            <IconButton
              label={`Mes favoris (${favorites.length})`}
              className="favorites-icon"
              onClick={() => setPanel('favorites')}
            >
              <Heart size={21} strokeWidth={1.5} />
              {favorites.length > 0 && <span className="tiny-count">{favorites.length}</span>}
            </IconButton>
            <span className="action-divider" />
            <IconButton
              label={`Ouvrir mon panier (${count} articles)`}
              className="bag-button"
              onClick={() => setPanel('cart')}
            >
              <ShoppingBag size={21} strokeWidth={1.5} />
              <span className="bag-count">{count}</span>
            </IconButton>
          </div>
        </div>
      </header>
    </>
  );
}

export function ProductCard({ product, index = 0 }) {
  const { favorites, toggleFavorite } = useShop();
  const [color, setColor] = useState(0);
  return (
    <article className="product-card" style={{ '--delay': `${index * 70}ms` }}>
      <div className="product-image-wrap">
        <Link to={`/produit/${product.id}`} className="product-photo">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            style={{ objectPosition: product.position }}
          />
        </Link>
        {product.badge && (
          <span className={`product-badge ${product.originalPrice ? 'sale-badge' : ''}`}>
            {product.badge}
          </span>
        )}
        <IconButton
          label={
            favorites.includes(product.id)
              ? `Retirer ${product.name} des favoris`
              : `Ajouter ${product.name} aux favoris`
          }
          className={`favorite-button ${favorites.includes(product.id) ? 'is-favorite' : ''}`}
          aria-pressed={favorites.includes(product.id)}
          onClick={() => toggleFavorite(product.id)}
        >
          <Heart
            size={18}
            strokeWidth={1.5}
            fill={favorites.includes(product.id) ? 'currentColor' : 'none'}
          />
        </IconButton>
        <Link to={`/produit/${product.id}`} className="quick-add">
          Découvrir la pièce <Plus size={16} />
        </Link>
      </div>
      <div className="product-meta">
        <span>
          {product.category} · {product.gender}
        </span>
        <div>
          <Link to={`/produit/${product.id}`}>{product.name}</Link>
          <span className="product-price">{money(product.price)}</span>
        </div>
      </div>
      <div className="product-bottom">
        <div className="swatches">
          {product.colors.map((c, i) => (
            <button
              key={c.name}
              type="button"
              aria-label={`Aperçu ${c.name}`}
              title={c.name}
              aria-pressed={color === i}
              onClick={() => setColor(i)}
              className={`swatch ${i === color ? 'selected' : ''}`}
              style={{ '--swatch': c.hex }}
            />
          ))}
          <span className="color-label">{product.colors[color]?.name}</span>
        </div>
        {product.originalPrice && <span className="old-price">{money(product.originalPrice)}</span>}
      </div>
    </article>
  );
}

export function Benefits({ compact = false }) {
  const entries = [
    { icon: Truck, title: 'La livraison, offerte', text: 'Dès 100 € d’achat' },
    { icon: RotateCcw, title: 'Le droit de changer d’avis', text: 'Retours sous 30 jours' },
    { icon: ShieldCheck, title: 'En toute confiance', text: 'Paiement à la livraison' },
    { icon: Leaf, title: 'Des pièces qui durent', text: 'Des matières sélectionnées' },
  ];
  return (
    <div className={`benefits ${compact ? 'compact-benefits' : ''}`}>
      {entries.map(({ icon: Icon, title, text }) => (
        <div key={title}>
          <Icon size={27} strokeWidth={1.2} />
          <div>
            <strong>{title}</strong>
            <span>{text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const result = await api('/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email, consent }),
      });
      setMessage(
        result.demo
          ? 'Merci ! Inscription simulée : votre adresse n’a pas été enregistrée.'
          : 'Bienvenue dans la Maison ! Votre inscription est enregistrée.',
      );
      setEmail('');
      setConsent(false);
    } catch (error) {
      setMessage(
        error.name === 'TypeError' ? 'Connexion indisponible. Réessayez plus tard.' : error.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="newsletter">
      <div>
        <span className="eyebrow">ON GARDE LE LIEN ?</span>
        <h2>
          Un peu de Maison
          <br />
          dans votre boîte mail.
        </h2>
        <p>
          Les nouvelles collections, nos inspirations et quelques attentions.
          <br className="desktop-break" /> Juste l’essentiel, promis.
        </p>
      </div>
      <form onSubmit={submit} className="newsletter-form">
        <label className="sr-only" htmlFor="newsletter-email">
          Votre adresse e-mail
        </label>
        <div className="email-input">
          <input
            id="newsletter-email"
            type="email"
            placeholder="Votre adresse e-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button aria-label="S’inscrire à la newsletter" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={22} /> : <ArrowRight size={23} />}
          </button>
        </div>
        <label className="consent">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          J’accepte de recevoir les actualités de MAISON.
        </label>
        <p className="form-message" role="status">
          {message ||
            'Désinscription sur simple demande. Consultez notre politique de confidentialité.'}
        </p>
      </form>
    </section>
  );
}

export function Footer() {
  const { demo, offline } = useShop();
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Brand footer />
          <p>
            Des essentiels bien pensés.
            <br />
            Une allure qui vous ressemble.
          </p>
          <span className="footer-note">Imaginé à Paris. Porté à votre façon.</span>
        </div>
        <div>
          <h3>La collection</h3>
          <Link to="/boutique?nouveautes=oui">Les nouveautés</Link>
          <Link to="/boutique?genre=Femme">Pour elle</Link>
          <Link to="/boutique?genre=Homme">Pour lui</Link>
          <Link to="/boutique?genre=Accessoires">Les accessoires</Link>
        </div>
        <div>
          <h3>À vos côtés</h3>
          <Link to="/aide">Livraison & retours</Link>
          <Link to="/aide#tailles">Guide des tailles</Link>
          <Link to="/compte">Mon compte & commandes</Link>
          <Link to="/aide#contact">Nous contacter</Link>
        </div>
        <div>
          <h3>L’esprit Maison</h3>
          <Link to="/maison">Notre histoire</Link>
          <Link to="/maison#matieres">Nos matières</Link>
          <Link to="/informations">Informations & conditions</Link>
          <Link to="/informations#confidentialite">Confidentialité</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} MAISON. Le style, simplement.</span>
        <span>{demo || offline ? 'Boutique de démonstration' : 'France · EUR €'}</span>
        <span className="footer-signoff">
          Moins de superflu. Plus d’essentiel. <ArrowUpRight size={14} />
        </span>
      </div>
    </footer>
  );
}

export function Modal({ title, children, onClose, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const element = ref.current;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
      aria-label={title}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <IconButton label="Fermer" onClick={onClose}>
          <X size={23} strokeWidth={1.5} />
        </IconButton>
      </div>
      {children}
    </dialog>
  );
}

export function CartLine({ item, readonly = false }) {
  const { changeQuantity, removeItem, setPanel } = useShop();
  return (
    <div className="cart-line">
      <Link to={`/produit/${item.productId}`} onClick={() => setPanel(null)}>
        <img src={item.product.image} alt={item.product.name} />
      </Link>
      <div className="cart-line-info">
        <Link to={`/produit/${item.productId}`} onClick={() => setPanel(null)}>
          {item.product.name}
        </Link>
        <span>
          {item.color} / {item.size}
        </span>
        <strong>{money(item.product.price * item.quantity)}</strong>
        {readonly ? (
          <small>Quantité : {item.quantity}</small>
        ) : (
          <div className="cart-line-controls">
            <div className="quantity-control">
              <IconButton
                label={`Diminuer la quantité de ${item.product.name}`}
                onClick={() => changeQuantity(item, -1)}
              >
                <Minus size={13} />
              </IconButton>
              <span>{item.quantity}</span>
              <IconButton
                label={`Augmenter la quantité de ${item.product.name}`}
                onClick={() => changeQuantity(item, 1)}
              >
                <Plus size={13} />
              </IconButton>
            </div>
            <IconButton label={`Supprimer ${item.product.name}`} onClick={() => removeItem(item)}>
              <Trash2 size={16} strokeWidth={1.5} />
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
}

export function Panels() {
  const shop = useShop();
  const {
    panel,
    setPanel,
    items,
    subtotal,
    shipping,
    total,
    count,
    products,
    favorites,
    user,
    setUser,
  } = shop;
  const [query, setQuery] = useState('');
  const [register, setRegister] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    setError('');
  }, [panel, register]);
  const close = () => setPanel(null);
  async function authenticate(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const data = await api(`/auth/${register ? 'register' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setUser(data.user);
      close();
      shop.notify(`Bienvenue ${data.user.name} !`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!panel) return null;
  if (panel === 'cart')
    return (
      <Modal title={`Votre panier (${count})`} onClose={close} className="drawer">
        <div className="drawer-content">
          {!items.length ? (
            <div className="empty-state">
              <ShoppingBag size={44} strokeWidth={1} />
              <h3>Tout commence par une belle pièce.</h3>
              <p>Votre panier attend vos prochains coups de cœur.</p>
              <Button to="/boutique" onClick={close}>
                Découvrir la collection <ArrowRight size={17} />
              </Button>
            </div>
          ) : (
            <>
              <div className="shipping-progress">
                <p>
                  {subtotal >= shippingThreshold ? (
                    <>
                      <Check size={15} /> Votre livraison est offerte.
                    </>
                  ) : (
                    <>
                      Encore <strong>{money(shippingThreshold - subtotal)}</strong> pour la
                      livraison offerte.
                    </>
                  )}
                </p>
                <div>
                  <span
                    style={{ width: `${Math.min(100, (subtotal / shippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="cart-lines">
                {items.map((item) => (
                  <CartLine key={`${item.productId}-${item.size}-${item.color}`} item={item} />
                ))}
              </div>
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
                  <strong>Total</strong>
                  <strong>{money(total)}</strong>
                </p>
                <small>Prix TTC. Paiement à la livraison.</small>
                <Button to="/commande" onClick={close}>
                  Passer ma commande <ArrowRight size={18} />
                </Button>
                <button className="text-button" onClick={close}>
                  Continuer ma visite
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    );
  if (panel === 'favorites')
    return (
      <Modal title={`Vos coups de cœur (${favorites.length})`} onClose={close} className="drawer">
        <div className="drawer-content">
          {favorites.length ? (
            <div className="favorites-grid">
              {products
                .filter((p) => favorites.includes(p.id))
                .map((p) => (
                  <div
                    key={p.id}
                    onClick={(e) => {
                      if (e.target.closest('a')) close();
                    }}
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
            </div>
          ) : (
            <div className="empty-state">
              <Heart size={44} strokeWidth={1} />
              <h3>À garder tout près.</h3>
              <p>Un clic sur le cœur pour retrouver ici vos pièces préférées.</p>
              <Button to="/boutique" onClick={close}>
                Trouver mon coup de cœur <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </Modal>
    );
  if (panel === 'search') {
    const results = products.filter((p) =>
      `${p.name} ${p.category} ${p.gender} ${p.material}`
        .toLocaleLowerCase('fr')
        .includes(query.toLocaleLowerCase('fr')),
    );
    return (
      <Modal title="Une pièce en tête ?" onClose={close} className="search-modal">
        <form
          className="search-field"
          onSubmit={(e) => {
            e.preventDefault();
            close();
            navigate(`/boutique?q=${encodeURIComponent(query)}`);
          }}
        >
          <Search size={22} />
          <input
            aria-label="Rechercher dans la collection"
            placeholder="Une maille, une chemise, un coup de cœur…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button aria-label="Lancer la recherche">
            <ArrowRight size={23} />
          </button>
        </form>
        <p className="search-caption">
          {query
            ? `${results.length} pièce${results.length > 1 ? 's' : ''} trouvée${results.length > 1 ? 's' : ''}`
            : 'NOS ESSENTIELS DU MOMENT'}
        </p>
        <div className="search-results">
          {results.slice(0, 5).map((p) => (
            <Link key={p.id} to={`/produit/${p.id}`} onClick={close}>
              <img src={p.image} alt="" />
              <div>
                <strong>{p.name}</strong>
                <span>
                  {p.category} · {money(p.price)}
                </span>
              </div>
              <ArrowUpRight size={18} />
            </Link>
          ))}
          {!results.length && (
            <p className="muted">Aucune pièce trouvée. Essayez « maille » ou « manteau ».</p>
          )}
        </div>
      </Modal>
    );
  }
  if (panel === 'account')
    return (
      <Modal
        title={
          user
            ? `Bonjour, ${user.name}`
            : register
              ? 'Bienvenue dans la Maison'
              : 'Heureux de vous retrouver'
        }
        onClose={close}
        className="account-modal"
      >
        {user ? (
          <div className="account-content">
            <p>{user.email}</p>
            <Button to="/compte" onClick={close}>
              Mes commandes <ArrowRight size={17} />
            </Button>
            <button
              className="text-button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api('/auth/logout', { method: 'POST' });
                  setUser(null);
                  close();
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Se déconnecter
            </button>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={authenticate} className="account-form">
            <p>Vos essentiels, vos favoris, votre Maison.</p>
            {register && (
              <label>
                Votre nom
                <input name="name" autoComplete="name" minLength={2} maxLength={100} required />
              </label>
            )}
            <label>
              Adresse e-mail
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Mot de passe
              <input
                name="password"
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                minLength={10}
                maxLength={128}
                required
                placeholder={register ? '10 caractères minimum' : ''}
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <Button disabled={busy}>
              {busy ? (
                <LoaderCircle size={18} className="spin" />
              ) : register ? (
                'Créer mon compte'
              ) : (
                'Me connecter'
              )}
              <ArrowRight size={17} />
            </Button>
            <button type="button" className="text-button" onClick={() => setRegister(!register)}>
              {register ? 'J’ai déjà un compte' : 'Nouveau ici ? Créer mon compte'}
            </button>
          </form>
        )}
      </Modal>
    );
  if (panel === 'menu')
    return (
      <Modal title="La collection" onClose={close} className="drawer menu-drawer">
        <nav>
          {[
            ['Accueil', '/'],
            ['Nouveautés', '/boutique?nouveautes=oui'],
            ['Femme', '/boutique?genre=Femme'],
            ['Homme', '/boutique?genre=Homme'],
            ['Accessoires', '/boutique?genre=Accessoires'],
            ['La Maison', '/maison'],
            ['Mon compte', '/compte'],
          ].map(([label, to]) => (
            <Link key={label} to={to} onClick={close}>
              {label}
              <ArrowUpRight size={21} />
            </Link>
          ))}
        </nav>
        <p>Le style, simplement.</p>
      </Modal>
    );
  return null;
}

export function Accordion({ title, children, open = false }) {
  return (
    <details className="accordion" open={open || undefined}>
      <summary>
        {title}
        <ChevronDown size={17} />
      </summary>
      <div>{children}</div>
    </details>
  );
}
