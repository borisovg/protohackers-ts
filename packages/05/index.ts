import { connect, createServer } from 'node:net';
import * as log from './logger';
import { Mitm } from './mitm';
import { NewLineSplitter } from './new-line-splitter';

createServer((socket) => {
  log.info('client connected');

  const remote = connect({ host: 'chat.protohackers.com', port: 16963 });

  socket
    .on('error', (err) => {
      log.error('client error', err.message);
    })
    .pipe(new NewLineSplitter())
    .pipe(new Mitm())
    .pipe(remote)
    .on('error', (err) => {
      log.error('remote error', err.message);
    })
    .pipe(new NewLineSplitter())
    .pipe(new Mitm())
    .pipe(socket);
}).listen(10123, () => log.info('Server listening'));
