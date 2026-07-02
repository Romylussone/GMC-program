class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
  }

  dequeue() {
    if (this.isEmpty()) {
      return null;
    }

    return this.items.shift();
  }

  peek() {
    if (this.isEmpty()) {
      return null;
    }

    return this.items[0];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  print() {
    return this.items;
  }
}

class PrinterQueue {
  constructor() {
    this.queue = new Queue();
  }

  addJob(name, pages) {
    const job = { name, pages };
    this.queue.enqueue(job);
    console.log(`Added job: ${name} (${pages} pages)`);
  }

  processJob() {
    if (this.queue.isEmpty()) {
      console.log("No print jobs to process.");
      return null;
    }

    const job = this.queue.dequeue();
    console.log(`Processing job: ${job.name} (${job.pages} pages)`);
    return job;
  }

  printQueue() {
    if (this.queue.isEmpty()) {
      console.log("Printer queue is empty.");
      return;
    }

    console.log("Current printer queue:");
    this.queue.print().forEach((job, index) => {
      console.log(`${index + 1}. ${job.name} - ${job.pages} pages`);
    });
  }
}

const printerQueue = new PrinterQueue();

printerQueue.addJob("Monthly Report", 10);
printerQueue.addJob("Employee Contract", 4);
printerQueue.addJob("Meeting Notes", 2);

printerQueue.printQueue();

printerQueue.processJob();
printerQueue.processJob();

printerQueue.printQueue();

printerQueue.processJob();
printerQueue.processJob();
