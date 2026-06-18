-- DQL queries for the Customer, Product, and Orders tables.
-- Assumptions:
--   Product contains a category column.
--   Orders contains an order_date column.
-- Dialect: MySQL

-- 1. Display all customer data.
SELECT *
FROM Customer;

-- 2. Display the name and category of products priced from 5000 to 10000.
SELECT product_name, category
FROM Product
WHERE price BETWEEN 5000 AND 10000;

-- 3. Display all products, sorted by price in descending order.
SELECT *
FROM Product
ORDER BY price DESC;

-- 4. Display aggregate order statistics.
SELECT
    COUNT(*) AS total_orders,
    AVG(total_amount) AS average_amount,
    MAX(total_amount) AS highest_amount,
    MIN(total_amount) AS lowest_amount
FROM Orders;

-- 5. Display the number of orders for each product.
SELECT product_id, COUNT(*) AS number_of_orders
FROM Orders
GROUP BY product_id;

-- 6. Display customers who have made more than two orders.
SELECT customer_id
FROM Orders
GROUP BY customer_id
HAVING COUNT(*) > 2;

-- 7. Display the number of orders for each month represented in 2020.
SELECT
    MONTH(order_date) AS order_month,
    COUNT(*) AS number_of_orders
FROM Orders
WHERE order_date >= '2020-01-01'
  AND order_date < '2021-01-01'
GROUP BY MONTH(order_date)
ORDER BY order_month;

-- 8. Display the product, customer, and date for each order.
SELECT
    p.product_name,
    c.customer_name,
    o.order_date
FROM Orders AS o
JOIN Product AS p
    ON p.product_id = o.product_id
JOIN Customer AS c
    ON c.customer_id = o.customer_id;

-- 9. Display orders made during the calendar month three months ago.
SELECT *
FROM Orders
WHERE order_date >= DATE_FORMAT(
          CURRENT_DATE - INTERVAL 3 MONTH, '%Y-%m-01'
      )
  AND order_date < DATE_FORMAT(
          CURRENT_DATE - INTERVAL 2 MONTH, '%Y-%m-01'
      );

-- 10. Display customers who have never ordered a product.
SELECT c.customer_id
FROM Customer AS c
WHERE NOT EXISTS (
    SELECT 1
    FROM Orders AS o
    WHERE o.customer_id = c.customer_id
);
