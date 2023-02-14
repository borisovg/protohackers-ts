export const LEN_HEAD = 5;
export const LEN_FOOT = 1;

export function checksum(buf: Buffer): number {
  let sum = 0;
  for (const byte of buf) {
    sum += byte;
  }
  return 256 - (sum % 256);
}

export function encodeByte(int: number): Buffer {
  return Buffer.from([int]);
}

export function encodeMessage(type: number, parts: Buffer[]): Buffer {
  const val = Buffer.concat(parts);
  const msg = Buffer.concat([
    encodeByte(type),
    encodeU32(val.length + LEN_HEAD + LEN_FOOT),
    val,
  ]);
  return Buffer.concat([msg, encodeByte(checksum(msg))]);
}

export function encodeString(str: string): Buffer {
  const buf = Buffer.from(str);
  return Buffer.concat([encodeU32(buf.length), buf]);
}

export function encodeU32(int: number): Buffer {
  const buf = Buffer.allocUnsafe(4);
  buf.writeUInt32BE(int, 0);
  return buf;
}

export function readBytes(buf: Buffer, len: number): [Buffer, Buffer] {
  if (buf.length >= len) {
    return [buf.subarray(0, len), buf.subarray(len)];
  }
  throw new Error('Buffer too short');
}

export function readHeader(buf: Buffer): [Buffer, number, Buffer] {
  const [type, buf2] = readBytes(buf, 1);
  const [len, buf3] = readU32(buf2);
  return [type, len, buf3];
}

export function readMessage(buf: Buffer): [number, Buffer, Buffer] {
  const [type, len] = readHeader(buf);
  const [data, buf2] = readBytes(buf, len);
  let li = data.length - LEN_FOOT;
  if (checksum(data.subarray(0, li)) !== data[li]) {
    throw new Error('Checksum error');
  }
  return [type[0], data.subarray(LEN_HEAD, li), buf2];
}

export function readString(buf: Buffer): [string, Buffer] {
  const [len, buf2] = readU32(buf);
  const [data, buf3] = readBytes(buf2, len);
  return [data.toString(), buf3];
}

export function readType(buf: Buffer): [number, Buffer] {
  if (buf.length >= 1) {
    return [buf[0], buf.subarray(1)];
  }
  throw new Error('Buffer too short');
}

export function readU32(buf: Buffer): [number, Buffer] {
  if (buf.length >= 4) {
    const num = buf.readUInt32BE();
    return [num, buf.subarray(4)];
  }
  throw new Error('Buffer too short');
}
