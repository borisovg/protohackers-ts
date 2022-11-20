import { deepStrictEqual, strictEqual } from 'assert';
import { it } from 'node:test';
import { LrcpSession } from './lrcp-session';

it('LrpcSession behaves as a readable stream', (done) => {
  const session = new LrcpSession(100, () => {});
  const out: Buffer[] = [];

  session.on('data', (chunk) => out.push(chunk));

  strictEqual(session.addChunk(0, 'Foo'), 3);
  strictEqual(session.addChunk(6, 'Baz'), 3);
  strictEqual(session.addChunk(3, 'Bar'), 9);

  setImmediate(() => {
    strictEqual(Buffer.concat(out).toString(), 'FooBarBaz');
    done();
  });
});

it('LrpcSession behaves as a writeable stream', (done) => {
  const out: Buffer[] = [];
  const session = new LrcpSession(100, (chunk, len) => {
    out.push(chunk);
    strictEqual(len, 3);
  });

  session.write('Foo');
  session.write('Bar');
  session.write('Baz');

  setImmediate(() => {
    strictEqual(Buffer.concat(out).toString(), 'FooBarBaz');
    done();
  });
});

it('LrpcSession correctly chunks data', (done) => {
  const exected = [
    ['Fo', 2],
    ['oB', 2],
    ['ar', 2],
    ['Ba', 2],
    ['z', 1],
  ];

  const out: Buffer[] = [];
  const session = new LrcpSession(2, (chunk, len) => {
    deepStrictEqual([chunk.toString(), len], exected.shift());
    out.push(chunk);
  });

  session.write('FooBarBaz');

  setImmediate(() => {
    strictEqual(Buffer.concat(out).toString(), 'FooBarBaz');
    done();
  });
});

it('LrpcSession correctly chunks data with escaped characters', (done) => {
  const exected = [
    ['a\\\\', 2],
    ['bc', 2],
    ['d\\/', 2],
    ['e', 1],
  ];

  const out: Buffer[] = [];
  const session = new LrcpSession(2, (chunk, len) => {
    deepStrictEqual([chunk.toString(), len], exected.shift());
    out.push(chunk);
  });

  session.write(Buffer.from('a\\bcd/e'));

  setImmediate(() => {
    strictEqual(Buffer.concat(out).toString(), 'a\\\\bcd\\/e');
    done();
  });
});
