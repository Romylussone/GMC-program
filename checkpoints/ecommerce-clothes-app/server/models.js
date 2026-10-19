import mongoose from 'mongoose';

const { Schema } = mongoose;
const productSchema = new Schema(
  {
    _id: String,
    name: String,
    category: String,
    gender: String,
    price: Number,
    originalPrice: Number,
    badge: String,
    newArrival: Boolean,
    image: String,
    position: String,
    colors: [{ _id: false, name: String, hex: String }],
    sizes: [String],
    material: String,
    description: String,
    inventory: [{ _id: false, key: String, stock: { type: Number, min: 0 } }],
  },
  { timestamps: true },
);
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true, select: false },
  },
  { timestamps: true },
);
const orderSchema = new Schema(
  {
    reference: { type: String, unique: true, required: true },
    idempotencyKey: { type: String, unique: true, required: true },
    requestHash: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customer: {
      name: String,
      email: String,
      address: String,
      city: String,
      postalCode: String,
      country: String,
    },
    items: [
      {
        _id: false,
        productId: String,
        name: String,
        image: String,
        size: String,
        color: String,
        quantity: Number,
        price: Number,
      },
    ],
    subtotal: Number,
    shipping: Number,
    total: Number,
    paymentMethod: { type: String, default: 'on_delivery' },
    status: { type: String, default: 'confirmed' },
  },
  { timestamps: true },
);
const subscriberSchema = new Schema({
  email: { type: String, unique: true, required: true },
  consentAt: { type: Date, default: Date.now },
});

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export const Subscriber =
  mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);
