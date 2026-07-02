function dijkstra(graph, start) {
  const distances = {};
  const visited = new Set();
  const vertices = new Set(Object.keys(graph));

  for (const neighbors of Object.values(graph)) {
    for (const vertex of Object.keys(neighbors)) {
      vertices.add(vertex);
    }
  }

  if (!vertices.has(start)) {
    throw new Error(`Start vertex "${start}" does not exist in the graph.`);
  }

  for (const vertex of vertices) {
    distances[vertex] = Infinity;
  }

  distances[start] = 0;

  while (visited.size < vertices.size) {
    let currentVertex = null;
    let shortestDistance = Infinity;

    for (const vertex of vertices) {
      if (!visited.has(vertex) && distances[vertex] < shortestDistance) {
        currentVertex = vertex;
        shortestDistance = distances[vertex];
      }
    }

    if (currentVertex === null) {
      break;
    }

    visited.add(currentVertex);

    const neighbors = graph[currentVertex] || {};

    for (const [neighbor, weight] of Object.entries(neighbors)) {
      if (weight < 0) {
        throw new Error("Dijkstra's algorithm does not support negative weights.");
      }

      const newDistance = distances[currentVertex] + weight;

      if (newDistance < distances[neighbor]) {
        distances[neighbor] = newDistance;
      }
    }
  }

  return distances;
}

const graph = {
  A: { B: 4, C: 2 },
  B: { A: 4, C: 5, D: 10 },
  C: { A: 2, B: 5, D: 3 },
  D: { B: 10, C: 3 },
};

console.log(dijkstra(graph, "A"));

module.exports = dijkstra;
