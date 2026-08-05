/**
 * Returns true when a word reads identically from left to right and right to left.
 *
 * @param {string} word
 * @returns {boolean}
 */
function isPalindrome(word) {
  // An empty word or a one-character word is a palindrome.
  if (word.length <= 1) {
    return true;
  }

  // Different end characters mean the word cannot be a palindrome.
  if (word[0] !== word[word.length - 1]) {
    return false;
  }

  // Compare the remaining inner characters.
  return isPalindrome(word.slice(1, -1));
}

console.log(isPalindrome("gag"));   // true
console.log(isPalindrome("kayak")); // true
console.log(isPalindrome("radar")); // true
console.log(isPalindrome("hello")); // false

module.exports = isPalindrome;
