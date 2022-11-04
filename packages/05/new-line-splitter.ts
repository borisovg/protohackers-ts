import { Transform } from 'stream';
import * as log from './logger';

export class NewLineSplitter extends Transform {
  private chunks: Buffer[] = [];

  _flush(callback: (err?: Error) => void) {
    if (this.chunks.length) {
      log.warn(
        'stream ended with data in buffer',
        Buffer.concat(this.chunks).toString()
      );
    }
    callback();
  }

  _transform(chunk: Buffer, _encoding: unknown, callback: () => void) {
    let len = chunk.length;
    let i: number;
    let start: number;

    for (i = 0, start = 0; i < len; i++) {
      if (chunk[i] !== 10) {
        continue;
      }

      this.chunks.push(chunk.subarray(start, i + 1));
      start = i + 1;

      const msg = Buffer.concat(this.chunks);

      this.chunks = [];
      this.push(msg);
    }

    if (start < i) {
      this.chunks.push(chunk.subarray(start));
    }

    callback();
  }
}
