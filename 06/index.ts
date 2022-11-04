import { createServer, Socket } from 'node:net';
import { logger as log } from './logger';
import {
  handleDisconnect,
  handleError,
  handleIAmCamera,
  handleIAmDispatcher,
  handlePlate,
} from './handlers';
import { codes, makeHeartbeat, Parser } from './parser';

export const port = 10123;
let id = 0;

createServer(async (socket: Socket & { _id?: string }) => {
  socket._id = `id-${++id}`;
  log.info(socket._id, 'client connected');

  const parser = new Parser(socket);
  let hbInterval = -1;
  let timer: NodeJS.Timer;

  socket
    .on('close', () => {
      log.info(socket._id, 'client disconnected');
      clearInterval(timer);
      handleDisconnect(socket);
    })
    .on('error', (err) => {
      handleError(err.message, socket);
    });

  while (!socket.closed) {
    const code = await parser.readU8();

    if (code === codes.iAmCamera) {
      const msg = await parser.readIAmCamera();
      handleIAmCamera(msg, socket);
    } else if (code === codes.iAmDispatcher) {
      const msg = await parser.readIAmDispatcher();
      handleIAmDispatcher(msg, socket);
    } else if (code === codes.plate) {
      const msg = await parser.readPlate();
      handlePlate(msg, socket);
    } else if (code === codes.wantHeartbeat) {
      if (hbInterval > -1) {
        return handleError('duplicate heartbeat request', socket);
      }

      const { interval } = await parser.readWantHeartBeat();

      hbInterval = interval;

      if (hbInterval) {
        timer = setInterval(() => {
          log.info(socket._id, 'send heartbeat');
          socket.write(makeHeartbeat());
        }, hbInterval * 100);
      }
    } else {
      return handleError(`Unexpected code: ${code}`, socket);
    }
  }
}).listen(port, () => log.info('Server listening'));
