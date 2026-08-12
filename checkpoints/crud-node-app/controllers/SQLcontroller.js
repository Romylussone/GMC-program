const { pool } = require('../db/mysql');

const writableFields = ['name', 'price', 'category', 'inStock'];

function productFromRow(row) {
  return { ...row, price: Number(row.price), inStock: Boolean(row.inStock) };
}

function isValidId(id) {
  return /^\d+$/.test(String(id));
}

function validateProduct(body, { partial = false } = {}) {
  if (!partial || Object.hasOwn(body, 'name')) {
    if (typeof body.name !== 'string' || body.name.trim() === '') return 'name must be a non-empty string';
  }
  if (!partial || Object.hasOwn(body, 'price')) {
    if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0) return 'price must be a non-negative number';
  }
  if (Object.hasOwn(body, 'category') && body.category !== null && typeof body.category !== 'string') return 'category must be a string or null';
  if (Object.hasOwn(body, 'inStock') && typeof body.inStock !== 'boolean') return 'inStock must be a boolean';
  return null;
}

function sendSqlError(error, response) {
  console.error(error);
  return response.status(500).json({ message: 'Database operation failed' });
}

async function createProduct(request, response) {
  const errorMessage = validateProduct(request.body);
  if (errorMessage) return response.status(400).json({ message: errorMessage });

  const { name, price, category = null, inStock = true } = request.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO products (name, price, category, inStock) VALUES (?, ?, ?, ?)',
      [name.trim(), price, category, inStock]
    );
    const [rows] = await pool.execute(
      'SELECT id, name, price, category, inStock FROM products WHERE id = ?',
      [result.insertId]
    );
    return response.status(201).json(productFromRow(rows[0]));
  } catch (error) {
    return sendSqlError(error, response);
  }
}

async function getProducts(_request, response) {
  try {
    const [rows] = await pool.execute('SELECT id, name, price, category, inStock FROM products ORDER BY id');
    return response.status(200).json(rows.map(productFromRow));
  } catch (error) {
    return sendSqlError(error, response);
  }
}

async function getProductById(request, response) {
  if (!isValidId(request.params.id)) return response.status(400).json({ message: 'Invalid product id' });
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, price, category, inStock FROM products WHERE id = ?',
      [request.params.id]
    );
    if (rows.length === 0) return response.status(404).json({ message: 'Product not found' });
    return response.status(200).json(productFromRow(rows[0]));
  } catch (error) {
    return sendSqlError(error, response);
  }
}

async function updateProduct(request, response) {
  if (!isValidId(request.params.id)) return response.status(400).json({ message: 'Invalid product id' });
  const updates = Object.fromEntries(Object.entries(request.body).filter(([key]) => writableFields.includes(key)));
  if (Object.keys(updates).length === 0) return response.status(400).json({ message: 'Provide at least one product field to update' });
  const errorMessage = validateProduct(updates, { partial: true });
  if (errorMessage) return response.status(400).json({ message: errorMessage });

  const fields = Object.keys(updates);
  const values = fields.map((field) => field === 'name' ? updates[field].trim() : updates[field]);
  try {
    const [result] = await pool.execute(
      `UPDATE products SET ${fields.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`,
      [...values, request.params.id]
    );
    if (result.affectedRows === 0) return response.status(404).json({ message: 'Product not found' });
    const [rows] = await pool.execute(
      'SELECT id, name, price, category, inStock FROM products WHERE id = ?',
      [request.params.id]
    );
    return response.status(200).json(productFromRow(rows[0]));
  } catch (error) {
    return sendSqlError(error, response);
  }
}

async function deleteProduct(request, response) {
  if (!isValidId(request.params.id)) return response.status(400).json({ message: 'Invalid product id' });
  try {
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [request.params.id]);
    if (result.affectedRows === 0) return response.status(404).json({ message: 'Product not found' });
    return response.status(204).send();
  } catch (error) {
    return sendSqlError(error, response);
  }
}

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };
