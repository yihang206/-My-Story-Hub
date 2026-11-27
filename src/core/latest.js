// A route may finish loading after a newer route. Only the latest may commit.
export class Latest {
  version = 0;
  begin() {
    const version = ++this.version;
    return () => version === this.version;
  }
  cancel() {
    this.version++;
  }
}
