const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'product_crud',
  waitForConnections: true,
  connectionLimit: 10,
});

async function initializeProductTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(255) NULL,
      inStock BOOLEAN NOT NULL DEFAULT TRUE,
      PRIMARY KEY (id),
      CONSTRAINT products_price_non_negative CHECK (price >= 0)
    )
  `);
}

module.exports = { pool, initializeProductTable };
