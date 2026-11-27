export class ReadingTracker {
  elapsed = 0;
  lastActivity = 0;
  lastTick = 0;
  queue = Promise.resolve();
  uncertain = false;
  stopped = false;
  constructor(save, clock = () => performance.now()) {
    this.save = save;
    this.clock = clock;
    this.lastActivity = this.lastTick = clock();
  }
  activity() {
    this.lastActivity = this.clock();
  }
  tick(visible) {
    const now = this.clock();
    const delta = Math.max(0, Math.min(5, (now - this.lastTick) / 1000));
    if (visible && now - this.lastActivity < 90000 && !this.stopped)
      this.elapsed += delta;
    this.lastTick = now;
  }
  sync(position) {
    const task = this.queue.then(async () => {
      if (this.uncertain)
        throw Error("上次阅读同步结果不确定，已暂停时长上报以避免重复累计");
      const seconds = Math.min(300, Math.floor(this.elapsed));
      try {
        await this.save({ ...position, elapsed: seconds });
        this.elapsed = Math.max(0, this.elapsed - seconds);
      } catch (e) {
        this.uncertain = true;
        throw e;
      }
    });
    this.queue = task.catch(() => {});
    return task;
  }
}
