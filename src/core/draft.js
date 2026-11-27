// Snapshots and a serialized queue preserve edits typed while a save is pending.
export class DraftController {
  queue = Promise.resolve();
  revision = 0;
  saved = 0;
  timer = null;
  pending = 0;
  constructor(draft, save, onStatus = () => {}) {
    this.draft = { ...draft };
    this.save = save;
    this.onStatus = onStatus;
  }
  get dirty() {
    return this.saved !== this.revision || this.pending > 0;
  }
  change(patch) {
    Object.assign(this.draft, patch);
    this.revision++;
    this.onStatus("有未保存修改");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush().catch(() => {}), 1000);
  }
  flush() {
    clearTimeout(this.timer);
    if (this.saved === this.revision) return this.queue;
    const version = this.revision;
    const payload = { ...this.draft, updated_at: new Date().toISOString() };
    this.pending++;
    const task = this.queue
      .catch(() => {})
      .then(async () => {
        this.onStatus("正在保存……");
        await this.save(payload);
        this.saved = Math.max(this.saved, version);
        this.onStatus(
          this.saved === this.revision ? "已保存草稿" : "有未保存修改",
        );
      })
      .catch((e) => {
        this.onStatus("保存失败，修改仍保留，请重试");
        throw e;
      })
      .finally(() => this.pending--);
    this.queue = task;
    return task;
  }
  dispose() {
    clearTimeout(this.timer);
  }
}
