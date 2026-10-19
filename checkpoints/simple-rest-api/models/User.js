const mongoose = require('mongoose');

// Define the fields and validation rules for documents in the users collection.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email must be valid.'],
      unique: true,
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative.'],
      max: [150, 'Age cannot exceed 150.'],
      validate: {
        validator: (value) => value == null || Number.isInteger(value),
        message: 'Age must be a whole number.',
      },
    },
  },
  { timestamps: true },
);

// Export the model so the route callbacks can query and modify users.
module.exports = mongoose.model('User', userSchema);
