const fs = require('fs');

fs.writeFileSync('welcome.txt', 'Hello Node\n');
console.log('welcome.txt created.');

fs.readFile('hello.txt', 'utf8', (error, data) => {
  if (error) {
    console.error('Could not read hello.txt:', error.message);
    return;
  }

  console.log(data);
});
