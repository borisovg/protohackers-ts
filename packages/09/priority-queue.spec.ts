import { deepStrictEqual } from 'node:assert';
import { PriorityQueue } from './priority-queue';

let id = 0;

const queue = new PriorityQueue();
const data = [
  7577, 6934, 7088, 5959, 6899, 5147, 6297, 2622, 3805, 5896, 6491, 1926, 4704,
  1688, 6000,
];

data.forEach((priority) => queue.push({ id: ++id, priority }));

deepStrictEqual(queue.size, data.length);
deepStrictEqual(queue.shift()?.priority, 7577);
deepStrictEqual(queue.shift()?.priority, 7088);
deepStrictEqual(queue.shift()?.priority, 6934);
deepStrictEqual(queue.shift()?.priority, 6899);
