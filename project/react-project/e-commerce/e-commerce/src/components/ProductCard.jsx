import React from "react";

const ProductCard = ({ product, onAddToCart }) => {
  const { title, price, image, description } = product || {};

  return (
    <article className="product-card">
      <div className="product-card__image-wrapper">
        <img
          className="product-card__image"
          src={image || "https://via.placeholder.com/240"}
          alt={name || "Product"}
        />
      </div>
      <div className="product-card__content">
        <h2 className="product-card__title">{title || "Unnamed Product"}</h2>
        <p className="product-card__description">{description || "No description available."}</p>
        <div className="product-card__footer">
          <span className="product-card__price">${price != null ? price.toFixed(2) : "0.00"}</span>
          <button
            className="product-card__button"
            type="button"
            onClick={() => onAddToCart && onAddToCart(product)}
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
