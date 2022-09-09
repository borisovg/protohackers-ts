'use strict';

import { createServer } from 'net';
import { Parser } from './Parser';

const server = createServer((socket) => {
  const parser = new Parser();

  socket
    .pipe(parser)
    .on('error', (err) => {
      console.error('PARSER ERROR', JSON.stringify(err, undefined, 2));
      socket.write(JSON.stringify(err) + '\n');
      socket.end();
    })
    .pipe(socket)
    .on('error', (err) => {
      console.error('SOCKET ERROR', JSON.stringify(err, undefined, 2));
    });
});

server.listen(10123, () => console.log('Server listening'));
