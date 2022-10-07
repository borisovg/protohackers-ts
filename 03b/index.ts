import { createServer, Socket } from 'net';
import { ChatParser } from './chat-parser';
import * as log from './logger';
import { NewLineSplitter } from './new-line-splitter';

const BAD_NAME_RE = /[^A-Za-z0-9]/;
const sockets: Map<Socket, string> = new Map();

const server = createServer((socket) => {
  log.info('client connected');

  socket
    .on('close', () => {
      log.info('client disconnected');
    })
    .on('error', (err) => {
      log.error('socket error', err.message);
    })
    .pipe(new NewLineSplitter())
    .pipe(new ChatParser())
    .on('joined', (name: string) => {
      publish(
        `* room contains: ${Array.from(sockets.values()).join(', ')}`,
        socket
      );
      publishAll(`* ${name} has joined`);
      sockets.set(socket, name);
    })
    .on('error', (err) => {
      if (err.message === 'Bad name') {
        publish('bad name', socket);
      }
      socket.end();
    })
    .on('message', (name: string, msg: string) => {
      return publishAll(`[${name}] ${msg}`, socket);
    })
    .on('parted', (name: string) => {
      if (sockets.delete(socket)) {
        publishAll(`* ${name} has left`);
      }
    });

  publish('your name?', socket);
});

function publish(msg: string, socket: Socket) {
  socket.write(Buffer.from(`${msg}\n`));
}

function publishAll(msg: string, skipSocket?: Socket) {
  const buf = Buffer.from(`${msg}\n`);

  for (const socket of sockets.keys()) {
    if (socket !== skipSocket) {
      socket.write(buf);
    }
  }
}

server.listen(10123, () => console.log('Server listening'));
