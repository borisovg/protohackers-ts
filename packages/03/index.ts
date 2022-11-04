import { createServer, Socket } from 'net';
import { Parser } from './parser';

const BAD_NAME_RE = /[^A-Za-z0-9]/;
const sockets: Map<Socket, string> = new Map();

const server = createServer((socket) => {
  const parser = new Parser();
  let name = '';

  console.log('client connected');

  socket
    .on('close', () => {
      if (sockets.delete(socket)) {
        publishAll(`* ${name} has left`);
      }
      console.log('client disconnected');
    })
    .on('error', (err) => {
      console.log('socket error', err.message);
    })
    .pipe(parser)
    .on('message', (msg: string) => {
      if (name) {
        return publishAll(`[${name}] ${msg}`, socket);
      } else if (!msg || BAD_NAME_RE.exec(msg)) {
        socket.write('bad name\n');
        socket.end();
      } else {
        name = msg;
        publishAll(`* ${name} has joined`);
        socket.write(
          `* room contains: ${Array.from(sockets.values()).join(', ')}\n`
        );
        sockets.set(socket, name);
      }
    });

  socket.write(Buffer.from('your name?\n'));
});

function publishAll(msg: string, skipSocket?: Socket) {
  const buf = Buffer.from(`${msg}\n`);

  for (const socket of sockets.keys()) {
    if (socket !== skipSocket) {
      socket.write(buf);
    }
  }
}

server.listen(10123, () => console.log('Server listening'));
