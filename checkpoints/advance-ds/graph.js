class Graph {
  constructor(isDirected = false) {
    this.isDirected = isDirected;
    this.adjacencyList = new Map();
  }

  addVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, new Set());
    }
  }

  addEdge(source, destination) {
    this.addVertex(source);
    this.addVertex(destination);

    this.adjacencyList.get(source).add(destination);

    if (!this.isDirected) {
      this.adjacencyList.get(destination).add(source);
    }
  }

  removeEdge(source, destination) {
    if (this.adjacencyList.has(source)) {
      this.adjacencyList.get(source).delete(destination);
    }

    if (!this.isDirected && this.adjacencyList.has(destination)) {
      this.adjacencyList.get(destination).delete(source);
    }
  }

  hasEdge(source, destination) {
    return (
      this.adjacencyList.has(source) &&
      this.adjacencyList.get(source).has(destination)
    );
  }

  printGraph() {
    for (const [vertex, neighbors] of this.adjacencyList) {
      console.log(`${vertex} -> ${Array.from(neighbors).join(", ")}`);
    }
  }

  dfs(start) {
    const visited = new Set();
    const order = [];

    const visit = (vertex) => {
      if (!this.adjacencyList.has(vertex) || visited.has(vertex)) {
        return;
      }

      visited.add(vertex);
      order.push(vertex);

      for (const neighbor of this.adjacencyList.get(vertex)) {
        visit(neighbor);
      }
    };

    visit(start);
    console.log(`DFS from ${start}: ${order.join(" -> ")}`);
    return order;
  }

  bfs(start) {
    if (!this.adjacencyList.has(start)) {
      console.log(`BFS from ${start}: `);
      return [];
    }

    const visited = new Set([start]);
    const queue = [start];
    const order = [];

    while (queue.length > 0) {
      const vertex = queue.shift();
      order.push(vertex);

      for (const neighbor of this.adjacencyList.get(vertex)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    console.log(`BFS from ${start}: ${order.join(" -> ")}`);
    return order;
  }
}

function assertEqual(actual, expected, label) {
  const actualText = actual.join(",");
  const expectedText = expected.join(",");
  const result = actualText === expectedText ? "PASS" : "FAIL";

  console.log(`${label}: ${result}`);

  if (result === "FAIL") {
    console.log(`  Expected: ${expected.join(" -> ")}`);
    console.log(`  Actual:   ${actual.join(" -> ")}`);
  }
}

console.log("Undirected graph");
const graph = new Graph();

graph.addEdge("A", "B");
graph.addEdge("A", "C");
graph.addEdge("B", "D");

graph.printGraph();
console.log(`Has edge A-B: ${graph.hasEdge("A", "B")}`);
graph.removeEdge("A", "C");
console.log(`Has edge A-C after removal: ${graph.hasEdge("A", "C")}`);

const dfsOrder = graph.dfs("A");
const bfsOrder = graph.bfs("A");

assertEqual(dfsOrder, ["A", "B", "D"], "Undirected DFS order");
assertEqual(bfsOrder, ["A", "B", "D"], "Undirected BFS order");

console.log("\nDirected graph");
const directedGraph = new Graph(true);

directedGraph.addEdge("A", "B");
directedGraph.addEdge("A", "C");
directedGraph.addEdge("B", "D");

directedGraph.printGraph();
console.log(`Has edge A-B: ${directedGraph.hasEdge("A", "B")}`);
console.log(`Has edge B-A: ${directedGraph.hasEdge("B", "A")}`);

const directedDfsOrder = directedGraph.dfs("A");
const directedBfsOrder = directedGraph.bfs("A");

assertEqual(directedDfsOrder, ["A", "B", "D", "C"], "Directed DFS order");
assertEqual(directedBfsOrder, ["A", "B", "C", "D"], "Directed BFS order");
