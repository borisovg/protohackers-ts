import { strictEqual } from 'assert';
import { Transform } from 'stream';
import { log } from './logger';
import { abort, abortAll, addWatcher, get, put, remove } from './queue';
import type { Job } from './job';

type AbortRequest = {
  id: number;
  request: 'abort';
};

type DeleteRequest = {
  id: number;
  request: 'delete';
};

type GetRequest = {
  queues: string[];
  request: 'get';
  wait?: true;
};

type PutRequest = {
  job: unknown;
  pri: number;
  queue: string;
  request: 'put';
};

export class Handler extends Transform {
  private chunks: Buffer[] = [];

  constructor(private readonly clientId: number) {
    super();

    this.on('close', () => {
      abortAll(clientId);
    });
  }

  _transform(buf: Buffer, _enc: string, callback: () => void) {
    let res;

    //log(this.clientId, 'REQUEST', buf.toString().trim());

    try {
      const req = getMessage(buf);

      if (req.request === 'abort') {
        res = { status: abort(this.clientId, req.id) ? 'ok' : 'no-job' };
      } else if (req.request === 'delete') {
        res = { status: remove(req.id) ? 'ok' : 'no-job' };
      } else if (req.request === 'get') {
        const job = get(this.clientId, req.queues);

        if (!job && req.wait) {
          return addWatcher(this.clientId, req.queues, (job) => {
            this.sendResponse(this.makeGetResponse(job));
          });
        }

        res = this.makeGetResponse(job);
      } else if (req.request === 'put') {
        const id = put(req.queue, req.pri, req.job);
        res = res = { id, status: 'ok' };
      }
    } catch (err) {
      const err2 = err as Error;
      log('ERROR', err2.stack);
      res = { status: 'error', error: err2.message };
    }

    this.sendResponse(res);
    callback();
  }

  makeGetResponse(job?: Job) {
    if (!job) {
      return { status: 'no-job' };
    }

    job.clientId = this.clientId;

    return {
      id: job.id,
      job: job.data,
      pri: job.priority,
      queue: job.queue,
      status: 'ok',
    };
  }

  sendResponse(res: unknown) {
    this.push(Buffer.from(JSON.stringify(res) + '\n'));
    //log(this.clientId, 'RESPONSE', JSON.stringify(res));
  }
}

function getMessage(buf: Buffer) {
  const msg = JSON.parse(buf.toString()) as
    | AbortRequest
    | DeleteRequest
    | GetRequest
    | PutRequest;

  if (msg.request === 'put') {
    strictEqual(typeof msg.pri, 'number');
    strictEqual(typeof msg.queue, 'string');
  } else if (msg.request === 'get') {
    strictEqual(typeof msg.queues.pop, 'function');
    msg.queues.forEach((item) => strictEqual(typeof item, 'string'));
    if (msg.wait) strictEqual(msg.wait, true);
  } else if (msg.request === 'delete') {
    strictEqual(typeof msg.id, 'number');
  } else if (msg.request === 'abort') {
    strictEqual(typeof msg.id, 'number');
  } else {
    throw new Error('Bad request');
  }

  return msg;
}
