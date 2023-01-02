import { deepStrictEqual } from 'node:assert';
import { it } from 'node:test';
import { encode, decode } from './encoder';

it('encodes data correctly', async () => {
  const data = [
    [[[2, 1], [1]], Buffer.from([0x96, 0x26, 0xb6, 0xb6, 0x76])],
    [[[3]], Buffer.from([0x68, 0x64, 0x6e, 0x6f, 0x6b])],
    [[[4, 2]], Buffer.from([0x6a, 0x67, 0x6e, 0x6e, 0x71])],
    [[[5], [5]], Buffer.from([0x68, 0x67, 0x70, 0x72, 0x77])],
  ] as const;

  for (const [ops, buf] of data) {
    deepStrictEqual(encode('hello', ops as unknown as number[][], 0), buf);
  }
});

it('decodes data correctly', async () => {
  const data = [
    [[[2, 1], [1]], Buffer.from([0x96, 0x26, 0xb6, 0xb6, 0x76])],
    [[[3]], Buffer.from([0x68, 0x64, 0x6e, 0x6f, 0x6b])],
    [[[4, 2]], Buffer.from([0x6a, 0x67, 0x6e, 0x6e, 0x71])],
    [[[5], [5]], Buffer.from([0x68, 0x67, 0x70, 0x72, 0x77])],
  ] as const;

  const hello = Buffer.from('hello');

  for (const [ops, buf] of data) {
    deepStrictEqual(decode(buf, ops as unknown as number[][], 0), hello);
  }
});
