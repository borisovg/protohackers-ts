let id = 0;

export class Job {
  clientId = 0;
  id = 0;

  constructor(
    public readonly queue: string,
    public readonly priority: number,
    public readonly data: unknown
  ) {
    this.id = ++id;
  }
}
