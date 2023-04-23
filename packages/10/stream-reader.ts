import type { Readable } from 'node:stream';

type SubscriberFn = (buf: Buffer) => Buffer | void;

const emptyBuffer = Buffer.alloc(0);

export const bytes = {
  u8: 1,
  u16: 2,
  u32: 4,
} as const;

export class StreamReader {
  private buffer = emptyBuffer;

  private subscriber?: SubscriberFn;

  constructor(private id: number, private stream: Readable) {
    stream.on('data', (chunk: Buffer) => {
      //log(id, 'DATA', chunk.toString('hex'));
      const buffer = Buffer.concat([this.buffer, chunk]);
      this.handleData(buffer);
    });
  }

  readBytes(bytes: number) {
    return new Promise<Buffer>((resolve, reject) => {
      let buffer = emptyBuffer;

      try {
        this.subscribe((chunk) => {
          buffer = Buffer.concat([buffer, chunk]);

          if (buffer.length >= bytes) {
            resolve(buffer.subarray(0, bytes));
            return buffer.subarray(bytes);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  readLine(terminator = '\n') {
    return new Promise<Buffer>((resolve, reject) => {
      const code = terminator.charCodeAt(0);
      let buffer = emptyBuffer;

      try {
        this.subscribe((chunk) => {
          for (let i = 0; i < chunk.length; i += 1) {
            if (chunk[i] === code) {
              resolve(Buffer.concat([buffer, chunk.subarray(0, i)]));
              return chunk.subarray(i + 1);
            }
          }

          buffer = Buffer.concat([buffer, chunk]);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async readU8() {
    const buf = await this.readBytes(bytes.u8);
    return buf.readUInt8();
  }

  async readU16() {
    const buf = await this.readBytes(bytes.u16);
    return buf.readUInt16BE();
  }

  async readU32() {
    const buf = await this.readBytes(bytes.u32);
    return buf.readUInt32BE();
  }

  private handleData(buffer: Buffer) {
    if (this.subscriber) {
      const remainder = this.subscriber(buffer);

      if (remainder) {
        this.buffer = remainder;
        this.subscriber = undefined;
      } else {
        this.buffer = emptyBuffer;
      }
    } else {
      this.buffer = buffer;
      this.stream.pause();
    }
  }

  private subscribe(fn: SubscriberFn) {
    if (this.subscriber) {
      throw new Error('Duplicate subscription');
    }

    this.subscriber = fn;
    this.handleData(this.buffer);
    this.stream.resume();
  }
}

export function makeU8(num: number) {
  const buf = Buffer.allocUnsafe(bytes.u8);
  buf.writeUInt8(num);
  return buf;
}

export function makeU16(num: number) {
  const buf = Buffer.allocUnsafe(bytes.u16);
  buf.writeUInt16BE(num);
  return buf;
}

export function makeU32(num: number) {
  const buf = Buffer.allocUnsafe(bytes.u32);
  buf.writeUInt32BE(num);
  return buf;
}
