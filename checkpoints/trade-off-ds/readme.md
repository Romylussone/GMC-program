What You're Aiming For
In this checkpoint, you will implement two different variations of a Queue and a Priority Queue to practice understanding their implementation trade-offs. You will implement both using array-based and linked list-based structures for the Queue, and min-heap and ordered array for the Priority Queue.


Instructions
1. Implement a Queue

You need to implement a queue using the following two methods:

Array-based Queue (Fixed size)

- Implement a queue using a fixed-size array.

- Implement the following operations:

enqueue(element): Add an element to the queue.
dequeue(): Remove and return the front element of the queue.
isEmpty(): Check if the queue is empty.
peek(): Return the front element without removing it.
Linked List-based Queue (Dynamic size)

- Implement a queue using a singly linked list.

- Implement the following operations:

enqueue(element): Add an element to the queue.
dequeue(): Remove and return the front element of the queue.
isEmpty(): Check if the queue is empty.
peek(): Return the front element without removing it.
2. Implement a Priority Queue

You need to implement a priority queue using the following two methods:

Min-Heap-based Priority Queue

- Implement a priority queue using a min-heap.

- Implement the following operations:

insert(element): Insert an element into the priority queue.
extractMin(): Remove and return the element with the minimum priority.
peekMin(): Return the element with the minimum priority without removing it.
isEmpty(): Check if the priority queue is empty.

Ordered Array-based Priority Queue
- Implement a priority queue using an ordered array (sorted by priority).

- Implement the following operations:

insert(element): Insert an element into the priority queue, maintaining the array in sorted order.
extractMin(): Remove and return the element with the minimum priority.
peekMin(): Return the element with the minimum priority without removing it.
isEmpty(): Check if the priority queue is empty.
Coding Requirements:
-  Write the code for each of the two data structure variations: Array-based Queue vs. Linked List-based Queue, and Min-Heap-based Priority Queue vs. Ordered Array-based Priority Queue.
-  Implement the necessary methods for each data structure as described above.
-  Consider edge cases such as:

Trying to dequeue or extractMin from an empty queue or priority queue.
Inserting into a full array-based queue.
Searching or peeking from an empty data structure.