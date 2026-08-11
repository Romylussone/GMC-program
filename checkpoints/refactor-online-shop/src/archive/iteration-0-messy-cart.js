// Iteration 0 (archived): the deliberately rough starting point.
// Smells: unclear names, duplicated price math, a long method, global state,
// primitive products, and notification logic tightly coupled to cart updates.
let users = [];
let items = [];

export function doCart(p, q, discount, email) {
  let x = 0;
  for (let i = 0; i < items.length; i += 1) {
    if (items[i].id === p.id) {
      items[i].q += q;
      x = items[i].price * items[i].q;
    }
  }
  if (x === 0) {
    items.push({ id: p.id, price: p.price, q });
    x = p.price * q;
  }
  let total = 0;
  for (let i = 0; i < items.length; i += 1) total += items[i].price * items[i].q;
  if (discount === 'vip') total = total - total * 0.2;
  if (discount === 'sale') total = total - 10;
  if (p.oldPrice && p.price < p.oldPrice) {
    for (let i = 0; i < users.length; i += 1) console.log(`Mail ${users[i]}: price down`);
  }
  if (email) users.push(email);
  return total;
}
