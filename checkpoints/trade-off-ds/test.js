const assert = require("node:assert/strict");
const {
  ArrayQueue,
  LinkedListQueue,
  MinHeapPriorityQueue,
  OrderedArrayPriorityQueue,
} = require("./index");

function testQueue(QueueClass, createQueue) {
  const queue = createQueue();

  assert.equal(queue.isEmpty(), true);
  assert.throws(() => queue.dequeue(), /queue is empty/);
  assert.throws(() => queue.peek(), /queue is empty/);

  queue.enqueue("A");
  queue.enqueue("B");
  assert.equal(queue.isEmpty(), false);
  assert.equal(queue.peek(), "A");
  assert.equal(queue.dequeue(), "A");

  queue.enqueue("C");
  assert.equal(queue.dequeue(), "B");
  assert.equal(queue.dequeue(), "C");
  assert.equal(queue.isEmpty(), true);
}

function testPriorityQueue(PriorityQueueClass) {
  const queue = new PriorityQueueClass();

  assert.equal(queue.isEmpty(), true);
  assert.throws(() => queue.extractMin(), /priority queue is empty/);
  assert.throws(() => queue.peekMin(), /priority queue is empty/);

  queue.insert({ name: "normal", priority: 3 });
  queue.insert({ name: "urgent", priority: 1 });
  queue.insert({ name: "medium", priority: 2 });
  queue.insert({ name: "urgent again", priority: 1 });

  assert.equal(queue.peekMin().name, "urgent");
  assert.equal(queue.extractMin().name, "urgent");
  assert.equal(queue.extractMin().name, "urgent again");
  assert.equal(queue.extractMin().name, "medium");
  assert.equal(queue.extractMin().name, "normal");
  assert.equal(queue.isEmpty(), true);

  queue.insert(10);
  queue.insert(4);
  assert.equal(queue.extractMin(), 4);
  assert.equal(queue.extractMin(), 10);

  assert.throws(() => queue.insert({ name: "missing priority" }), /Priority must be a number/);
}

testQueue(ArrayQueue, () => new ArrayQueue(3));
testQueue(LinkedListQueue, () => new LinkedListQueue());

const fullQueue = new ArrayQueue(2);
fullQueue.enqueue("A");
fullQueue.enqueue("B");
assert.throws(() => fullQueue.enqueue("C"), /queue is full/);
assert.equal(fullQueue.dequeue(), "A");
fullQueue.enqueue("C");
assert.equal(fullQueue.dequeue(), "B");
assert.equal(fullQueue.dequeue(), "C");

testPriorityQueue(MinHeapPriorityQueue);
testPriorityQueue(OrderedArrayPriorityQueue);

console.log("All tests passed.");
