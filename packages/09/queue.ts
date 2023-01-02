import { Job } from './job';

type WatcherFn = (job: Job) => void;

const queues: Map<string, Map<number, Job>> = new Map();
const watchers: Map<WatcherFn, string[]> = new Map();

export function abort(clientId: number, jobId: number) {
  for (const queue of queues.values()) {
    const job = queue.get(jobId);

    if (!job) {
      continue;
    } else if (job.clientId == clientId) {
      job.clientId = 0;
      notifyWatcher(job);
      return true;
    } else {
      throw new Error('Forbidden');
    }
  }
}

export function abortAll(clientId: number) {
  for (const queue of queues.values()) {
    for (const job of queue.values()) {
      if (job.clientId === clientId) {
        job.clientId = 0;
        notifyWatcher(job);
      }
    }
  }
}

export function addWatcher(queueNames: string[], callback: WatcherFn) {
  watchers.set(callback, queueNames);
}

export function get(queueNames: string[]) {
  let nextJob;

  for (const name of queueNames) {
    const queue = queues.get(name);

    if (!queue) {
      continue;
    }

    for (const job of queue.values()) {
      if (job.clientId) {
        continue;
      } else if (!nextJob || job.priority > nextJob.priority) {
        nextJob = job;
      }
    }
  }

  return nextJob;
}

export function remove(id: number) {
  for (const [name, queue] of queues) {
    if (queue.delete(id)) {
      if (!queue.size) {
        queues.delete(name);
      }

      return true;
    }
  }
}

export function put(queueName: string, priority: number, data: unknown) {
  const job = new Job(queueName, priority, data);

  let queue = queues.get(queueName);

  if (!queue) {
    queue = new Map();
    queues.set(queueName, queue);
  }

  queue.set(job.id, job);
  notifyWatcher(job);

  return job.id;
}

function notifyWatcher(job: Job) {
  for (const [fn, queueNames] of watchers) {
    if (queueNames.includes(job.queue)) {
      watchers.delete(fn);
      fn(job);
      break;
    }
  }
}
