import { Duplex } from 'stream';

export class LrcpSession extends Duplex {
  private blocked = false;
  private chunks = new Map<number, Buffer>();
  private data = Buffer.alloc(0);
  private written = 0;

  constructor(
    public readonly maxSize: number,
    private send: (msg: Buffer, pos: number) => void
  ) {
    super({
      read: (size) => {
        while (this.data.length) {
          const chunk = this.data.subarray(0, size);

          this.data = this.data.subarray(size);

          if (!super.push(chunk)) {
            this.blocked = true;
            break;
          }
        }

        this.blocked = false;
      },

      write: (msg: Buffer, _enc, callback) => {
        const chunks: Buffer[] = [];
        let encLen = 0;
        let rawLen = 0;
        let s = 0;

        for (let i = 0; i < msg.length; i += 1) {
          if (msg[i] === 0x2f) {
            chunks.push(msg.subarray(s, i), Buffer.from('\\/'));
            encLen += 2;
            s = i + 1;
          } else if (msg[i] === 0x5c) {
            chunks.push(msg.subarray(s, i), Buffer.from('\\\\'));
            encLen += 2;
            s = i + 1;
          } else {
            encLen += 1;
          }

          rawLen += 1;

          if (encLen >= maxSize) {
            chunks.push(msg.subarray(s, i + 1));
            this.send(Buffer.concat(chunks), rawLen);
            s = i + 1;
            rawLen = 0;
            encLen = 0;
            chunks.splice(0);
          }
        }

        if (rawLen) {
          chunks.push(msg.subarray(s));
          this.send(Buffer.concat(chunks), rawLen);
        }

        callback();
      },
    });
  }

  addChunk(pos: number, chunk: string) {
    const buf = Buffer.from(
      chunk.replaceAll('\\/', '/').replaceAll('\\\\', '\\')
    );

    if (pos + buf.length <= this.written) {
      return this.written;
    }

    this.chunks.set(pos, buf);

    const keys = Array.from(this.chunks.keys());
    let len = this.written;

    keys.sort();

    for (const pos of keys) {
      if (len != pos) {
        continue;
      }

      const chunk2 = this.chunks.get(pos) as Buffer;

      len += chunk2.length;
      this.chunks.delete(pos);

      if (this.blocked) {
        this.data = Buffer.concat([this.data, chunk2]);
      } else if (!this.push(chunk2)) {
        this.blocked = true;
      }

      this.written += chunk2.length;
    }

    return len;
  }
}
