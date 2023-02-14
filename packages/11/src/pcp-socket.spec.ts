import { deepStrictEqual, strictEqual } from 'assert';
import { Duplex } from 'stream';
import {
  ERROR,
  HELLO,
  OK,
  encodeError,
  encodeHello,
  encodeOk,
  decodeError,
  decodeHello,
} from './pcp';
import { encodeMessage, encodeString, encodeU32, readMessage } from './tlvc';
import { PcpSocket } from './pcp-socket';

class FakeSocket extends Duplex {
  in: Buffer[] = [];
  private blocked = false;

  constructor() {
    super({
      read: () => {
        while (this.in.length) {
          if (!this.push(this.in.shift())) {
            this.blocked = true;
            break;
          }
        }
      },
      write: (msg, _enc, callback) => {
        this.emit('message', ...readMessage(msg));
        callback();
      },
    });
  }

  send(buf: Buffer) {
    if (this.blocked) {
      this.in.push(buf);
    } else {
      this.push(buf);
    }
    return this;
  }
}

describe('pcp-socket', () => {
  const socket = new FakeSocket();
  let pcpSocket: PcpSocket;

  it('sends HELLO once connected', (done) => {
    socket.once('message', (type, msg) => {
      const hello = decodeHello(msg);
      strictEqual(type, HELLO);
      strictEqual(hello.version, 1);
      done();
    });

    pcpSocket = new PcpSocket('test', socket);
  });

  it('responds with error if first message is not HELLO', (done) => {
    socket
      .once('error', (err) => {
        strictEqual(err.message, 'Rude client');
        done();
      })
      .send(encodeOk());
  });

  it('responds with error HELLO protocol does not match', (done) => {
    let counter = 0;

    socket
      .once('error', (err) => {
        strictEqual(err.message, 'Unsupported protocol');
        counter += 1;
      })
      .once('message', (type, msg) => {
        strictEqual(type, ERROR);
        deepStrictEqual(decodeError(msg).message, 'Unsupported protocol');
        counter += 1;
      })
      .send(encodeMessage(HELLO, [encodeString('foo'), encodeU32(1)]));

    (function loop() {
      if (counter < 2) {
        setTimeout(loop, 1);
      } else {
        done();
      }
    })();
  });

  it('accepts other messages after HELLO received', (done) => {
    pcpSocket.once('message', (type) => {
      strictEqual(type, OK);
      done();
    });
    socket.send(encodeHello()).send(encodeOk());
  });

  it('emits received ERROR message', (done) => {
    pcpSocket.once('error', (err) => {
      strictEqual(err.message, 'test');
      done();
    });
    socket.send(encodeError('test'));
  });
});
