import {
  decodeError,
  decodeHello,
  decodePolicyResult,
  decodeSiteVisit,
  decodeTargetPopulations,
} from './pcp';
import { deepStrictEqual, strictEqual } from 'assert';
import { TlvcDecoder } from './tlvc-decoder';

describe('pcp', () => {
  const decoder = new TlvcDecoder('test').on('error', (err) => {
    console.log(err);
  });

  it('decodes Hello message', (done) => {
    decoder.once('message', (_, msg) => {
      const { protocol, version } = decodeHello(msg);
      strictEqual(protocol, 'pestcontrol');
      strictEqual(version, 1);
      done();
    });

    [
      [0x50],
      [0x00, 0x00, 0x00, 0x19],
      [0x00, 0x00, 0x00, 0x0b],
      [0x70, 0x65, 0x73, 0x74, 0x63, 0x6f, 0x6e, 0x74, 0x72, 0x6f, 0x6c],
      [0x00, 0x00, 0x00, 0x01],
      [0xce],
    ].forEach((arr) => decoder.write(Buffer.from(arr)));
  });

  it('decodes Error message', (done) => {
    decoder.once('message', (_, msg) => {
      const { message } = decodeError(msg);
      strictEqual(message, 'bad');
      done();
    });

    [
      [0x51],
      [0x00, 0x00, 0x00, 0x0d],
      [0x00, 0x00, 0x00, 0x03],
      [0x62, 0x61, 0x64],
      [0x78],
    ].forEach((arr) => decoder.write(Buffer.from(arr)));
  });

  it('decodes PolicyResult message', (done) => {
    decoder.once('message', (_, msg) => {
      const { policy } = decodePolicyResult(msg);
      strictEqual(policy, 123);
      done();
    });

    [
      [0x57],
      [0x00, 0x00, 0x00, 0x0a],
      [0x00, 0x00, 0x00, 0x7b],
      [0x24],
    ].forEach((arr) => decoder.write(Buffer.from(arr)));
  });

  it('decodes SiteVisit message', (done) => {
    decoder.once('message', (_, msg) => {
      const { populations } = decodeSiteVisit(msg);
      deepStrictEqual(populations, [
        { species: 'dog', count: 1 },
        { species: 'rat', count: 5 },
      ]);
      done();
    });

    [
      [0x58],
      [0x00, 0x00, 0x00, 0x24],
      [0x00, 0x00, 0x30, 0x39],
      [0x00, 0x00, 0x00, 0x02],
      [0x00, 0x00, 0x00, 0x03],
      [0x64, 0x6f, 0x67],
      [0x00, 0x00, 0x00, 0x01],
      [0x00, 0x00, 0x00, 0x03],
      [0x72, 0x61, 0x74],
      [0x00, 0x00, 0x00, 0x05],
      [0x8c],
    ].forEach((arr) => decoder.write(Buffer.from(arr)));
  });

  it('decodes TargetPopulations message', (done) => {
    decoder.once('message', (_, msg) => {
      const { populations } = decodeTargetPopulations(msg);
      deepStrictEqual(populations, [
        { species: 'dog', min: 1, max: 3 },
        { species: 'rat', min: 0, max: 10 },
      ]);
      done();
    });

    [
      [0x54],
      [0x00, 0x00, 0x00, 0x2c],
      [0x00, 0x00, 0x30, 0x39],
      [0x00, 0x00, 0x00, 0x02],
      [0x00, 0x00, 0x00, 0x03],
      [0x64, 0x6f, 0x67],
      [0x00, 0x00, 0x00, 0x01],
      [0x00, 0x00, 0x00, 0x03],
      [0x00, 0x00, 0x00, 0x03],
      [0x72, 0x61, 0x74],
      [0x00, 0x00, 0x00, 0x00],
      [0x00, 0x00, 0x00, 0x0a],
      [0x80],
    ].forEach((arr) => decoder.write(Buffer.from(arr)));
  });
});
