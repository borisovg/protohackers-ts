import { createServer } from 'node:net';
import { log } from './logger';
import { StreamLogger } from './stream-logger';
import { StreamReader } from './stream-reader';
import { Store } from './store';

const store = new Store();
let id = 0;

const reBadPath = /[^\w-\/.]/;
const reBadData = /[^\x00-\x7F]/;

createServer(async (socket) => {
  const clientId = ++id;
  const input = new StreamLogger(clientId, '-->');
  const output = new StreamLogger(clientId, '<--');
  const sr = new StreamReader(clientId, input);

  log(clientId, 'CONNECT');

  socket
    .on('close', () => {
      log(clientId, 'CLOSE');
    })
    .on('error', (err) => {
      log(clientId, 'SOCKET ERROR', err.message);
      socket.destroy();
    });

  socket.pipe(input);
  output.pipe(socket);

  outer: while (!socket.closed) {
    output.write('READY\n');

    const msg = (await sr.readLine()).toString().split(' ');
    log(clientId, 'MESSAGE', ...msg);

    const cmd = msg[0].toUpperCase();
    const path = msg[1];

    if (path && (path[0] !== '/' || reBadPath.exec(path))) {
      output.write(Buffer.from('ERR illegal file name\n'));
      continue;
    }

    if (cmd === 'GET') {
      if (!path || msg.length > 3) {
        output.write(Buffer.from('ERR usage: GET file [revision]\n'));
        continue;
      }

      const data = store.get(path, msg[2]);

      if (data) {
        output.write(`OK ${data.length}\n`);
        output.write(data);
      } else {
        output.write(Buffer.from('ERR no such file\n'));
      }
    } else if (cmd === 'LIST') {
      if (!path || msg.length > 2) {
        output.write(Buffer.from('ERR usage: LIST dir\n'));
        continue;
      }

      const matches = store.list(path);

      output.write(`OK ${matches.length}\n`);

      for (const [name, rev] of matches) {
        output.write(`${name} ${rev}\n`);
      }
    } else if (cmd === 'PUT') {
      if (!path || msg.length > 3) {
        output.write(Buffer.from('ERR usage: PUT file length newline data\n'));
        continue;
      }

      const data = await sr.readBytes(parseInt(msg[2], 10));
      log(clientId, 'PUT DATA', JSON.stringify(data.toString()));

      for (let i = 0; i < data.length; i += 1) {
        if (
          (data[i] < 0x20 && data[i] !== 9 && data[i] !== 10) ||
          data[i] > 0x7f
        ) {
          log(clientId, 'BAD CHAR', data[i]);
          output.write(Buffer.from('ERR text files only\n'));
          continue outer;
        }
      }

      const rev = store.set(path, data);

      output.write(`OK ${rev}\n`);
    } else if (cmd === 'HELP') {
      output.write(Buffer.from('OK usage: HELP|GET|PUT|LIST\n'));
    } else {
      output.write(Buffer.from(`ERR illegal method: ${cmd}\n`));
    }
  }
}).listen(10123, () => log('SERVER LISTENING'));
