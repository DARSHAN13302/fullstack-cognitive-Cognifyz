'use strict';
class InMemoryJobQueue {
  constructor() {
    this.queue = [];
    this.completed = [];
  }
  enqueue(type, payload) {
    const job = { id: `job-${Date.now()}-${this.queue.length + 1}`, type, payload, status: 'queued' };
    this.queue.push(job);
    return job;
  }
  async processNext(handler) {
    const job = this.queue.shift();
    if (!job) return null;
    job.status = 'processing';
    job.result = await handler(job);
    job.status = 'completed';
    this.completed.push(job);
    return job;
  }
}

module.exports = { InMemoryJobQueue };
