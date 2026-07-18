
# Practice Project Blueprint: E-Commerce Product Catalog

## 1. Project Goal

You will build a dynamic, interactive product storefront that fetches live data from the **FakeStoreAPI** (`https://fakestoreapi.com/products`), maps the items into a responsive layout, and handles interactive features like adding items to a cart, toggling favorites, and viewing item details.

---

## 2. Component Structure & Data Flow

Before writing code, visualize how data flows. React uses **unidirectional (one-way) data flow**. The parent component holds the "source of truth" (state), and passes data down via props. The child component passes user actions back up using callback functions.

### 2.1 The Parent (`App.jsx`)

* **State Management:** Holds the array of fetched products, the cart array, and the favorites array.
* **Logic:** Fetches data from the API on initial load and contains the functions to update the cart and favorites.

### 2.2 The Child (`ProductCard.jsx`)

* **Presentation:** Receives a single product object and UI state via props.
* **Interactions:** Uses event hooks to alert the parent when a user clicks a button or icon.

---

## 3. Data Specification (The FakeStoreAPI Schema)

Your child component will receive a `product` object matching this exact structure from the API. You must map these fields to your UI:

```json
{
  "id": 1,
  "title": "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops",
  "price": 109.95,
  "description": "Your perfect pack for everyday use...",
  "category": "men's clothing",
  "image": "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_t.png",
  "rating": { "rate": 3.9, "count": 120 }
}

```

---

## 4. Step-by-Step Implementation Guide

### Phase 1: Setup & List Rendering (Basic Props)

* [ ] **Parent Task:** Fetch the data array from `https://fakestoreapi.com/products` inside a `useEffect` hook and store it in state.
* [ ] **Parent Task:** Loop (`.map()`) through the array to render a `<ProductCard />` for each item.
* [ ] **Crucial Detail:** Pass `key={product.id}` on the card tag so React can track list changes. Pass the whole object as a prop: `product={product}`.
* [ ] **Child Task:** Destructure the product properties (`title`, `price`, `image`, `category`, `rating`) right in the component function arguments for clean code.

### Phase 2: Dynamic UI Styling (Conditional Props)

* [ ] **Category Badge:** Display the `category` text in a small capsule badge. Use conditional logic to change the background color based on the text (e.g., Blue for `"men's clothing"`, Pink for `"women's clothing"`).
* [ ] **Rating Indicator:** Look at `rating.rate`. If the rating is $4.0$ or higher, style the text or star icon in Green. If it's lower, style it in Amber/Orange.
* [ ] **Layout Safety:** Image heights vary wildly. Style the card `<img>` tag with a fixed height (e.g., `200px`) and use the CSS property `object-fit: contain` to prevent images from warping.

### Phase 3: Card Functionality (Callback Props)

To make the cards interactive, pass functions from the parent to the child as props.

#### 1. The "Add to Cart" Button

* **Parent Prop to Pass:** `onAddToCart` (a function that takes an ID and adds it to a `cart` state array).
* **Child Implementation:** Add a button at the bottom of the card. Attach an event listener: `onClick={() => onAddToCart(product.id)}`.
* **Bonus Logic:** Pass a boolean prop from the parent called `isInCart`. If `true`, the child should change the button text to "In Cart ✔️" and change its color.


#### 2. The "Quick View" Modal

* **Parent Prop to Pass:** `onViewDetails` (a function that sets an `activeProduct` state to the selected product object).
* **Child Implementation:** Make the main product image clickable. Attach `onClick={() => onViewDetails(product)}`.

---

## 5. Critical Technical Hurdles to Solve

> ⚠️ **Watch out for Event Bubbling!**
> The Favorite heart and the Add to Cart button live *inside* the clickable card container. Clicking the heart will accidentally trigger the "Quick View" modal too.
> **How to fix:** In the child component's button/heart click handlers, receive the event object (`e`) and call `e.stopPropagation()` before firing your prop function.

---

## 6. How to Verify Your Project is Working

1. **The Grid Test:** Shrink your browser window. Do the cards wrap beautifully into responsive rows without overlapping?
2. **The Console Test:** Open browser developer tools. Are there any errors about "unique key props"? (If yes, check your `.map()` loop).
3. **The StopPropagation Test:** Click the "Favorite" heart icon. Does it fill in without accidentally popping open the Quick View modal?
4. **The Data Integrity Test:** Click "Add to Cart" on item #1. Does your parent state correctly reflect that item #1 (and *only* item #1) was selected?