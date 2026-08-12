# Product CRUD: MongoDB and MySQL

This API has matching Product CRUD controllers for MongoDB (Mongoose) and MySQL (`mysql2`). A product contains an auto-generated `id`, required `name` and `price`, optional `category`, and `inStock` (default `true`).

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env` and configure either MongoDB or MySQL.
3. Set `DATABASE_DRIVER=mongodb` or `DATABASE_DRIVER=mysql`.
4. Run `npm start`.

When MySQL is selected, the server creates the `products` table at startup. `database.sql` is also provided for manual database setup.

## Endpoints

The selected driver exposes the same routes:

- `POST /products` — create a product
- `GET /products` — list products
- `GET /products/:id` — get one product
- `PUT /products/:id` — update product fields
- `DELETE /products/:id` — delete a product

Example request body:

```json
{
  "name": "Mechanical keyboard",
  "price": 89.99,
  "category": "Electronics",
  "inStock": true
}
```

`controllers/NoSQLcontroller.js` uses Mongoose document methods. `controllers/SQLcontroller.js` uses parameterized `?` placeholders for every runtime SQL value.
