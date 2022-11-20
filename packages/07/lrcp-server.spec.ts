import { LrcpServer } from './lrcp-server';

const rinfo = {
  address: '192.0.2.1',
  port: 1234,
  family: 'IPv4',
  size: 0,
} as const;
const server = new LrcpServer();

server.handleConnect(123, rinfo);
server.handleData(123, 0, 'hello\n', rinfo);

setImmediate(() => {
  server.close();
});
