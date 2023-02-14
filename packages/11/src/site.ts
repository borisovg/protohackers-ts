import { AuthorityClient } from './authority-client';
import { log } from './logger';
import { Action } from './pcp';

type Target = { min: number; max: number; species: string };

export class Site {
  private ac: AuthorityClient;
  private pops: Map<string, number> = new Map();
  private policies: Map<string, { action: Action; id: number }> = new Map();
  private targets: Map<string, { min: number; max: number }> = new Map();
  private recomputing = true;
  private updated = false;

  constructor(public readonly site: number) {
    this.ac = new AuthorityClient(site, () => {
      log('authority server ready', site);
      this.recomputing = false;
      this.recompute();
    });

    this.ac.on('targets', (targets: Target[]) => {
      this.targets = new Map();
      for (const target of targets) {
        this.targets.set(target.species, target);
      }
      this.updated = true;
      this.recompute();
    });
  }

  updateCounts(list: { count: number; species: string }[]) {
    this.pops = new Map();
    for (const { count, species } of list) {
      const oldCount = this.pops.get(species);
      if (oldCount !== undefined && oldCount !== count) {
        throw new Error('Conflicting update');
      }

      this.pops.set(species, count);
    }
    this.updated = true;
    void this.recompute();
  }

  private async createPolicy(species: string, action: Action) {
    const policy = this.policies.get(species);
    if (policy?.action === action) return;
    await this.deletePolicy(species);
    const id = await this.ac.createPolicy(species, action);
    this.policies.set(species, { action, id });
  }

  private async deletePolicy(species: string) {
    const policy = this.policies.get(species);
    if (policy?.id !== undefined) {
      await this.ac.deletePolicy(species, policy.id);
      this.policies.delete(species);
    }
  }

  private async recompute() {
    if (!this.updated || this.recomputing) {
      return;
    }

    this.recomputing = true;
    this.updated = false;

    for (const [species, target] of this.targets) {
      const count = this.pops.get(species) || 0;

      if (count > target.max) {
        log(this.site, species, `have ${count} want < ${target.max}`);
        await this.createPolicy(species, 'cull');
      } else if (count < target.min) {
        log(this.site, species, `have ${count} want > ${target.min}`);
        await this.createPolicy(species, 'conserve');
      } else {
        log(
          this.site,
          species,
          `${target.min} < have ${count} < ${target.max}`
        );
        await this.deletePolicy(species);
      }
    }

    for (const [species, { id }] of this.policies) {
      if (!this.targets.has(species)) {
        await this.ac.deletePolicy(species, id);
      }
    }

    this.recomputing = false;
    void this.recompute();
  }
}
