class ArrayQueue {
  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error("Capacity must be a positive integer.");
    }

    this.items = new Array(capacity);
    this.capacity = capacity;
    this.frontIndex = 0;
    this.rearIndex = 0;
    this.count = 0;
  }

  enqueue(element) {
    if (this.count === this.capacity) {
      throw new Error("Cannot enqueue: array-based queue is full.");
    }

    this.items[this.rearIndex] = element;
    this.rearIndex = (this.rearIndex + 1) % this.capacity;
    this.count += 1;
  }

  dequeue() {
    if (this.isEmpty()) {
      throw new Error("Cannot dequeue: queue is empty.");
    }

    const element = this.items[this.frontIndex];
    this.items[this.frontIndex] = undefined;
    this.frontIndex = (this.frontIndex + 1) % this.capacity;
    this.count -= 1;
    return element;
  }

  peek() {
    if (this.isEmpty()) {
      throw new Error("Cannot peek: queue is empty.");
    }

    return this.items[this.frontIndex];
  }

  isEmpty() {
    return this.count === 0;
  }

  size() {
    return this.count;
  }
}

class ListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedListQueue {
  constructor() {
    this.frontNode = null;
    this.rearNode = null;
    this.count = 0;
  }

  enqueue(element) {
    const node = new ListNode(element);

    if (this.isEmpty()) {
      this.frontNode = node;
      this.rearNode = node;
    } else {
      this.rearNode.next = node;
      this.rearNode = node;
    }

    this.count += 1;
  }

  dequeue() {
    if (this.isEmpty()) {
      throw new Error("Cannot dequeue: queue is empty.");
    }

    const element = this.frontNode.value;
    this.frontNode = this.frontNode.next;
    this.count -= 1;

    if (this.isEmpty()) {
      this.rearNode = null;
    }

    return element;
  }

  peek() {
    if (this.isEmpty()) {
      throw new Error("Cannot peek: queue is empty.");
    }

    return this.frontNode.value;
  }

  isEmpty() {
    return this.count === 0;
  }

  size() {
    return this.count;
  }
}

class PriorityQueueEntry {
  constructor(element, priority, order) {
    this.element = element;
    this.priority = priority;
    this.order = order;
  }
}

function getPriority(element, priority) {
  const resolvedPriority =
    priority !== undefined
      ? priority
      : typeof element === "number"
        ? element
        : element && element.priority;

  if (typeof resolvedPriority !== "number" || Number.isNaN(resolvedPriority)) {
    throw new Error(
      "Priority must be a number, or the element must have a numeric priority property."
    );
  }

  return resolvedPriority;
}

function hasHigherPriority(left, right) {
  if (left.priority !== right.priority) {
    return left.priority < right.priority;
  }

  return left.order < right.order;
}

class MinHeapPriorityQueue {
  constructor() {
    this.heap = [];
    this.nextOrder = 0;
  }

  insert(element, priority) {
    const entry = new PriorityQueueEntry(
      element,
      getPriority(element, priority),
      this.nextOrder
    );

    this.nextOrder += 1;
    this.heap.push(entry);
    this.heapifyUp(this.heap.length - 1);
  }

  extractMin() {
    if (this.isEmpty()) {
      throw new Error("Cannot extractMin: priority queue is empty.");
    }

    const min = this.heap[0];
    const last = this.heap.pop();

    if (!this.isEmpty()) {
      this.heap[0] = last;
      this.heapifyDown(0);
    }

    return min.element;
  }

  peekMin() {
    if (this.isEmpty()) {
      throw new Error("Cannot peekMin: priority queue is empty.");
    }

    return this.heap[0].element;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  size() {
    return this.heap.length;
  }

  heapifyUp(index) {
    let childIndex = index;

    while (childIndex > 0) {
      const parentIndex = Math.floor((childIndex - 1) / 2);

      if (!hasHigherPriority(this.heap[childIndex], this.heap[parentIndex])) {
        break;
      }

      this.swap(childIndex, parentIndex);
      childIndex = parentIndex;
    }
  }

  heapifyDown(index) {
    let parentIndex = index;

    while (true) {
      const leftChildIndex = 2 * parentIndex + 1;
      const rightChildIndex = 2 * parentIndex + 2;
      let smallestIndex = parentIndex;

      if (
        leftChildIndex < this.heap.length &&
        hasHigherPriority(this.heap[leftChildIndex], this.heap[smallestIndex])
      ) {
        smallestIndex = leftChildIndex;
      }

      if (
        rightChildIndex < this.heap.length &&
        hasHigherPriority(this.heap[rightChildIndex], this.heap[smallestIndex])
      ) {
        smallestIndex = rightChildIndex;
      }

      if (smallestIndex === parentIndex) {
        break;
      }

      this.swap(parentIndex, smallestIndex);
      parentIndex = smallestIndex;
    }
  }

  swap(firstIndex, secondIndex) {
    const temp = this.heap[firstIndex];
    this.heap[firstIndex] = this.heap[secondIndex];
    this.heap[secondIndex] = temp;
  }
}

class OrderedArrayPriorityQueue {
  constructor() {
    this.items = [];
    this.nextOrder = 0;
  }

  insert(element, priority) {
    const entry = new PriorityQueueEntry(
      element,
      getPriority(element, priority),
      this.nextOrder
    );

    this.nextOrder += 1;
    const index = this.findInsertIndex(entry);
    this.items.splice(index, 0, entry);
  }

  extractMin() {
    if (this.isEmpty()) {
      throw new Error("Cannot extractMin: priority queue is empty.");
    }

    return this.items.shift().element;
  }

  peekMin() {
    if (this.isEmpty()) {
      throw new Error("Cannot peekMin: priority queue is empty.");
    }

    return this.items[0].element;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  findInsertIndex(entry) {
    let low = 0;
    let high = this.items.length;

    while (low < high) {
      const middle = Math.floor((low + high) / 2);

      if (hasHigherPriority(entry, this.items[middle])) {
        high = middle;
      } else {
        low = middle + 1;
      }
    }

    return low;
  }
}

module.exports = {
  ArrayQueue,
  LinkedListQueue,
  MinHeapPriorityQueue,
  OrderedArrayPriorityQueue,
};

if (require.main === module) {
  const arrayQueue = new ArrayQueue(3);
  arrayQueue.enqueue("A");
  arrayQueue.enqueue("B");
  console.log("ArrayQueue peek:", arrayQueue.peek());
  console.log("ArrayQueue dequeue:", arrayQueue.dequeue());

  const linkedListQueue = new LinkedListQueue();
  linkedListQueue.enqueue("first");
  linkedListQueue.enqueue("second");
  console.log("LinkedListQueue peek:", linkedListQueue.peek());
  console.log("LinkedListQueue dequeue:", linkedListQueue.dequeue());

  const heapQueue = new MinHeapPriorityQueue();
  heapQueue.insert({ task: "low", priority: 3 });
  heapQueue.insert({ task: "high", priority: 1 });
  console.log("MinHeapPriorityQueue minimum:", heapQueue.extractMin());

  const orderedQueue = new OrderedArrayPriorityQueue();
  orderedQueue.insert("medium", 2);
  orderedQueue.insert("urgent", 1);
  console.log("OrderedArrayPriorityQueue minimum:", orderedQueue.extractMin());
}
