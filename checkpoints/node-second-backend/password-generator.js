const generator = require('generate-password');

function generateRandomPassword() {
  return generator.generate({
    length: 12,
    numbers: true,
    symbols: true,
    uppercase: true,
    lowercase: true,
    strict: true,
  });
}

console.log(generateRandomPassword());
