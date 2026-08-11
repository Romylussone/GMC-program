/** A value object for a sellable product. Create instances through ProductBuilder. */
export class Product {
  constructor({ id, name, price, category, description, sku, attributes, tags }) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.category = category;
    this.description = description;
    this.sku = sku;
    this.attributes = Object.freeze({ ...attributes });
    this.tags = Object.freeze([...tags]);
    Object.freeze(this);
  }

  withPrice(price) {
    return new Product({ ...this, price });
  }
}

/** Builder keeps optional product details readable without telescoping constructors. */
export class ProductBuilder {
  constructor(id, name, price) {
    this.product = { id, name, price, category: 'general', description: '', sku: '', attributes: {}, tags: [] };
  }

  inCategory(category) { this.product.category = category; return this; }
  describedAs(description) { this.product.description = description; return this; }
  withSku(sku) { this.product.sku = sku; return this; }
  withAttribute(name, value) { this.product.attributes[name] = value; return this; }
  tagged(...tags) { this.product.tags.push(...tags); return this; }

  build() {
    const { id, name, price } = this.product;
    if (!id || !name) throw new Error('Product id and name are required.');
    if (!Number.isFinite(price) || price < 0) throw new Error('Product price must be a non-negative number.');
    return new Product(this.product);
  }
}
