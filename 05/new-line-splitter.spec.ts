import { deepStrictEqual } from 'node:assert';
import { NewLineSplitter } from './new-line-splitter';

const lines: string[] = [];

const s = new NewLineSplitter().on('data', (line) =>
  lines.push(line.toString())
);

s.write('abc');
s.write('\ndef');
s.write('\n');
s.write('ghk\n');

setTimeout(() => {
  deepStrictEqual(lines, ['abc\n', 'def\n', 'ghk\n']);
}, 20);
