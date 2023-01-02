export class PriorityQueue<T extends { id: number; priority: number }> {
  queue: Partial<T[]> = [];

  get maxPriority() {
    return this.queue[0]?.priority || 0;
  }

  get size() {
    return this.queue.length;
  }

  delete(id: number) {
    for (let i = 0; i < this.queue.length; i += 1) {
      if (this.queue[i]?.id === id) {
        this._shift(i);
        return true;
      }
    }
  }

  push(item: T) {
    this.heapifyUp(this.queue.push(item) - 1);
    //this.print();
  }

  shift() {
    return this._shift(0);
  }

  private _shift(idx: number) {
    if (this.queue.length < 2) {
      return this.queue.pop();
    }

    const item = this.queue[idx];
    const last = this.queue.pop() as T;

    this.queue[idx] = last;
    this.heapifyDown(idx);

    //this.print();
    return item;
  }

  private heapifyDown(idx: number) {
    const l = 2 * idx + 1;
    const r = l + 1;
    const lc = this.queue[l];
    const rc = this.queue[r];

    if (lc && lc.priority > (this.queue[idx] as T).priority) {
      this.queue[l] = this.queue[idx];
      this.queue[idx] = lc;
      this.heapifyDown(l);
    }

    if (rc && rc.priority > (this.queue[idx] as T).priority) {
      this.queue[r] = this.queue[idx];
      this.queue[idx] = rc;
      this.heapifyDown(r);
    }
  }

  private heapifyUp(idx: number) {
    while (idx) {
      const p = Math.floor((idx - 1) / 2);
      let child = this.queue[idx] as T;
      let parent = this.queue[p] as T;

      if (child.priority > parent.priority) {
        this.queue[idx] = parent;
        this.queue[p] = child;
        idx = p;
      } else {
        break;
      }
    }
  }

  private print(idx = 0, indent = 0) {
    if (idx >= this.queue.length) {
      return;
    }

    const l = 2 * idx + 1;
    const r = l + 1;

    const m0 = `${new Array(indent).fill(' ').join('')} ${
      this.queue[idx]?.priority
    }`;
    console.log(m0);

    indent = m0.length;

    if (this.queue[l]) {
      this.print(l, m0.length);
    }

    if (this.queue[r]) {
      this.print(r, m0.length);
    }

    if (!idx) {
      console.log('---');
    }
  }
}
