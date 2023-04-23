import { Transform } from 'stream';
import { log } from './logger';

export class StreamLogger extends Transform {
  constructor(clientId: number, tag: string) {
    super({
      transform(chunk: Buffer, enc, callback) {
        log(
          clientId,
          tag,
          JSON.stringify(
            (chunk.length > 50
              ? Buffer.concat([chunk.subarray(0, 50), Buffer.from(' ...')])
              : chunk
            ).toString()
          )
        );
        this.push(chunk);
        callback();
      },
    });
  }
}
