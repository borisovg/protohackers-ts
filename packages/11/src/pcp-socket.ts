import { Writable } from 'stream';
import type { Duplex } from 'stream';
import {
  ERROR,
  HELLO,
  PROTOCOL,
  VERSION,
  decodeError,
  decodeHello,
  encodeError,
  encodeHello,
} from './pcp';
import { TlvcDecoder } from './tlvc-decoder';
import { log } from './logger';

export class PcpSocket extends Writable {
  private decoder: TlvcDecoder;
  private state: 'INITIAL' | 'HELLO' = 'INITIAL';

  constructor(id: string, private socket: Duplex) {
    super({
      write(chunk, enc, callback) {
        socket.write(chunk, enc);
        callback();
      },
    });

    this.decoder = new TlvcDecoder(id)
      .on('error', (err) => {
        socket.emit('error', err);
      })
      .on('message', (type: number, msg: Buffer) => {
        try {
          if (this.state === 'INITIAL') {
            if (type === HELLO) {
              const { protocol, version } = decodeHello(msg);
              if (protocol === PROTOCOL && version === VERSION) {
                this.state = 'HELLO';
                return;
              } else {
                throw new Error('Unsupported protocol');
              }
            } else {
              throw new Error('Rude client');
            }
          }

          if (type === HELLO) {
            throw new Error('Duplicate hello');
          } else if (type === ERROR) {
            const err = decodeError(msg);
            this.emit('error', new Error(err.message));
          } else {
            this.emit('message', type, msg);
          }
        } catch (err) {
          socket.emit('error', err);
        }
      });

    socket
      .on('error', (err) => {
        log('pcp-socket error', id, err.message);
        socket.write(encodeError(err.message));
        socket.end();
      })
      .pipe(this.decoder);

    socket.write(encodeHello());
  }
}
