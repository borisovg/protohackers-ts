import { createServer, Socket } from 'node:net';
import { log } from './logger';
import { encode } from './encoder';
import { StreamDecoder } from './stream-decoder';

export const port = 10123;

const testStr = 'foobar123';
let id = 0;

createServer(async (socket: Socket & { _id?: string }) => {
  socket._id = `id-${++id}`;
  log(socket._id, 'client connected');

  const decoder = new StreamDecoder();
  let posOut = 0;

  socket
    .on('close', () => {
      log(socket._id, 'client disconnected');
    })
    .on('error', (err) => {
      log(socket._id, 'socket error');
      socket.destroy();
    })
    .pipe(decoder)
    .on('error', (err) => {
      log(socket._id, 'decoder error');
      socket.destroy();
    })
    .on('data', (buf: Buffer) => {
      const line = buf.toString();

      log('line', line);

      const res = line
        .split(',')
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
        .shift();

      if (res) {
        const buf2 = encode(`${res}\n`, decoder.ops, posOut);

        log('response', res, 'as', buf2.toString('hex'));

        posOut += buf2.length;
        socket.write(buf2);
      }
    });
}).listen(port, () => log('Server listening'));
