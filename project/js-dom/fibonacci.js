function fibonacci(n) {
    if (n <= 1) {
        return n;
    } else {
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}

console.log(fibonacci(6)); // Output: 8

function findMax(arr) {
    return Math.max(...arr);
}

findMax([1, 5, 3, 9, 2]);
console.log(findMax([1, 5, 3, 9, 2])); // Output: 9