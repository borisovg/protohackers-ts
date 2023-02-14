import { connect } from 'net';
import type { Socket } from 'net';
import { EventEmitter } from 'stream';
import { log } from './logger';
import { PcpSocket } from './pcp-socket';
import { config } from './config';
import {
  OK,
  PR,
  TP,
  Action,
  encodeCreatePolicy,
  encodeDeletePolicy,
  encodeDialAuthority,
  decodePolicyResult,
  decodeTargetPopulations,
} from './pcp';

export class AuthorityClient extends EventEmitter {
  private pendingCb?: (id?: number) => void;
  private client?: PcpSocket;

  constructor(public readonly site: number, readyCb: () => void) {
    super();

    const socket: Socket = connect(config.authorityServer, async () => {
      log('authority server connected', site);

      const client = new PcpSocket(`sa-${site}`, socket);

      this.client = client;

      client.write(encodeDialAuthority(site));

      readyCb();

      client.on('message', (type: number, msg: Buffer) => {
        try {
          if (type === TP) {
            const { populations } = decodeTargetPopulations(msg);
            this.emit('targets', populations);
          } else if (type === PR) {
            const { policy } = decodePolicyResult(msg);
            if (this.pendingCb) {
              this.pendingCb(policy);
            } else {
              log('createPolicy callback not found', site, policy);
            }
          } else if (type === OK) {
            if (this.pendingCb) {
              this.pendingCb();
            } else {
              log('deletePolicy callback not found', site);
            }
          } else {
            throw new Error('Unexpected message type');
          }
        } catch (err) {
          socket.emit('error', err);
        }
      });
    });

    socket.once('close', () => {
      log('authority server disconnected', site);
    });
  }

  async createPolicy(species: string, action: Action) {
    return new Promise<number>((resolve) => {
      this.client?.write(encodeCreatePolicy(species, action));
      this.pendingCb = (id) => {
        if (id === undefined) throw new Error('Missing policy ID');
        this.pendingCb = undefined;
        log('policy created', this.site, species, action, id);
        resolve(id);
      };
    });
  }

  async deletePolicy(species: string, id: number) {
    return new Promise<void>((resolve) => {
      this.client?.write(encodeDeletePolicy(id));
      this.pendingCb = () => {
        this.pendingCb = undefined;
        log('policy delete', this.site, species, id);
        resolve();
      };
    });
  }
}
