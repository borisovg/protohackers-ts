export function add(buf: Buffer, int: number) {
  for (let i = 0; i < buf.length; i++) {
    buf[i] = (buf[i] + int + 256) % 256;
  }
}

export function addpos(buf: Buffer, pos: number) {
  for (let i = 0; i < buf.length; i++) {
    buf[i] = (buf[i] + pos + i + 256) % 256;
  }
}

export function reverse(buf: Buffer) {
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    let rev = 0;

    for (let j = 0; j < 8; j++) {
      rev <<= 1;

      if ((byte & 1) === 1) {
        rev ^= 1;
      }

      byte >>= 1;
    }

    buf[i] = rev;
  }
}

export function subpos(buf: Buffer, pos: number) {
  for (let i = 0; i < buf.length; i++) {
    buf[i] = (buf[i] - pos - i + 256) % 256;
  }
}

export function xor(buf: Buffer, int: number) {
  for (let i = 0; i < buf.length; i++) {
    buf[i] ^= int;
  }
}

export function xorpos(buf: Buffer, pos: number) {
  for (let i = 0; i < buf.length; i++) {
    buf[i] ^= pos + i;
  }
}
