import {
  encodeByte,
  encodeMessage,
  encodeString,
  encodeU32,
  readString,
  readU32,
} from './tlvc';

export const HELLO = 0x50;
export const ERROR = 0x51;
export const OK = 0x52;
export const DA = 0x53;
export const TP = 0x54;
export const CP = 0x55;
export const DP = 0x56;
export const PR = 0x57;
export const SV = 0x58;

export const PROTOCOL = 'pestcontrol';
export const VERSION = 1;

export type Action = 'cull' | 'conserve';

export function decodeError(buf: Buffer) {
  const [message] = readString(buf);
  return { type: ERROR, message };
}

export function decodeHello(buf: Buffer) {
  const [protocol, buf2] = readString(buf);
  const [version] = readU32(buf2);
  return { type: HELLO, protocol, version };
}

export function decodePolicyResult(buf: Buffer) {
  const [policy] = readU32(buf);
  return { type: PR, policy };
}

export function decodeSiteVisit(buf: Buffer) {
  const [site, buf2] = readU32(buf);
  let [len, buf3] = readU32(buf2);
  const populations = [];

  for (let i = 0; i < len; i += 1) {
    const [species, buf4] = readString(buf3);
    const [count, buf5] = readU32(buf4);

    populations.push({ species, count });
    buf3 = buf5;
  }

  return { type: SV, populations, site };
}

export function decodeTargetPopulations(buf: Buffer) {
  const [site, buf2] = readU32(buf);
  let [len, buf3] = readU32(buf2);
  const populations = [];

  for (let i = 0; i < len; i += 1) {
    const [species, buf4] = readString(buf3);
    const [min, buf5] = readU32(buf4);
    const [max, buf6] = readU32(buf5);

    populations.push({ species, min, max });
    buf3 = buf6;
  }

  return { type: TP, populations, site };
}

export function encodeHello() {
  return encodeMessage(HELLO, [encodeString(PROTOCOL), encodeU32(VERSION)]);
}

export function encodeError(msg: string) {
  return encodeMessage(ERROR, [encodeString(msg)]);
}

export function encodeOk() {
  return encodeMessage(OK, []);
}

export function encodeCreatePolicy(species: string, action: Action) {
  return encodeMessage(CP, [
    encodeString(species),
    encodeByte(action === 'cull' ? 0x90 : 0xa0),
  ]);
}

export function encodeDialAuthority(site: number) {
  return encodeMessage(DA, [encodeU32(site)]);
}

export function encodeDeletePolicy(id: number) {
  return encodeMessage(DP, [encodeU32(id)]);
}
