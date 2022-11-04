import { strictEqual } from 'node:assert';
import { Mitm } from './mitm';

new Mitm()
  .on('data', (chunk) => {
    strictEqual(chunk.toString(), 'test message\n');
  })
  .write(Buffer.from('test message\n'));

new Mitm()
  .on('data', (chunk) => {
    strictEqual(chunk.toString(), '7YWHMfk9JZe0LM0g1ZauHuiSxhI\n');
  })
  .write(Buffer.from('7F1u3wSD5RbOHQmupo9nx4TnhQ\n'));

new Mitm()
  .on('data', (chunk) => {
    strictEqual(chunk.toString(), 'key 7YWHMfk9JZe0LM0g1ZauHuiSxhI\n');
  })
  .write(Buffer.from('key 7iKDZEwPZSqIvDnHvVN2r0hUWXD5rHX\n'));

new Mitm()
  .on('data', (chunk) => {
    strictEqual(chunk.toString(), 'key 7YWHMfk9JZe0LM0g1ZauHuiSxhI key\n');
  })
  .write(Buffer.from('key 7adNeSwJkMakpEcln9HEtthSRtxdmEHOT8T key\n'));
