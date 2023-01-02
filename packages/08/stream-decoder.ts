import { Transform } from 'stream';
import { encode, decode } from './encoder';
import { log } from './logger';

const testStr = 'foobar123';

export class StreamDecoder extends Transform {
  private chunks: Buffer[] = [];
  private pos = 0;

  ops: number[][] = [];

  constructor() {
    super({
      transform: (chunk, enc, callback) => {
        let i = 0;
        let start = 0;

        if (!this.ops.length) {
          for (i = 0; i < chunk.length; i += 1) {
            if (chunk[i] === 0) {
              this.chunks.push(chunk.subarray(start, i));
              this.makeOpts(Buffer.concat(this.chunks));
              this.chunks = [];
              start = i + 1;
              break;
            }
          }
        }

        const chunk2 = decode(chunk.subarray(start), this.ops, this.pos);

        log('decoded', JSON.stringify(chunk2.toString()));

        this.pos += chunk2.length;
        start = 0;

        for (i = 0; i < chunk2.length; i += 1) {
          if (chunk2[i] !== 10) {
            continue;
          }

          this.chunks.push(chunk2.subarray(start, i));
          start = i + 1;

          this.push(Buffer.concat(this.chunks));
          this.chunks = [];
        }

        if (start < i) {
          this.chunks.push(chunk2.subarray(start));
        }

        callback();
      },
    });
  }

  makeOpts(buf: Buffer) {
    for (let i = 0; i < buf.length; i += 1) {
      const code = buf[i];

      if (code < 1 || code > 5) {
        return this.emit('error', new Error(`Unexpected code: ${code}`));
      } else if (code === 2 || code === 4) {
        const num = buf[++i] || 0;
        this.ops.push([code, num]);
      } else {
        this.ops.push([code]);
      }
    }

    if (encode(testStr, this.ops, 0).toString() === testStr) {
      this.emit(
        'error',
        new Error(`No-op cipher string: ${this.ops.join(' ')}`)
      );
    }

    log('cipher spec', this.ops);
  }
}
