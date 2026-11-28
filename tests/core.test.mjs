import test from "node:test";
import assert from "node:assert/strict";
import { DraftController } from "../src/core/draft.js";
import { Latest } from "../src/core/latest.js";
import { AssetManager } from "../src/core/assets.js";
import { ReadingTracker } from "../src/core/reading.js";
import {
  escapeHtml,
  normalizePreferences,
  textMarkup,
} from "../src/core/utils.js";
import { orderedParts, chapterLabel } from "../src/core/story-structure.js";
import { sectionHeading } from "../src/components/section-heading.js";

test("a work prologue precedes volumes regardless of their numeric order", () => {
  const parts = [
    { title: "第一卷", sort_order: 0 },
    { title: "楔子", entry_type: "prologue", sort_order: 90 },
  ];
  assert.deepEqual(
    orderedParts(parts).map((p) => p.title),
    ["楔子", "第一卷"],
  );
  assert.equal(parts[0].title, "第一卷");
  assert.equal(
    chapterLabel({
      title: "楔子　测试",
      volumes: { title: "楔子", entry_type: "prologue" },
    }),
    "楔子　测试",
  );
});

test("scene breaks and optional subtitles retain text safely without duplicate headings", () => {
  assert.equal(
    textMarkup("前一场景。\n\n---\n\n后一场景。"),
    '<p>前一场景。</p><hr class="scene-break" aria-label="情节分隔"><p>后一场景。</p>',
  );
  assert.match(textMarkup("<script>\n—— 普通副标题"), /&lt;script&gt;/);
  assert.match(textMarkup("—— 普通副标题"), /<p>—— 普通副标题<\/p>/);
  assert.equal(sectionHeading({ title: "楔子" }, "楔子"), "");
  assert.equal(sectionHeading({ title: null, subtitle: null }, "标题"), "");
  assert.match(
    sectionHeading({ title: "风起", subtitle: "—— <script>" }, "第一章"),
    /&lt;script&gt;/,
  );
});
test("late route results cannot overwrite the latest navigation", () => {
  const gate = new Latest();
  const old = gate.begin();
  const latest = gate.begin();
  assert.equal(old(), false);
  assert.equal(latest(), true);
  gate.cancel();
  assert.equal(latest(), false);
});
test("draft save snapshots keep text typed while a request is pending", async () => {
  const writes = [];
  let release;
  const controller = new DraftController(
    { section_id: "test", title: "a", content: "" },
    async (p) => {
      writes.push(p);
      if (writes.length === 1) await new Promise((r) => (release = r));
    },
  );
  controller.change({ content: "first" });
  const first = controller.flush();
  await new Promise((r) => setImmediate(r));
  controller.change({ content: "second" });
  release();
  await first;
  assert.equal(controller.dirty, true);
  await controller.flush();
  assert.equal(writes[0].content, "first");
  assert.equal(writes[1].content, "second");
  assert.equal(controller.dirty, false);
  controller.dispose();
});
test("draft failure remains dirty and can be retried", async () => {
  let fail = true;
  const controller = new DraftController({ section_id: "test" }, async () => {
    if (fail) throw Error("offline");
  });
  controller.change({ content: "unsaved" });
  await assert.rejects(controller.flush());
  assert.equal(controller.dirty, true);
  fail = false;
  await controller.flush();
  assert.equal(controller.dirty, false);
  controller.dispose();
});
test("asset downloads are shared across routes, failures can retry, logout invalidates in-flight results", async () => {
  const OriginalImage = globalThis.Image;
  globalThis.Image = class {
    async decode() {}
  };
  let downloads = 0,
    release;
  const db = {
    storage: {
      from: () => ({
        download: async () => {
          downloads++;
          await new Promise((r) => (release = r));
          return { data: new Blob(["x"]), error: null };
        },
      }),
    },
  };
  const assets = new AssetManager(db);
  try {
    const first = assets.get("story-frame.webp");
    assert.equal(first, assets.get("story-frame.webp"));
    assets.clear();
    release();
    await assert.rejects(first, /会话已结束/);
    const retry = assets.get("story-frame.webp");
    await new Promise((r) => setImmediate(r));
    release();
    assert.match(await retry, /^blob:/);
    assert.equal(downloads, 2);
    assert.throws(() => assets.get("https://example.com/private"));
    assets.clear();
  } finally {
    globalThis.Image = OriginalImage;
  }
});
test("reading time pauses when hidden or idle and serializes concurrent syncs", async () => {
  let now = 0;
  const sent = [];
  const tracker = new ReadingTracker(
    async (p) => sent.push(p),
    () => now,
  );
  now = 1000;
  tracker.tick(true);
  now = 2000;
  tracker.tick(false);
  assert.equal(tracker.elapsed, 1);
  now = 100000;
  tracker.tick(true);
  assert.equal(tracker.elapsed, 1);
  tracker.activity();
  now = 101000;
  tracker.tick(true);
  await Promise.all([tracker.sync({}), tracker.sync({})]);
  assert.deepEqual(
    sent.map((p) => p.elapsed),
    [2, 0],
  );
});
test("ambiguous reading errors stop automatic retries of additive seconds", async () => {
  let calls = 0;
  const tracker = new ReadingTracker(async () => {
    calls++;
    throw Error("timeout");
  });
  tracker.elapsed = 4;
  await assert.rejects(tracker.sync({}));
  await assert.rejects(tracker.sync({}), /不确定/);
  assert.equal(calls, 1);
  assert.equal(tracker.elapsed, 4);
});
test("user content is escaped and reading preferences bounded", () => {
  assert.equal(escapeHtml('<script>"&'), "&lt;script&gt;&quot;&amp;");
  assert.equal(normalizePreferences({ font_size: 1000 }).font_size, 32);
  assert.equal(normalizePreferences({ theme: "unsafe" }).theme, "paper");
});
