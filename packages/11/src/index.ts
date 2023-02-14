import { createServer } from 'node:net';
import { log } from './logger';
import { updateCounts } from './sites';
import { PcpSocket } from './pcp-socket';
import { SV, decodeSiteVisit } from './pcp';
import { config } from './config';

let id = 0;

createServer(async (socket) => {
  const clientId = `client-${++id}`;
  const client = new PcpSocket(clientId, socket);

  socket.setTimeout(30000, () => {
    socket.emit('error', new Error('Timeout'));
  });

  client.on('message', (type: number, msg: Buffer) => {
    if (type === SV) {
      const { populations, site } = decodeSiteVisit(msg);
      log('SiteVisit', clientId, site, JSON.stringify(populations));
      updateCounts(site, populations);
    } else {
      socket.emit('error', new Error('Unexpected message type'));
    }
  });
}).listen(config.port, () => log('server listening'));
