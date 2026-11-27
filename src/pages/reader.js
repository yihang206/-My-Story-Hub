import { notesPanel } from "../components/notes.js";
import {
  escapeHtml as e,
  textMarkup,
  uid,
  showToast,
  check,
} from "../core/utils.js";
import { preferenceFields, bindPreferences } from "./settings.js";
import { ReadingTracker } from "../core/reading.js";
import { config } from "../config.js";
export async function reader(ctx, id) {
  const [chapter, sections, progress] = await Promise.all([
    ctx.data.one("chapters", id),
    ctx.data.sections(id),
    ctx.data.progress(id),
  ]);
  const volume = await ctx.data.one("volumes", chapter.volume_id);
  if (ctx.session.preview) await ctx.data.one("works", volume.work_id);
  const tree = await ctx.data.tree(volume.work_id);
  const chapters = tree.flatMap((v) =>
    v.chapters.filter((c) => c.status === "published"),
  );
  const index = chapters.findIndex((c) => c.id === id);
  const published = sections.filter((s) => s.is_published);
  const saved = progress[0];
  if (!published.length)
    throw Error("本章暂无已发布正文，请在创作管理中预览草稿");
  const notes = await notesPanel(ctx, published);
  return {
    html: `<div class="reader-page"><header class="reader-toolbar"><button data-route="directory/${uid(volume.work_id)}">返回目录</button><span>${e(volume.title)}</span><button id="toggle-toc" aria-expanded="false">章节目录</button><button id="reading-preferences">阅读设置</button></header><aside id="reader-toc" hidden><h2>章节目录</h2>${chapters.map((c) => `<button data-route="reader/${uid(c.id)}" ${c.id === id ? 'aria-current="page"' : ""}>${e(c.title)}</button>`).join("")}</aside><article class="reader-content"><p class="eyebrow">${e(volume.title)}</p><h1>${e(chapter.title)}</h1>${!config.verifiedRpc ? '<p class="notice">阅读同步尚待后端函数核验，本次位置与时长不会写入服务器。</p>' : ""}${published.map((s) => `<section data-section="${e(s.id)}"><h2>${e(s.title)}</h2>${textMarkup(s.content)}</section>`).join("")}<div class="actions reader-next">${index > 0 ? `<button data-route="reader/${uid(chapters[index - 1].id)}">上一章</button>` : ""}<button data-route="directory/${uid(volume.work_id)}">返回目录</button>${index >= 0 && index < chapters.length - 1 ? `<button data-route="reader/${uid(chapters[index + 1].id)}">下一章</button>` : ""}</div>${notes.html}</article><footer class="reader-bottom"><span id="reader-percent">本章进度 0%</span><progress id="reader-progress" max="100" value="0" aria-label="本章阅读进度"></progress><button id="mark-finished" ${config.verifiedRpc && !ctx.session.preview ? "" : "disabled"}>标记读完</button><span id="sync-status" role="status"></span></footer></div>`,
    mount(el) {
      ctx.applyPreferences();
      notes.mount(el);
      let percent = 0,
        sectionId = saved?.section_id || published[0].id;
      let finished = !!saved?.is_completed;
      const tracker =
        config.verifiedRpc && !ctx.session.preview
          ? new ReadingTracker(async (p) => {
              check(
                await ctx.db.rpc("save_story_reading", {
                  target_chapter: id,
                  target_section: p.sectionId,
                  percent_read: p.percent,
                  finished: p.finished,
                  elapsed: p.elapsed,
                }),
              );
            })
          : null;
      const position = () => ({
        sectionId,
        percent: Math.round(percent * 100) / 100,
        finished,
      });
      const sync = async () => {
        if (!tracker) return;
        const status = el.querySelector("#sync-status");
        try {
          await tracker.sync(position());
          status.textContent = "阅读记录已同步";
        } catch (error) {
          status.textContent = error.message;
        }
      };
      const update = () => {
        tracker?.activity();
        const max = Math.max(
          0,
          document.documentElement.scrollHeight - innerHeight,
        );
        percent = max ? Math.min(100, Math.max(0, (scrollY / max) * 100)) : 100;
        for (const s of el.querySelectorAll("[data-section]"))
          if (s.getBoundingClientRect().top < innerHeight * 0.45)
            sectionId = s.dataset.section;
        el.querySelector("#reader-percent").textContent =
          `本章进度 ${Math.round(percent)}%`;
        el.querySelector("#reader-progress").value = percent;
      };
      const activity = () => tracker?.activity();
      const visibility = () => {
        tracker?.tick(false);
        if (document.hidden) void sync();
      };
      window.addEventListener("scroll", update, { passive: true });
      for (const name of ["pointerdown", "keydown", "touchstart"])
        window.addEventListener(name, activity, { passive: true });
      document.addEventListener("visibilitychange", visibility);
      const tick = tracker
        ? setInterval(() => tracker.tick(!document.hidden), 1000)
        : null;
      const saving = tracker ? setInterval(() => void sync(), 30000) : null;
      el.querySelector("#toggle-toc").onclick = (event) => {
        const toc = el.querySelector("#reader-toc");
        toc.hidden = !toc.hidden;
        event.currentTarget.setAttribute("aria-expanded", String(!toc.hidden));
      };
      el.querySelector("#reading-preferences").onclick = () => {
        ctx.dialog(
          `<h2>阅读设置</h2><form id="reader-pref-form">${preferenceFields(ctx.session.preferences)}<button type="submit" class="primary">保存</button></form>`,
        );
        bindPreferences(ctx, document.querySelector("#reader-pref-form"));
        if (ctx.session.preview)
          document.querySelector(
            "#reader-pref-form button[type=submit]",
          ).disabled = true;
      };
      el.querySelector("#mark-finished").onclick = async () => {
        finished = true;
        await sync();
      };
      const restore = requestAnimationFrame(() => {
        const max = Math.max(
          0,
          document.documentElement.scrollHeight - innerHeight,
        );
        window.scrollTo(
          0,
          (max * (Number(saved?.progress_percent) || 0)) / 100,
        );
        update();
      });
      return async () => {
        cancelAnimationFrame(restore);
        clearInterval(tick);
        clearInterval(saving);
        window.removeEventListener("scroll", update);
        for (const name of ["pointerdown", "keydown", "touchstart"])
          window.removeEventListener(name, activity);
        document.removeEventListener("visibilitychange", visibility);
        if (tracker) {
          tracker.tick(!document.hidden);
          tracker.stopped = true;
          await sync();
        }
      };
    },
  };
}
