import { Transform } from 'stream';

export class NewLineSplitter extends Transform {
  constructor() {
    let chunks: Buffer[] = [];

    super({
      transform(chunk: Buffer, _encoding: unknown, callback: () => void) {
        let len = chunk.length;
        let i: number;
        let start: number;

        for (i = 0, start = 0; i < len; i++) {
          if (chunk[i] !== 10) {
            continue;
          }

          chunks.push(chunk.subarray(start, i + 1));
          start = i + 1;

          const msg = Buffer.concat(chunks);

          chunks = [];
          this.push(msg);
        }

        if (start < i) {
          chunks.push(chunk.subarray(start));
        }

        callback();
      },
    });
  }
}
