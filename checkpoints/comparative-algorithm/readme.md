What You're Aiming For
You’ve been hired to assist in optimizing a delivery platform backend system. The system receives a large number of delivery tasks, each with a start time and an end time. Your goal is to help the team implement an algorithm that selects the maximum number of non-overlapping tasks a single delivery driver can perform.

The team is currently debating between two solutions:

A brute-force implementation that explores all combinations
A greedy solution that selects tasks ending the earliest
You must analyze, compare, and recommend the most appropriate strategy for this system which operates in real-time and must handle thousands of tasks per second.
 


Instructions
1- Implement the Brute-Force and Greedy Algorithms

Use JavaScript to write both solutions.
Use the following input sample to validate correctness:

const tasks = [
  { start: 1, end: 3 },
  { start: 2, end: 5 },
  { start: 4, end: 6 },
  { start: 6, end: 7 },
  { start: 5, end: 9 },
  { start: 8, end: 10 }
];

2- Run Both Implementations

Confirm that both return the same correct result.
Time the execution for a large input (generate ~10,000 random tasks).
3- Compare the Two Approaches
 In a short paragraph, answer:

Which algorithm is faster for large inputs and why?
Which algorithm is easier to maintain and scale?
What are the memory trade-offs?
4- Justify Your Choice
 Based on performance, clarity, and real-world applicability, recommend one algorithm to be used in the final system. Explain why you chose it and under what conditions the other method might still be relevant.


5- Bonus (Optional): Stress Test Both Approaches
 Generate edge cases:

All tasks overlapping
All tasks non-overlapping
Tasks with the same start or end time
Evaluate how each algorithm behaves and if one fails to scale or break.