import { strictEqual, rejects } from 'node:assert';
import { Transform } from 'node:stream';
import { describe, it } from 'node:test';
import { StreamReader } from './stream-reader';

describe('StreamReader.readBytes()', () => {
  it('returns next line in the string', async () => {
    const data = Buffer.from('foobaarbaaaz');
    const reader = new StreamReader(makeStream(data));

    for (const val of ['foo', 'baar', 'baaaz']) {
      const res = await reader.readBytes(val.length);
      strictEqual(res.toString(), val);
    }
  });
});

describe('StreamReader.readLine()', () => {
  it('returns next line in the string', async () => {
    const data = Buffer.from('foo\nbar\nbaz\n');
    const reader = new StreamReader(makeStream(data));

    for (const val of ['foo', 'bar', 'baz']) {
      const res = await reader.readLine();
      strictEqual(res.toString(), val);
    }
  });

  it('returns next line in the string with custom line terminator', async () => {
    const data = Buffer.from('foo#bar#');
    const reader = new StreamReader(makeStream(data));

    for (const val of ['foo', 'bar']) {
      const res = await reader.readLine('#');
      strictEqual(res.toString(), val);
    }
  });
});

describe('StreamReader miscellaneous', () => {
  it('correctly pauses and resumes the stream', (done) => {
    const data = ['foo', 'bar', 'baz', 'foo', 'bar', ''];
    const reader = new StreamReader(makeStream(Buffer.from(data.join('\n'))));

    (function loop(i) {
      const val = data[i];

      if (!val) {
        return done();
      }

      reader.readLine().then((res) => {
        strictEqual(res.toString(), val);
        setTimeout(() => loop(i + 1), 15);
      });
    })(0);
  });

  it('allows only one request at a time', () => {
    const data = Buffer.from('foo\nbar\nbaz\n');
    const reader = new StreamReader(makeStream(data));

    rejects(Promise.all([reader.readLine(), reader.readBytes(1)]), {
      message: 'Duplicate subscription',
    });

    rejects(Promise.all([reader.readBytes(1), reader.readLine()]), {
      message: 'Duplicate subscription',
    });
  });
});

function makeStream(input: Buffer) {
  const stream = new Transform({
    transform(chunk, enc, callback) {
      this.push(chunk, enc);
      callback();
    },
  });

  let i = 0;
  const timer = setInterval(() => {
    const buf = input.subarray(i, (i += 2));

    if (buf.length) {
      stream.write(buf);
    } else {
      clearInterval(timer);
    }
  }, 10);

  return stream;
}
