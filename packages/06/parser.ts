import { bytes, makeU16, makeU32, makeU8, StreamReader } from './stream-reader';

export type IAmCamera = Awaited<ReturnType<Parser['readIAmCamera']>>;
export type IAmDispatcher = Awaited<ReturnType<Parser['readIAmDispatcher']>>;
export type Plate = Awaited<ReturnType<Parser['readPlate']>>;

export const codes = {
  error: 0x10,
  plate: 0x20,
  ticket: 0x21,
  wantHeartbeat: 0x40,
  heartbeat: 0x41,
  iAmCamera: 0x80,
  iAmDispatcher: 0x81,
} as const;

export class Parser extends StreamReader {
  async readIAmCamera() {
    const buf = await this.readBytes(bytes.u16 * 3);
    return {
      road: buf.readUInt16BE(),
      mile: buf.readUInt16BE(bytes.u16),
      limit: buf.readUInt16BE(bytes.u16 * 2),
    };
  }

  async readIAmDispatcher() {
    const num = await this.readU8();
    const buf = await this.readBytes(bytes.u16 * num);
    const roads = new Array(num);

    for (let i = 0; i < num; i += 1) {
      roads[i] = buf.readUInt16BE(bytes.u16 * i);
    }

    return { roads };
  }

  async readPlate() {
    const plate = await this.readString();
    const timestamp = await this.readU32();
    return { plate, timestamp };
  }

  async readWantHeartBeat() {
    const interval = await this.readU32();
    return { interval };
  }

  async readString() {
    const len = await this.readU8();
    const buf = await this.readBytes(len);
    return buf.toString();
  }
}

export function makeError(msg: string) {
  return Buffer.concat([makeU8(codes.error), makeString(msg)]);
}

export function makeHeartbeat() {
  return makeU8(codes.heartbeat);
}

export function makeTicket(
  plate: string,
  road: number,
  mile1: number,
  timestamp1: number,
  mile2: number,
  timestamp2: number,
  speed: number
) {
  return Buffer.concat([
    makeU8(codes.ticket),
    makeString(plate),
    makeU16(road),
    makeU16(mile1),
    makeU32(timestamp1),
    makeU16(mile2),
    makeU32(timestamp2),
    makeU16(speed),
  ]);
}

export function makeString(str: string) {
  const buf = Buffer.from(str);
  return Buffer.concat([Buffer.from([buf.length]), buf]);
}
