'use strict';

const { createServer } = require('net');

createServer((socket) => socket.pipe(socket)).listen(10123, () =>
  console.log('Server listening')
);
