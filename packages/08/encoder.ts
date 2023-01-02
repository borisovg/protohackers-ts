import { add, addpos, reverse, subpos, xor, xorpos } from './ops';
import { log } from './logger';

export function encode(str: string, ops: number[][], pos: number) {
  const buf = Buffer.from(str);

  log('before encode', ops, buf.toString('hex'));

  for (const [op, num] of ops) {
    if (op === 1) {
      reverse(buf);
    } else if (op === 2) {
      xor(buf, num);
    } else if (op === 3) {
      xorpos(buf, pos);
    } else if (op === 4) {
      add(buf, num);
    } else if (op === 5) {
      addpos(buf, pos);
    }
    log('after encode', op, buf.toString('hex'));
  }

  return buf;
}

export function decode(buf: Buffer, ops: number[][], pos: number) {
  log('before decode', ops, buf.toString('hex'));

  for (let i = ops.length - 1; i > -1; i--) {
    const [op, num] = ops[i];

    if (op === 1) {
      reverse(buf);
    } else if (op === 2) {
      xor(buf, num);
    } else if (op === 3) {
      xorpos(buf, pos);
    } else if (op === 4) {
      add(buf, -num);
    } else if (op === 5) {
      subpos(buf, pos);
    }
    log('after decode', ops[i], buf.toString('hex'));
  }

  return buf;
}
