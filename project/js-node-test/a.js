const {b: {one, two, three}} = await import("./b.js");

console.log(one);
console.log(two);
console.log(three);