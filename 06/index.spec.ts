import { connect } from 'net';
import { port } from './index';
import { codes } from './parser';
import { makeU16, makeU8 } from './stream-reader';

const socket1 = connect({ host: 'localhost', port }, () => {
  socket1.write(
    Buffer.concat([
      makeU8(codes.iAmCamera),
      makeU16(123),
      makeU16(4),
      makeU16(56),
    ])
  );
});

const socket2 = connect({ host: 'localhost', port }, () => {
  socket2.write(
    Buffer.concat([
      makeU8(codes.iAmDispatcher),
      makeU8(3),
      makeU16(10),
      makeU16(11),
      makeU16(12),
    ])
  );
});

setTimeout(() => {
  process.exit();
}, 1000);
