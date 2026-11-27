export class AssetManager {
  cache = new Map();
  epoch = 0;
  constructor(db) {
    this.db = db;
  }
  get(path) {
    if (
      !path ||
      typeof path !== "string" ||
      path.includes("..") ||
      /^https?:|^data:|^blob:/i.test(path)
    )
      throw Error("封面必须来自私人 story-art 素材库");
    if (!this.cache.has(path)) {
      const generation = this.epoch;
      const task = (async () => {
        const { data, error } = await this.db.storage
          .from("story-art")
          .download(path);
        if (error) throw error;
        if (generation !== this.epoch) throw Error("会话已结束");
        const url = URL.createObjectURL(data);
        try {
          const image = new Image();
          image.src = url;
          await image.decode();
          if (generation !== this.epoch) throw Error("会话已结束");
          return url;
        } catch (e) {
          URL.revokeObjectURL(url);
          throw e;
        }
      })();
      this.cache.set(path, task);
      task.catch(() => {
        if (this.cache.get(path) === task) this.cache.delete(path);
      });
    }
    return this.cache.get(path);
  }
  clear() {
    this.epoch++;
    for (const pending of this.cache.values())
      pending.then(
        (url) => URL.revokeObjectURL(url),
        () => {},
      );
    this.cache.clear();
  }
}
