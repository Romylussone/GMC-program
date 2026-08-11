const { addItem, viewCart, removeItem, clearCart } = require("./shoppingCart");

addItem("Apple", 2, 1.5);
addItem("Orange", 3, 2.0);
viewCart();

removeItem("Apple");
viewCart();

clearCart();
