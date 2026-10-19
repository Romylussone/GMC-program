import { before, afterEach, after, test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { JSDOM } from 'jsdom';
import { products } from '../shared/catalog.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:5173/',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.localStorage = dom.window.localStorage;
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
dom.window.scrollTo = () => {};
dom.window.HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '');
};
dom.window.HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open');
};

const { render, screen, within, cleanup, waitFor } = await import('@testing-library/react');
const { default: userEvent } = await import('@testing-library/user-event');
const { MemoryRouter } = await import('react-router-dom');
const { ShopProvider } = await import('../src/store.jsx');
const { default: App } = await import('../src/App.jsx');
const originalFetch = globalThis.fetch;
const originalFormData = globalThis.FormData;
const h = React.createElement;
let submittedOrder;
function mount(path = '/') {
  return render(h(MemoryRouter, { initialEntries: [path] }, h(ShopProvider, null, h(App))));
}
before(() => {
  globalThis.FormData = dom.window.FormData;
  globalThis.fetch = async (url, options) => {
    const body =
      url === '/api/products'
        ? { products, demo: true }
        : url === '/api/auth/me'
          ? { user: null }
          : url === '/api/orders'
            ? (() => {
                submittedOrder = JSON.parse(options.body);
                return {
                  demo: true,
                  reference: 'DEMO-TEST123',
                  total: 18900,
                  subtotal: 18900,
                  shipping: 0,
                };
              })()
            : { demo: true };
    return { ok: true, json: async () => body };
  };
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  submittedOrder = undefined;
});
after(() => {
  globalThis.fetch = originalFetch;
  globalThis.FormData = originalFormData;
  dom.window.close();
});

test('home presents the collection and product links', async () => {
  mount();
  assert.ok(screen.getByRole('heading', { level: 1, name: /Le style/ }));
  assert.equal(screen.getAllByRole('article').length, 4);
  assert.ok(screen.getByRole('link', { name: 'Découvrir la collection', exact: true }));
});
test('catalog filters and sorting change visible products', async () => {
  const user = userEvent.setup({ document });
  mount('/boutique');
  await user.click(screen.getByRole('button', { name: 'Mailles', exact: true }));
  assert.equal(screen.getAllByRole('article').length, 2);
  assert.ok(screen.getByText('La maille Camille'));
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Trier les produits' }),
    'prix-desc',
  );
  assert.match(screen.getAllByRole('article')[0].textContent, /Gaspard/);
  await user.click(screen.getByRole('button', { name: 'Filtres' }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Univers' }), 'Femme');
  assert.equal(screen.getAllByRole('article').length, 1);
  assert.ok(screen.getByText('La maille Camille'));
});
test('product selection, persistent cart, quantities and demo checkout work together', async () => {
  const user = userEvent.setup({ document });
  mount('/produit/manteau-gabrielle');
  await user.click(screen.getByRole('button', { name: /Ajouter à mon panier/ }));
  assert.ok(screen.getByRole('alert').textContent.includes('taille'));
  await user.click(screen.getByRole('button', { name: 'M', exact: true }));
  await user.click(screen.getByRole('button', { name: /Ajouter à mon panier/ }));
  const dialog = screen.getByRole('dialog', { name: /Votre panier/ });
  assert.ok(dialog);
  await user.click(within(dialog).getByRole('button', { name: /Augmenter la quantité/ }));
  assert.equal(JSON.parse(localStorage.getItem('maison-cart'))[0].quantity, 2);
  await user.click(within(dialog).getByRole('button', { name: /Diminuer la quantité/ }));
  await user.click(within(dialog).getByRole('link', { name: /Passer ma commande/ }));
  assert.ok(screen.getByText(/Vous explorez notre boutique de démonstration/));
  await user.type(screen.getByLabelText('Nom complet'), 'Client Test');
  await user.type(screen.getByLabelText('Adresse e-mail', { exact: true }), 'test@example.com');
  await user.type(screen.getByLabelText('Adresse', { exact: true }), '12 rue de Test');
  await user.type(screen.getByLabelText('Code postal'), '75001');
  await user.type(screen.getByLabelText('Ville'), 'Paris');
  await user.click(screen.getByRole('checkbox', { name: /J’ai lu/ }));
  await user.click(screen.getByRole('button', { name: /Simuler ma commande/ }));
  await waitFor(() =>
    assert.ok(screen.getByRole('heading', { name: 'Tout est prêt pour la suite.' })),
  );
  assert.equal(submittedOrder.items[0].quantity, 1);
  assert.equal(submittedOrder.items[0].size, 'M');
  assert.equal(submittedOrder.consent, true);
  assert.deepEqual(JSON.parse(localStorage.getItem('maison-cart')), []);
});
test('favorites can be saved and removed', async () => {
  const user = userEvent.setup({ document });
  mount('/boutique');
  await user.click(
    screen.getByRole('button', { name: 'Ajouter Le manteau Gabrielle aux favoris' }),
  );
  assert.deepEqual(JSON.parse(localStorage.getItem('maison-favorites')), ['manteau-gabrielle']);
  await user.click(screen.getByRole('button', { name: 'Mes favoris (1)' }));
  const dialog = screen.getByRole('dialog', { name: /Vos coups de cœur/ });
  assert.ok(within(dialog).getByText('Le manteau Gabrielle'));
  await user.click(within(dialog).getByRole('button', { name: /Retirer Le manteau Gabrielle/ }));
  assert.ok(within(dialog).getByText('À garder tout près.'));
});
test('search opens matching products and handles empty results', async () => {
  const user = userEvent.setup({ document });
  mount();
  await user.click(screen.getByRole('button', { name: 'Rechercher', exact: true }));
  const dialog = screen.getByRole('dialog', { name: 'Une pièce en tête ?' });
  const input = within(dialog).getByRole('textbox');
  await user.type(input, 'Arthur');
  assert.ok(within(dialog).getByText('La chemise Arthur'));
  await user.clear(input);
  await user.type(input, 'introuvable');
  assert.ok(within(dialog).getByText(/Aucune pièce trouvée/));
});
