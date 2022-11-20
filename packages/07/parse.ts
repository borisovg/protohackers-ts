import { logger as log } from './logger';

type AckMsg = ['ack', number, number];
type CloseMsg = ['close', number];
type ConnectMsg = ['connect', number];
type DataMsg = ['data', number, number, string];

const patterns = [
  new RegExp('^/(ack)/([1-9]\\d{0,10})/(0|[1-9]\\d{0,9})/$'),
  new RegExp('^/(close)/([1-9]\\d{0,10})/$'),
  new RegExp('^/(connect)/([1-9]\\d{0,10})/$'),
  new RegExp('^/(data)/([1-9]\\d{0,10})/(0|[1-9]\\d{0,9})/(.*)/$', 's'),
];

export const MAX_NUM = 2147483647;
const RE_ILLEGAL = /[\\/]/;

export function parse(buf: Buffer) {
  const str = buf.toString();
  let msg;

  outer: for (const re of patterns) {
    const m = re.exec(str);

    if (!m) {
      continue;
    }

    switch (m[1]) {
      case 'ack':
        msg = m.slice(1) as unknown as AckMsg;
        msg[1] = parseInt(m[2], 10);
        msg[2] = parseInt(m[3], 10);
        break outer;
      case 'close':
        msg = m.slice(1) as unknown as CloseMsg;
        msg[1] = parseInt(m[2], 10);
        break outer;
      case 'connect':
        msg = m.slice(1) as unknown as ConnectMsg;
        msg[1] = parseInt(m[2], 10);
        break outer;
      case 'data':
        msg = m.slice(1) as unknown as DataMsg;
        msg[1] = parseInt(m[2], 10);
        msg[2] = parseInt(m[3], 10);

        if (
          msg[3].replaceAll('\\/', '').replaceAll('\\\\', '').match(RE_ILLEGAL)
        ) {
          log.debug(
            'unescaped characters in data',
            JSON.stringify(buf.toString())
          );
          return;
        }

        break outer;
    }
  }

  if (!msg) {
    return;
  } else if (msg[1] > MAX_NUM || (msg[2] && msg[2] > MAX_NUM)) {
    log.debug('number too big', JSON.stringify(buf.toString()));
    return;
  }

  return msg;
}
