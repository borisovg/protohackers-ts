'use strict';

import { createServer } from 'net';
import { Parser } from './Parser';

const server = createServer((socket) => {
  const store: [number, number][] = [];
  const parser = new Parser();

  socket
    .on('error', (err) => {
      console.error('SOCKET ERROR', JSON.stringify(err, undefined, 2));
    })
    .pipe(parser)
    .on('insert', (time: number, pence: number) => {
      store.push([time, pence]);
    })
    .on('query', (minTime: number, maxTime: number) => {
      let sum = 0;
      let count = 0;

      for (let i = 0, l = store.length; i < l; i += 1) {
        const [time, price] = store[i];

        if (time >= minTime && time <= maxTime) {
          sum += price;
          count += 1;
        }
      }

      const mean = Math.floor(sum / count);
      const res = Buffer.allocUnsafe(4);
      res.writeInt32BE(mean);

      console.log('RESPONSE', mean, res);
      socket.write(res);
    });
});

server.listen(10123, () => console.log('Server listening'));
