function isPalindrome(text) {
  if (typeof text !== "string") {
    return false;
  }

  const normalizedText = text.toLowerCase().replace(/[^a-z0-9]/g, "");

  function checkCharacters(start, end) {
    if (start >= end) {
      return true;
    }

    if (normalizedText[start] !== normalizedText[end]) {
      return false;
    }

    return checkCharacters(start + 1, end - 1);
  }

  return checkCharacters(0, normalizedText.length - 1);
}

module.exports = isPalindrome;
