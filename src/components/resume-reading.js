import { escapeHtml as e, uid } from "../core/utils.js";
export async function resumeReading(ctx, works) {
  if (ctx.session.preview) return "";
  try {
    const rows = await ctx.data.progress();
    const last = rows.find(
      (row) =>
        row.chapters?.status === "published" &&
        works.some((w) => w.id === row.chapters.volumes?.work_id),
    );
    if (!last) return "";
    let chapter = last.chapters,
      percent = Number(last.progress_percent) || 0,
      label = "继续阅读",
      advanced = false;
    if (last.is_completed && percent >= 99) {
      const chapters = (await ctx.data.tree(chapter.volumes.work_id)).flatMap(
        (v) => v.chapters.filter((c) => c.status === "published"),
      );
      const index = chapters.findIndex((c) => c.id === last.chapter_id);
      if (index >= 0 && chapters[index + 1]) {
        chapter = chapters[index + 1];
        percent = 0;
        advanced = true;
      } else label = "返回上次阅读";
    }
    const work = works.find((w) => w.id === last.chapters.volumes.work_id);
    return `<button class="resume-reading" data-route="reader/${uid(chapter.id || last.chapter_id)}"><span class="resume-label">${label}</span><strong>《${e(work.title)}》 · ${e(chapter.title)}</strong><span class="resume-detail">${advanced ? "上一章已读完，从下一章继续" : `已读 ${Math.round(percent)}% · 回到上次的位置`}</span></button>`;
  } catch {
    return '<div class="resume-reading resume-error"><span>阅读位置暂时无法加载</span><button data-action="retry">重试</button></div>';
  }
}
