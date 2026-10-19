import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { products as initialProducts, shippingThreshold, shippingFee } from '../shared/catalog.js';

const ShopContext = createContext(null);
function saved(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    signal: options.signal || AbortSignal.timeout(15000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.error || 'Le service est indisponible. Réessayez dans un instant.');
  return body;
}

export function ShopProvider({ children }) {
  const [products, setProducts] = useState(initialProducts);
  const [demo, setDemo] = useState(true);
  const [offline, setOffline] = useState(false);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(() => {
    const data = saved('maison-cart', []);
    return Array.isArray(data)
      ? data.filter(
          (item) =>
            initialProducts.some(
              (p) =>
                p.id === item.productId &&
                p.sizes.includes(item.size) &&
                p.colors.some((c) => c.name === item.color),
            ) &&
            Number.isInteger(item.quantity) &&
            item.quantity >= 1 &&
            item.quantity <= 10,
        )
      : [];
  });
  const [favorites, setFavorites] = useState(() => {
    const data = saved('maison-favorites', []);
    return Array.isArray(data) ? data.filter((id) => typeof id === 'string') : [];
  });
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState('');
  const notify = useCallback((message) => setToast(message), []);
  useEffect(() => {
    let cancelled = false;
    api('/products')
      .then((data) => {
        if (!cancelled) {
          setProducts(data.products);
          setDemo(data.demo);
          setOffline(false);
        }
      })
      .catch(() => {
        if (!cancelled) setOffline(true);
      });
    api('/auth/me')
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('maison-cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);
  useEffect(() => {
    try {
      localStorage.setItem('maison-favorites', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const items = cart
    .map((item) => ({ ...item, product: products.find((p) => p.id === item.productId) }))
    .filter((item) => item.product);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= shippingThreshold ? 0 : shippingFee;
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  function addToCart(product, size, color) {
    const current = cart.find(
      (item) => item.productId === product.id && item.size === size && item.color === color,
    );
    const stock = product.inventory?.find((v) => v.key === `${size}:${color}`)?.stock ?? 10;
    if ((current?.quantity || 0) >= Math.min(stock, 10))
      return notify('La quantité disponible pour cette variante est atteinte.');
    setCart((previous) =>
      current
        ? previous.map((item) =>
            item === current ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [...previous, { productId: product.id, size, color, quantity: 1 }],
    );
    setPanel('cart');
  }
  function changeQuantity(item, delta) {
    const stock =
      item.product?.inventory?.find((v) => v.key === `${item.size}:${item.color}`)?.stock ?? 10;
    if (delta > 0 && item.quantity >= Math.min(stock, 10))
      return notify('La quantité disponible est atteinte.');
    setCart((previous) =>
      previous
        .map((line) =>
          line.productId === item.productId && line.size === item.size && line.color === item.color
            ? { ...line, quantity: Math.min(10, line.quantity + delta) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }
  function removeItem(item) {
    setCart((previous) =>
      previous.filter(
        (line) =>
          !(
            line.productId === item.productId &&
            line.size === item.size &&
            line.color === item.color
          ),
      ),
    );
  }
  function toggleFavorite(id) {
    setFavorites((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
    );
  }
  return (
    <ShopContext.Provider
      value={{
        products,
        demo,
        offline,
        user,
        setUser,
        items,
        count,
        subtotal,
        shipping,
        total: subtotal + shipping,
        cart,
        setCart,
        favorites,
        toggleFavorite,
        panel,
        setPanel,
        toast,
        notify,
        addToCart,
        changeQuantity,
        removeItem,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}
export const useShop = () => useContext(ShopContext);
