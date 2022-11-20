import { deepStrictEqual } from 'assert';
import { it } from 'node:test';
import { LineReverser } from './line-reverser';

it('LineReverser reverses lines', (done) => {
  const lr = new LineReverser();
  const out: string[] = [];

  lr.on('data', (line) => out.push(line.toString()));

  ['foo\n', 'ba', 'r\nb', 'az', '\n'].forEach((chunk) => lr.write(chunk));

  setImmediate(() => {
    deepStrictEqual(out, ['oof\n', 'rab\n', 'zab\n']);
    done();
  });
});
