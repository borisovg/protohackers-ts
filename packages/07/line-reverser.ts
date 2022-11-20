import { Transform } from 'stream';
import { logger as log } from './logger';

const lineBreak = Buffer.from('\n');

export class LineReverser extends Transform {
  private chunks: Buffer[] = [];

  constructor() {
    super({
      flush: (callback) => {
        if (this.chunks.length) {
          log.warn(
            'stream ended with data in buffer',
            Buffer.concat(this.chunks).toString()
          );
        }
        callback();
      },

      transform: (chunk: Buffer, _enc, callback) => {
        let len = chunk.length;
        let i: number;
        let start: number;

        for (i = 0, start = 0; i < len; i++) {
          if (chunk[i] !== 10) {
            continue;
          }

          this.chunks.push(chunk.subarray(start, i));
          start = i + 1;

          const msg = Buffer.concat([
            Buffer.concat(this.chunks).reverse(),
            lineBreak,
          ]);

          this.chunks = [];
          this.push(msg);
        }

        if (start < i) {
          this.chunks.push(chunk.subarray(start));
        }

        callback();
      },
    });
  }
}
