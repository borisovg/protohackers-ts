import { Transform } from 'stream';

export class Parser extends Transform {
  private chunks: Buffer[] = [];
  private bytes = 0;

  _flush(callback: (err?: Error) => void) {
    if (this.chunks.length) {
      console.error('FLUSH', this.chunks);
      //callback(new Error('Stream ends with data in buffer'));
    } else {
      callback();
    }
  }

  _transform(data: Buffer, _encoding: string, callback: () => void) {
    const l = data.length;
    let i, s: number;

    for (i = 0, s = 0; i < l; i++) {
      this.bytes += 1;
      if (this.bytes < 9) continue;

      this.chunks.push(data.subarray(s, i + 1));
      s = i + 1;

      const req = Buffer.concat(this.chunks);
      this.chunks = [];
      this.bytes = 0;

      try {
        this.handle(req);
      } catch (e) {
        console.error('PARSER ERROR', JSON.stringify(e, undefined, 2));
      }
    }

    if (s < i) {
      const buf = data.subarray(s);
      this.chunks.push(buf);
    }

    callback();
  }

  private handle(msg: Buffer) {
    const type = String.fromCharCode(msg[0]);
    const int1 = msg.readInt32BE(1);
    const int2 = msg.readInt32BE(5);

    console.log('REQUEST', type, int1, int2, msg);

    if (type === 'I') {
      this.emit('insert', int1, int2);
    } else if (type == 'Q') {
      this.emit('query', int1, int2);
    } else {
      throw new Error(`Invalid type (${type})`);
    }
  }
}
