import { Writable } from 'stream';
import { LEN_HEAD, readHeader, readMessage } from './tlvc';

export class TlvcDecoder extends Writable {
  private bytesAvailable = 0;
  private bytesWanted = 0;
  private chunks: Buffer[] = [];
  private state: 'INITIAL' | 'HEADER' | 'REMAINDER' | 'ERROR' = 'INITIAL';

  constructor(private id: string) {
    super({
      write: (chunk: Buffer, _enc, callback) => {
        this.bytesAvailable += chunk.length;
        this.chunks.push(chunk);

        while (true) {
          try {
            if (this.state === 'INITIAL') {
              if (this.readHeader()) {
                this.state = 'HEADER';
              }
            }

            if (this.state === 'HEADER') {
              if (this.readMessage()) {
                this.state = this.bytesAvailable ? 'REMAINDER' : 'INITIAL';
              }
            }

            if (this.state === 'REMAINDER') {
              if (this.readHeader()) {
                this.state = 'HEADER';
                continue;
              } else {
                this.state = 'INITIAL';
              }
            }

            break;
          } catch (err) {
            this.state = 'ERROR';
            this.emit('error', err);
            this.end();
          }
        }

        callback();
      },
    });
  }

  readHeader() {
    if (this.bytesAvailable >= LEN_HEAD) {
      const [type, len] = readHeader(Buffer.concat(this.chunks));
      this.bytesWanted = len;
      return true;
    }
  }

  readMessage() {
    if (this.bytesAvailable >= this.bytesWanted) {
      const [type, msg, remainder] = readMessage(Buffer.concat(this.chunks));
      this.bytesAvailable = remainder.length;
      this.chunks = [remainder];
      this.emit('message', type, msg);
      return true;
    }
  }
}
