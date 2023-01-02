import { Job } from './job';
import { PriorityQueue } from './priority-queue';

type WatcherFn = (job: Job) => void;

const inProgress: Map<number, Job> = new Map();
const queues: Map<string, PriorityQueue<Job>> = new Map();
const watchers: Map<WatcherFn, [number, string[]]> = new Map();

export function abort(clientId: number, jobId: number) {
  const job = inProgress.get(jobId);

  if (job) {
    if (job.clientId == clientId) {
      inProgress.delete(job.id);
      put(job.queue, job.priority, job.data);
      return true;
    } else {
      throw new Error('Forbidden');
    }
  }
}

export function abortAll(clientId: number) {
  for (const [id, job] of inProgress) {
    if (job.clientId === clientId) {
      inProgress.delete(job.id);
      put(job.queue, job.priority, job.data);
    }
  }
}

export function addWatcher(
  clientId: number,
  queueNames: string[],
  callback: WatcherFn
) {
  watchers.set(callback, [clientId, queueNames]);
}

export function get(clientId: number, queueNames: string[]) {
  let selectedQueue;
  let selectedPriority = 0;

  for (const name of queueNames) {
    const queue = queues.get(name);

    if (queue) {
      let priority = queue.maxPriority;

      if (priority > selectedPriority) {
        selectedQueue = queue;
        selectedPriority = priority;
      }
    }
  }

  if (selectedQueue) {
    const job = selectedQueue.shift() as Job;

    job.clientId = clientId;
    inProgress.set(job.id, job);

    if (!selectedQueue.size) {
      queues.delete(job.queue);
    }

    return job;
  }
}

export function remove(id: number) {
  let job = inProgress.get(id);

  if (job) {
    inProgress.delete(id);
    return true;
  }

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
    queue = new PriorityQueue();
    queues.set(queueName, queue);
  }

  queue.push(job);
  notifyWatcher(job.queue);

  return job.id;
}

function notifyWatcher(queueName: string) {
  for (const [fn, [clientId, queueNames]] of watchers) {
    if (queueNames.includes(queueName)) {
      watchers.delete(fn);
      return fn(queues.get(queueName)?.shift() as Job);
    }
  }
}
