type File = {
  name: string;
  revisions: Buffer[];
  type: 'file';
};

type Dir = {
  children: Map<string, Dir | File>;
  name: string;
  type: 'dir';
};

export class Store {
  private store: Dir = { children: new Map(), name: '/', type: 'dir' };

  private getDir(parts: string[], create?: true) {
    let dir = this.store;

    for (let i = 1; i < parts.length - 1; i += 1) {
      const name = parts[i];
      let child = dir.children.get(name);

      if (!child || child.type !== 'dir') {
        if (!create) return;

        child = { children: new Map(), name, type: 'dir' };
        dir.children.set(name, child);
      }

      dir = child as Dir;
    }

    return dir;
  }

  get(path: string, rev?: string) {
    const parts = path.split('/');
    const dir = this.getDir(parts, true);
    const name = parts[parts.length - 1];

    const file = dir?.children.get(name);

    if (!file || file.type !== 'file') return;

    const revisions = file.revisions || [];
    const i = rev ? parseInt(rev.substring(1), 10) : revisions.length;
    return revisions[i - 1];
  }

  list(path: string) {
    const parts = (path[path.length - 1] === '/' ? path : `${path}/`).split(
      '/'
    );
    const dir = this.getDir(parts);

    if (!dir || dir.type !== 'dir') return [];

    return Array.from(dir.children.values())
      .map((item) =>
        item.type === 'dir'
          ? ([`${item.name}/`, 'DIR'] as const)
          : ([item.name, `r${item.revisions.length}`] as const)
      )
      .sort(
        ([[a1], [a2]], [[b1], [b2]]) =>
          a2.localeCompare(b2) || a1.charCodeAt(0) - b1.charCodeAt(0)
      );
  }

  set(path: string, data: Buffer) {
    const parts = path.split('/');
    const dir = this.getDir(parts, true);
    const name = parts[parts.length - 1];
    let file = dir?.children.get(name);

    if (!file || file.type !== 'file') {
      file = { name, revisions: [], type: 'file' };
      dir?.children.set(name, file);
    }

    const revisions = (file as File).revisions;

    if (revisions.length) {
      const i = revisions.length - 1;
      if (!Buffer.compare(data, revisions[i])) {
        return `r${i + 1}`;
      }
    }

    const rev = (file as File).revisions.push(data);
    return `r${rev}`;
  }
}
