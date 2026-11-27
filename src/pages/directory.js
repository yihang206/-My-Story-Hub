import { escapeHtml as e, uid } from "../core/utils.js";
export async function directory(ctx, id) {
  const [work, tree, progress] = await Promise.all([
    ctx.data.one("works", id),
    ctx.data.tree(id),
    ctx.data.progress(),
  ]);
  const cover = await ctx.cover(work);
  const all = tree.flatMap((v) => v.chapters);
  const last = progress.find((p) => all.some((c) => c.id === p.chapter_id));
  return {
    html: `<article class="paper-page"><button data-route="library">返回书架</button><div class="work-intro">${cover ? `<img src="${e(cover)}" alt="${e(work.title)}封面">` : ""}<div><p class="eyebrow">THE COLLECTION</p><h2>${e(work.title)}</h2><i>${e(work.subtitle)}</i><p>${e(work.description)}</p><p class="muted">${work.is_published ? "连载中" : "尚未发布"}</p><div class="actions">${last ? `<button class="primary" data-route="reader/${uid(last.chapter_id)}">继续阅读 · ${Math.round(last.progress_percent)}%</button>` : ""}${ctx.isAdmin() ? `<button data-route="studio/${uid(id)}">进入创作管理</button>` : ""}</div></div></div><h3 class="ruled">作品目录 <i>Contents</i></h3>${
      tree
        .map(
          (v) =>
            `<details class="volume" open><summary>${e(v.title)}</summary>${
              v.chapters
                .map((c) => {
                  const p = progress.find((p) => p.chapter_id === c.id);
                  return `<div class="chapter-row"><button data-route="reader/${uid(c.id)}">${e(c.title)}</button><span class="muted">${c.status !== "published" ? "草稿" : p?.is_completed ? "✓ 已读" : p ? `${Math.round(p.progress_percent)}%` : ""}</span></div>`;
                })
                .join("") || '<p class="empty">暂无章节。</p>'
            }</details>`,
        )
        .join("") || '<p class="empty">等待故事的第一章。</p>'
    }</article>`,
  };
}
