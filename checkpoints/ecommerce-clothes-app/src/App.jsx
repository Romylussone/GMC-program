import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Header, Footer, Panels } from './components.jsx';
import {
  Home,
  Shop,
  Product,
  Checkout,
  Maison,
  Help,
  Information,
  Account,
  NotFound,
} from './pages.jsx';
import { useShop } from './store.jsx';

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const title =
      {
        '/': 'Le style, simplement.',
        '/boutique': 'La collection',
        '/commande': 'Votre commande',
        '/maison': 'Notre histoire',
        '/aide': 'À vos côtés',
        '/compte': 'Mon compte',
        '/informations': 'Informations utiles',
      }[pathname] || 'Votre prochain essentiel';
    document.title = `MAISON — ${title}`;
    if (hash) {
      const timer = setTimeout(
        () => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView(),
        100,
      );
      return () => clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}
export default function App() {
  const { toast } = useShop();
  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <ScrollManager />
      <Header />
      <main id="contenu">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/boutique" element={<Shop />} />
          <Route path="/produit/:id" element={<Product />} />
          <Route path="/commande" element={<Checkout />} />
          <Route path="/maison" element={<Maison />} />
          <Route path="/aide" element={<Help />} />
          <Route path="/informations" element={<Information />} />
          <Route path="/compte" element={<Account />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Panels />
      <div className={`toast ${toast ? 'toast-visible' : ''}`} role="status" aria-live="polite">
        {toast && (
          <>
            <Check size={17} />
            {toast}
          </>
        )}
      </div>
    </>
  );
}
