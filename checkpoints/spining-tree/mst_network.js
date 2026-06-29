const readline = require("readline");

class DisjointSet {
  constructor(vertices) {
    this.parent = new Map();
    this.rank = new Map();

    for (const vertex of vertices) {
      this.parent.set(vertex, vertex);
      this.rank.set(vertex, 0);
    }
  }

  find(vertex) {
    if (this.parent.get(vertex) !== vertex) {
      this.parent.set(vertex, this.find(this.parent.get(vertex)));
    }

    return this.parent.get(vertex);
  }

  union(vertexA, vertexB) {
    const rootA = this.find(vertexA);
    const rootB = this.find(vertexB);

    if (rootA === rootB) {
      return false;
    }

    const rankA = this.rank.get(rootA);
    const rankB = this.rank.get(rootB);

    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }

    return true;
  }
}

function kruskalMST(vertices, edges) {
  const disjointSet = new DisjointSet(vertices);
  const mstEdges = [];
  let totalCost = 0;

  const sortedEdges = [...edges].sort((edgeA, edgeB) => edgeA.cost - edgeB.cost);

  for (const edge of sortedEdges) {
    if (disjointSet.union(edge.from, edge.to)) {
      mstEdges.push(edge);
      totalCost += edge.cost;
    }
  }

  if (mstEdges.length !== vertices.length - 1) {
    throw new Error("The network is disconnected; an MST cannot connect all computers.");
  }

  return { mstEdges, totalCost };
}

function readPipedInput() {
  return new Promise((resolve) => {
    let input = "";

    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      input += chunk;
    });
    process.stdin.on("end", () => {
      resolve(input.split(/\r?\n/));
    });
    process.stdin.resume();
  });
}

async function createQuestion() {
  if (!process.stdin.isTTY) {
    const answers = await readPipedInput();
    let answerIndex = 0;

    return {
      ask(question) {
        process.stdout.write(question);
        const answer = answers[answerIndex] ?? "";
        answerIndex += 1;
        return Promise.resolve(answer);
      },
      close() {},
    };
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return {
    ask(question) {
      return new Promise((resolve) => rl.question(question, resolve));
    },
    close() {
      rl.close();
    },
  };
}

function parsePositiveInteger(value, fieldName) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${fieldName} must be a positive whole number.`);
  }

  return number;
}

function parseCost(value) {
  const cost = Number(value);

  if (!Number.isFinite(cost) || cost < 0) {
    throw new Error("Cable cost must be a non-negative number.");
  }

  return cost;
}

async function getUserNetwork(prompt) {
  const computerCount = parsePositiveInteger(
    await prompt.ask("How many computers do you want to connect? "),
    "Computer count"
  );
  const vertices = [];

  for (let index = 0; index < computerCount; index += 1) {
    const computer = (await prompt.ask(`Name of computer ${index + 1}: `)).trim();

    if (!computer) {
      throw new Error("Computer name cannot be empty.");
    }

    if (vertices.includes(computer)) {
      throw new Error(`Computer "${computer}" is already in the network.`);
    }

    vertices.push(computer);
  }

  const connectionCount = parsePositiveInteger(
    await prompt.ask("How many possible cable connections are there? "),
    "Connection count"
  );
  const edges = [];

  for (let index = 0; index < connectionCount; index += 1) {
    console.log(`\nConnection ${index + 1}`);
    const from = (await prompt.ask("First computer: ")).trim();
    const to = (await prompt.ask("Second computer: ")).trim();
    const cost = parseCost(await prompt.ask("Cable cost: "));

    if (!vertices.includes(from) || !vertices.includes(to)) {
      throw new Error("Both computers must exist in the computer list.");
    }

    if (from === to) {
      throw new Error("A cable connection must link two different computers.");
    }

    edges.push({ from, to, cost });
  }

  return { vertices, edges };
}

function printResult(mstEdges, totalCost) {
  console.log("\nSelected connections for the Minimum Spanning Tree:");

  for (const edge of mstEdges) {
    console.log(`${edge.from} -- ${edge.to}: ${edge.cost}`);
  }

  console.log(`\nTotal cost of the network: ${totalCost}`);
}

function runSample() {
  const vertices = ["A", "B", "C", "D", "E"];
  const edges = [
    { from: "A", to: "B", cost: 4 },
    { from: "A", to: "C", cost: 2 },
    { from: "B", to: "C", cost: 1 },
    { from: "B", to: "D", cost: 5 },
    { from: "C", to: "D", cost: 8 },
    { from: "C", to: "E", cost: 10 },
    { from: "D", to: "E", cost: 2 },
  ];

  const { mstEdges, totalCost } = kruskalMST(vertices, edges);
  printResult(mstEdges, totalCost);
}

async function main() {
  const prompt = await createQuestion();

  try {
    const choice = (await prompt.ask("Use sample network? (y/n): ")).trim().toLowerCase();

    if (choice === "y") {
      runSample();
      return;
    }

    const { vertices, edges } = await getUserNetwork(prompt);
    const { mstEdges, totalCost } = kruskalMST(vertices, edges);
    printResult(mstEdges, totalCost);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    prompt.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DisjointSet,
  kruskalMST,
};
