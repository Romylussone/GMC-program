CREATE TABLE Customer (
    Customer_id   NUMBER,
    Customer_Name VARCHAR2(100) NOT NULL,
    Customer_Tel  VARCHAR2(20),
    CONSTRAINT pk_customer PRIMARY KEY (Customer_id)
);

CREATE TABLE Product (
    Product_id   NUMBER,
    Product_Name VARCHAR2(100) NOT NULL,
    Price        NUMBER(10, 2) NOT NULL,
    CONSTRAINT pk_product PRIMARY KEY (Product_id),
    CONSTRAINT chk_product_price CHECK (Price >= 0)
);

CREATE TABLE Orders (
    Customer_id  NUMBER,
    Product_id   NUMBER,
    Quantity     NUMBER NOT NULL,
    Total_Amount NUMBER(12, 2) NOT NULL,
    CONSTRAINT pk_orders PRIMARY KEY (Customer_id, Product_id),
    CONSTRAINT fk_orders_customer
        FOREIGN KEY (Customer_id) REFERENCES Customer(Customer_id),
    CONSTRAINT fk_orders_product
        FOREIGN KEY (Product_id) REFERENCES Product(Product_id),
    CONSTRAINT chk_orders_quantity CHECK (Quantity > 0),
    CONSTRAINT chk_total_amount CHECK (Total_Amount >= 0)
);

ALTER TABLE Product
ADD Category VARCHAR2(20);

ALTER TABLE Orders
ADD OrderDate DATE DEFAULT SYSDATE;
