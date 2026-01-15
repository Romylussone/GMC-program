var tab = [1, 2, 3, 4, 5];

function ourIndexOf(array, searchValue) {
    var startIndex = fromIndex || 0;
    for (var i = startIndex; i < array.length; i++) {
        if (array[i] === searchValue) {
            return i;
        }
    }
    return -1;
}