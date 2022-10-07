import { Writable } from 'stream';

const BAD_NAME_RE = /[^A-Za-z0-9]/;

export class ChatParser extends Writable {
  private name: string = '';

  _final() {
    if (this.name) {
      this.emit('parted', this.name);
    }
  }

  _write(buf: Buffer, _enc: unknown, callback: (err?: Error) => void) {
    const msg = buf.toString().trim();

    if (this.name) {
      this.emit('message', this.name, msg);
    } else if (!msg || BAD_NAME_RE.exec(msg)) {
      return callback(new Error('Bad name'));
    } else {
      this.name = msg;
      this.emit('joined', msg);
    }

    callback();
  }
}
