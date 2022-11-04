import { Transform } from 'stream';
import * as assert from 'assert';
import { isPrime } from './isPrime';

type Request = {
  method: 'isPrime';
  number: number;
};

export class Parser extends Transform {
  private chunks: Buffer[] = [];

  _flush(callback: (err?: Error) => void) {
    if (this.chunks.length) {
      callback(new Error('Stream ends with data in buffer'));
    } else {
      callback();
    }
  }

  _transform(data: Buffer, _encoding: string, callback: () => void) {
    let i, s, l: number;

    for (i = 0, l = data.length, s = 0; i < l; i++) {
      if (data[i] !== 10) continue;

      this.chunks.push(data.subarray(s, i));
      s = i + 1;

      const req = Buffer.concat(this.chunks).toString();
      console.log('REQUEST', req);

      try {
        this.handle(this.decode(req));
      } catch (e) {
        this.emit('error', {
          error: (e as Error).message,
          data: req,
        });
      }

      this.chunks = [];
    }

    if (s < i) this.chunks.push(data.subarray(s));
    callback();
  }

  private decode(data: string) {
    const req = JSON.parse(data) as Request;

    assert.strictEqual(req.method, 'isPrime');
    assert.strictEqual(typeof req.number, 'number');

    return req;
  }

  private handle(req: Request) {
    this.push(
      JSON.stringify({
        method: 'isPrime',
        prime: isPrime(Math.floor(req.number)),
      }) + '\n'
    );
  }
}
