import { createServer } from 'node:net';
import { Handler } from './handler';
import { log } from './logger';
import { NewLineSplitter } from './new-line-splitter';

let id = 0;

createServer((socket) => {
  const clientId = ++id;

  log(clientId, 'CONNECT');

  socket
    .on('close', () => {
      log(clientId, 'CLOSE');
    })
    .on('error', (err) => {
      log(clientId, 'SOCKET ERROR', err.message);
    })
    .pipe(new NewLineSplitter())
    .pipe(new Handler(clientId))
    .pipe(socket);
}).listen(10123, () => log('SERVER LISTENING'));
