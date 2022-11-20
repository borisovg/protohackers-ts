import { deepEqual } from 'assert';
import { MAX_NUM, parse } from './parse';

const testCases = [
  ['/ack/1234567/0/', ['ack', 1234567, 0]],
  ['/close/1234567/', ['close', 1234567]],
  ['/connect/1234567/', ['connect', 1234567]],
  ['/data/1234567/0/hello/', ['data', 1234567, 0, 'hello']],
  ['/data/890839151/0/hello\n/', ['data', 890839151, 0, 'hello\n']],
  ['/data/123/234/foo\\\\bar/', ['data', 123, 234, 'foo\\\\bar']],
  ['/data/0/0/bad session id/', undefined],
  [`/data/${MAX_NUM + 1}/0/bad session id/`, undefined],
  [`/data/1/${MAX_NUM + 1}/bad pos/`, undefined],
  [`/data/1/0/bad\\data/`, undefined],
  [`/data/1/0/bad/data/`, undefined],
  [`/data/1/0/bad data\\/`, undefined],
] as const;

for (const [str, out] of testCases) {
  deepEqual(parse(Buffer.from(str)), out);
}
