import { products, shippingFee, shippingThreshold, variantKey } from '../shared/catalog.js';
import { z } from 'zod';

export const orderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.email().max(254),
    address: z.string().trim().min(5).max(200),
    city: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().min(3).max(16),
    country: z.enum(['France', 'Belgique', 'Luxembourg']),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().max(100),
        size: z.string().max(20),
        color: z.string().max(40),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(30),
  idempotencyKey: z.uuid(),
  consent: z.literal(true),
});

export function priceOrder(items, catalog = products) {
  const seen = new Set();
  const pricedItems = items.map((item) => {
    const product = catalog.find((candidate) => (candidate.id || candidate._id) === item.productId);
    if (
      !product ||
      !product.sizes.includes(item.size) ||
      !product.colors.some((color) => color.name === item.color)
    ) {
      throw Object.assign(new Error('Un article ou une variante n’est plus disponible.'), {
        status: 400,
      });
    }
    const key = `${item.productId}:${variantKey(item.size, item.color)}`;
    if (seen.has(key))
      throw Object.assign(new Error('Une variante ne peut apparaître qu’une seule fois.'), {
        status: 400,
      });
    seen.add(key);
    return {
      productId: item.productId,
      name: product.name,
      image: product.image,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: product.price,
    };
  });
  const subtotal = pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= shippingThreshold ? 0 : shippingFee;
  return { items: pricedItems, subtotal, shipping, total: subtotal + shipping };
}
