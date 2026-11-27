import { escapeHtml as e, date, duration, uid, check } from "../core/utils.js";
export async function history(ctx) {
  const [rows, stats] = await Promise.all([
    ctx.data.progress(),
    ctx.session.preview
      ? Promise.resolve([])
      : ctx.db
          .from("reading_stats")
          .select("*")
          .eq("user_id", ctx.session.user.id)
          .then(check),
  ]);
  return {
    html: `<article class="paper-page"><p class="eyebrow">READING JOURNAL</p><h2>我的阅读记录</h2><p class="muted">已读 ${rows.length} 章 · 已完成 ${rows.filter((r) => r.is_completed).length} 章 · 累计有效阅读 ${duration(stats.reduce((s, r) => s + Number(r.active_seconds || 0), 0))}</p>${rows.map((r) => `<div class="record"><div><h3>《${e(r.chapters?.volumes?.works?.title)}》 · ${e(r.chapters?.title)}</h3><p class="muted">${date(r.last_read_at)} · ${Math.round(r.progress_percent)}% ${r.is_completed ? "· 已读完" : ""}</p><progress max="100" value="${Number(r.progress_percent) || 0}" aria-label="章节进度"></progress></div><button data-route="reader/${uid(r.chapter_id)}">继续阅读</button></div>`).join("") || '<p class="empty">尚未留下阅读足迹。去书架翻开一本故事吧。</p>'}</article>`,
  };
}
