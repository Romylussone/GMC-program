function removeDuplicate(arr) {

    if (arr.length === 0) {
        return null;
    }

    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] === arr[j]) {
                arr.splice(j, 1);
                j--; 
            }
        }
    }
    return arr;
}


console.log(removeDuplicate([1, 2, 2, 3, 4, 4, 5])); // Output: [1, 2, 3, 4, 5]
console.log(removeDuplicate(['a', 'b', 'a', 'c', 'b'])); // Output: ['a', 'b', 'c']