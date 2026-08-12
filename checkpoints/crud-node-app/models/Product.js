const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Product price cannot be negative'],
    },
    category: {
      type: String,
      trim: true,
      default: null,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Expose a consistent `id` field while keeping MongoDB's native `_id` internally.
productSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_document, returnedObject) => {
    delete returnedObject._id;
  },
});

module.exports = mongoose.model('Product', productSchema);
