const mongoose = require('mongoose');
const Product = require('../models/Product');

function sendDatabaseError(error, response) {
  if (error instanceof mongoose.Error.CastError) {
    return response.status(400).json({ message: 'Invalid product id' });
  }

  if (error.name === 'ValidationError') {
    return response.status(400).json({ message: error.message });
  }

  return response.status(500).json({ message: 'Database operation failed' });
}

async function createProduct(request, response) {
  try {
    const product = await Product.create(request.body);
    return response.status(201).json(product);
  } catch (error) {
    return sendDatabaseError(error, response);
  }
}

async function getProducts(_request, response) {
  try {
    const products = await Product.find();
    return response.status(200).json(products);
  } catch (error) {
    return sendDatabaseError(error, response);
  }
}

async function getProductById(request, response) {
  try {
    const product = await Product.findById(request.params.id);
    if (!product) return response.status(404).json({ message: 'Product not found' });
    return response.status(200).json(product);
  } catch (error) {
    return sendDatabaseError(error, response);
  }
}

async function updateProduct(request, response) {
  try {
    const product = await Product.findByIdAndUpdate(request.params.id, request.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return response.status(404).json({ message: 'Product not found' });
    return response.status(200).json(product);
  } catch (error) {
    return sendDatabaseError(error, response);
  }
}

async function deleteProduct(request, response) {
  try {
    const product = await Product.findByIdAndDelete(request.params.id);
    if (!product) return response.status(404).json({ message: 'Product not found' });
    return response.status(204).send();
  } catch (error) {
    return sendDatabaseError(error, response);
  }
}

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };
