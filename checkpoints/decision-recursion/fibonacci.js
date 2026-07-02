function fibonacci(n) {
  if (!Number.isInteger(n) || n < 0) {
    return "Please enter a non-negative integer.";
  }

  if (n === 0) {
    return 0;
  }

  if (n === 1) {
    return 1;
  }

  return fibonacci(n - 1) + fibonacci(n - 2);
}

module.exports = fibonacci;
