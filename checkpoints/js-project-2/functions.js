// String Manipulation Functions
// Reverse a String
function reverseString(str) {
  return str.split('').reverse().join('');
}

// Count Characters
function countCharacters(str) {
  return str.length;
}

// Capitalize Words
function capitalizeWords(sentence) {
  return sentence
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Array Functions
// Find Maximum
function findMaximum(arr) {
  return Math.max(...arr);
}

// Find Minimum
function findMinimum(arr) {
  return Math.min(...arr);
}

// Sum of Array
function sumArray(arr) {
  return arr.reduce((sum, num) => sum + num, 0);
}

// Filter Array
function filterArray(arr, condition) {
  return arr.filter(condition);
}

// Mathematical Functions
// Factorial
function factorial(n) {
  if (n < 0) return undefined;
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}

// Prime Number Check
function isPrime(num) {
  if (num <= 1) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    if (num % i === 0) return false;
  }
  return true;
}

// Fibonacci Sequence
function fibonacciSequence(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  
  const fib = [0, 1];
  for (let i = 2; i < n; i++) {
    fib.push(fib[i - 1] + fib[i - 2]);
  }
  return fib;
}
