import mongoose from 'mongoose';
import { connectDatabase, hasDatabase } from './db.js';
import { Product, User, Order, Subscriber } from './models.js';
import { products, variantKey } from '../shared/catalog.js';

try {
  if (!hasDatabase()) throw new Error('Renseignez MONGODB_URI dans le fichier .env.');
  await connectDatabase();
  await Promise.all([Product.init(), User.init(), Order.init(), Subscriber.init()]);
  for (const { id, ...product } of products) {
    // Re-running the seed never resets inventory or overwrites existing products.
    await Product.updateOne(
      { _id: id },
      {
        $setOnInsert: {
          ...product,
          inventory: product.sizes.flatMap((size) =>
            product.colors.map((color) => ({ key: variantKey(size, color.name), stock: 12 })),
          ),
        },
      },
      { upsert: true },
    );
  }
  console.log(`${products.length} références vérifiées ; produits existants et stocks conservés.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
