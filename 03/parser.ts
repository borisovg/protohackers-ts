import { Writable } from 'stream';

export class Parser extends Writable {
  private chunks: Buffer[] = [];

  _final(callback: (err?: Error) => void) {
    if (this.chunks.length) {
      console.error('stream ends with data in buffer', this.chunks);
    }

    callback();
  }

  _write(data: Buffer, _enc: string, callback: () => void) {
    let len = data.length;
    let i, start: number;

    for (i = 0, start = 0; i < len; i++) {
      if (data[i] !== 10) continue;

      this.chunks.push(data.subarray(start, i));
      start = i + 1;

      const msg = Buffer.concat(this.chunks).toString().trim();
      console.log('request', msg);

      this.chunks = [];
      this.emit('message', msg);
    }

    if (start < i) this.chunks.push(data.subarray(start));
    callback();
  }
}
