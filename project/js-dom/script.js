var products = [
  {
    id: 1,
    title: "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops",
    price: 109.95,
    image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_t.png",
  },
  {
    id: 2,
    title: "Mens Casual Premium Slim Fit T-Shirts ",
    price: 22.3,
    image:
      "https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_t.png",
  },
  {
    id: 3,
    title: "Mens Cotton Jacket",
    price: 55.99,
    image: "https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_t.png",
  },
  {
    id: 4,
    title: "Mens Casual Slim Fit",
    price: 15.99,
    image: "https://fakestoreapi.com/img/71YXzeOuslL._AC_UY879_t.png",
  },
  {
    id: 5,
    title:
      "John Hardy Women's Legends Naga Gold & Silver Dragon Station Chain Bracelet",
    price: 695,
    image: "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_t.png",
  },
];


var productContainer = document.getElementById("product-container");

products.forEach(function (product) {
  var productCard = document.createElement("div");
  productCard.id = "box-" + product.id;
  var productImage = document.createElement("img");
  productImage.src = product.image;
  productImage.alt = product.title;
  productCard.appendChild(productImage);
  var productTitle = document.createElement("h4");
  productTitle.textContent = product.title;
  productCard.appendChild(productTitle);
  var productPrice = document.createElement("p");
  productPrice.textContent = "price $" + product.price;
  productCard.appendChild(productPrice);
  var buyButton = document.createElement("button");
  buyButton.textContent = "Add to cart";
  productCard.appendChild(buyButton);
  productContainer.appendChild(productCard);
});


