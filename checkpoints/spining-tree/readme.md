# Minimum Spanning Tree Cable Layout

This checkpoint designs a low-cost cable layout for connecting computers in an office.
Computers are represented as vertices, and possible cable connections are represented as weighted edges.

The solution in `mst_network.js` uses Kruskal's algorithm with a Disjoint Set (Union-Find) data structure to:

- Sort connections by cable cost.
- Select the cheapest connections that do not form a cycle.
- Stop when every computer is connected.
- Print the selected connections and the total network cost.

## Run

```bash
node mst_network.js
```

When prompted, enter `y` to run the sample network or `n` to add computers and cable costs dynamically.

## Sample Output

```text
Selected connections for the Minimum Spanning Tree:
B -- C: 1
A -- C: 2
D -- E: 2
B -- D: 5

Total cost of the network: 10
```
