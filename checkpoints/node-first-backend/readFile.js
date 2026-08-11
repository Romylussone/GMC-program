const fs = require('fs');

const message = fs.readFileSync('message.txt', 'utf8');
console.log(message);
