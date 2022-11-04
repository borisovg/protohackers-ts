import { createSocket, RemoteInfo } from 'dgram';

const MAX_SIZE = 1000;

const db = new Map([['version', 'GB KVS 1.0']]);

const socket = createSocket('udp4', (msg, rinfo) => {
  if (rinfo.size > 1000) {
    return console.log('incoming message too large', rinfo);
  }

  let key, val;

  for (let i = 0; i < msg.length; i++) {
    if (msg[i] === 61) {
      key = msg.slice(0, i).toString();
      val = msg.slice(i + 1).toString();
      break;
    }
  }

  if (key === undefined) {
    val = msg.toString();
  }

  if (key || key === '') {
    console.log('set', key, val);
    if (key === 'version') return;
    db.set(key, val || '');
  } else {
    console.log('get', val);
    send(`${val}=${db.get(val || '') || ''}`, rinfo);
  }
});

function send(msg: string, { address, port }: RemoteInfo) {
  console.log('send', msg);

  const buf = Buffer.from(msg);

  if (buf.length > 1000) {
    return console.log('outgoing message too large', buf.length);
  }

  socket.send(buf, port, address);
}

socket.bind(10123, () => console.log('Server listening'));
