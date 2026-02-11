// Get all product cards
const products = document.querySelectorAll('.card-body');
const totalPriceElement = document.querySelector('.total');

// Function to calculate and update total price
function updateTotalPrice() {
  let total = 0;
  
  products.forEach(product => {
    const card = product.querySelector('.card');
    if (card) {
      const unitPriceText = card.querySelector('.unit-price').textContent;
      const unitPrice = parseFloat(unitPriceText.replace('$', '').trim());
      const quantity = parseInt(card.querySelector('.quantity').textContent);
      
      total += unitPrice * quantity;
    }
  });
  
  totalPriceElement.textContent = `${total} $`;
}

// Add event listeners to all products
products.forEach(product => {
  const card = product.querySelector('.card');
  if (!card) return;
  
  const plusBtn = card.querySelector('.fa-plus-circle');
  const minusBtn = card.querySelector('.fa-minus-circle');
  const deleteBtn = card.querySelector('.fa-trash-alt');
  const heartBtn = card.querySelector('.fa-heart');
  const quantityElement = card.querySelector('.quantity');
  
  // Increase quantity
  plusBtn.addEventListener('click', () => {
    let currentQuantity = parseInt(quantityElement.textContent);
    quantityElement.textContent = currentQuantity + 1;
    updateTotalPrice();
  });
  
  // Decrease quantity
  minusBtn.addEventListener('click', () => {
    let currentQuantity = parseInt(quantityElement.textContent);
    if (currentQuantity > 0) {
      quantityElement.textContent = currentQuantity - 1;
      updateTotalPrice();
    }
  });
  
  // Delete item
  deleteBtn.addEventListener('click', () => {
    product.remove();
    updateTotalPrice();
  });
  
  // Like/Unlike item (toggle heart color)
  heartBtn.addEventListener('click', () => {
    if (heartBtn.style.color === 'red') {
      heartBtn.style.color = 'black';
    } else {
      heartBtn.style.color = 'red';
    }
  });
});

// Initialize total price on page load
updateTotalPrice();
