import { createSocket } from 'dgram';
import type { RemoteInfo, Socket } from 'dgram';
import { EventEmitter } from 'events';
import { LrcpSession } from './lrcp-session';
import { logger as log } from './logger';
import { parse } from './parse';

const MAX_SIZE = 1000;

type Session = {
  acked: number;
  address: string;
  lastAck: number;
  port: number;
  session: LrcpSession;
  unacked: [number, string, number][];
};

new EventEmitter();

export class LrcpServer extends EventEmitter {
  private sessions = new Map<number, Session>();
  private socket: Socket;
  private timer: NodeJS.Timer;

  constructor() {
    super();

    this.socket = createSocket('udp4', (buf, rinfo) => {
      if (buf.length > MAX_SIZE) {
        return log.warn('incoming message too large', buf.length);
      }

      const msg = parse(buf);

      if (msg) {
        log.info('received', JSON.stringify(buf.toString()));
      } else {
        return log.warn('parse error', JSON.stringify(buf.toString()));
      }

      const [type, id, pos, data] = msg;

      if (type === 'ack') {
        this.handleAck(id, pos, rinfo);
      } else if (type === 'close') {
        this.sessions.delete(id);
        this.send(`/close/${id}/`, rinfo.address, rinfo.port);
      } else if (type === 'connect') {
        this.handleConnect(id, rinfo);
      } else if (type === 'data') {
        this.handleData(id, pos, data, rinfo);
      }
    });

    this.timer = setInterval(() => {
      const now = Date.now();

      for (const [id, session] of this.sessions) {
        if (now - session.lastAck > 60000) {
          if (session.unacked.length) {
            log.info(
              'session timeout',
              id,
              JSON.stringify(session.unacked.toString())
            );
          }
          this.sessions.delete(id);
          continue;
        }

        let len = session.acked;

        for (const [_, msg, time] of session.unacked) {
          if (now - time > 3000) {
            log.debug('retransmit', id);
            this.send(msg, session.address, session.port);
          }
        }
      }
    }, 1000);
  }

  close() {
    clearInterval(this.timer);
    this.socket.close();
  }

  handleAck(id: number, pos: number, rinfo: RemoteInfo) {
    const session = this.sessions.get(id);

    if (!session) {
      return this.send(`/close/${id}/`, rinfo.address, rinfo.port);
    }

    const now = Date.now();
    let len = session.acked;

    while (len < pos && session.unacked.length) {
      const item = session.unacked.shift();

      if (item) {
        len += item[0];
      } else {
        throw new Error('This should not happen');
      }
    }

    if (len < pos) {
      this.sessions.delete(id);
      return this.send(`/close/${id}/`, session.address, session.port);
    }

    session.acked = len;
    session.lastAck = Date.now();
  }

  handleConnect(id: number, rinfo: RemoteInfo) {
    this.send(`/ack/${id}/0/`, rinfo.address, rinfo.port);

    if (this.sessions.has(id)) {
      return;
    }

    const session: Session = {
      address: rinfo.address,
      acked: 0,
      lastAck: Date.now(),
      port: rinfo.port,
      session: new LrcpSession(MAX_SIZE - 30, (data, len) => {
        let pos = session.acked;

        for (const [len2] of session.unacked) {
          pos += len2;
        }

        const msg = `/data/${id}/${pos}/${data.toString()}/`;
        this.send(msg, session.address, session.port);
        session.unacked.push([len, msg, Date.now()]);
      }),
      unacked: [],
    };

    this.sessions.set(id, session);
    this.emit('session', session.session);
  }

  handleData(id: number, pos: number, data: string, rinfo: RemoteInfo) {
    const session = this.sessions.get(id);

    if (!session) {
      return this.send(`/close/${id}/`, rinfo.address, rinfo.port);
    }

    const written = session.session.addChunk(pos, data);

    this.send(`/ack/${id}/${written}/`, session.address, session.port);
  }

  listen(port: number) {
    this.socket.bind(port, () => log.info('server listening'));
  }

  send(msg: string, address: string, port: number) {
    const buf = Buffer.from(msg);

    if (buf.length > MAX_SIZE) {
      return log.error(
        'outgoing message too large',
        buf.length,
        JSON.stringify(msg)
      );
    }

    log.info('send', JSON.stringify(msg));
    this.socket.send(buf, port, address);
  }
}
