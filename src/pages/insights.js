import { escapeHtml as e, check, date, duration } from "../core/utils.js";
export async function insights(ctx) {
  ctx.data.admin();
  const [readers, progress, stats, access, notes] = await Promise.all([
    ctx.db
      .from("profiles")
      .select("*")
      .eq("role", "reader")
      .order("created_at")
      .then(check),
    ctx.db
      .from("reading_progress")
      .select("*,chapters(title,volumes(title,works(title)))")
      .order("last_read_at", { ascending: false })
      .then(check),
    ctx.db.from("reading_stats").select("*").then(check),
    ctx.db
      .from("work_access")
      .select("*,works(title)")
      .eq("is_active", true)
      .then(check),
    ctx.db
      .from("reader_notes")
      .select("*,profiles(display_name),sections(title)")
      .eq("share_with_author", true)
      .order("created_at", { ascending: false })
      .then(check),
  ]);
  return {
    html: `<article class="paper-page"><p class="eyebrow">READER INSIGHTS · 仅创作者可见</p><h2>阅读反馈</h2><p class="muted">阅读时长依据页面可见性与活动估算，不能代表实际理解程度。</p>${
      readers
        .map((r) => {
          const records = progress.filter((p) => p.user_id === r.id);
          const times = stats.filter((p) => p.user_id === r.id);
          return `<details class="volume"><summary>${e(r.display_name)} · ${duration(times.reduce((s, r) => s + Number(r.active_seconds || 0), 0))}</summary><p>可读作品：${
            access
              .filter((a) => a.user_id === r.id)
              .map((a) => e(a.works?.title))
              .join("、") || "暂无"
          }</p><p class="muted">最近阅读：${date(records[0]?.last_read_at)} · ${records.filter((p) => p.is_completed).length} 章已完成</p><div class="table-wrap"><table><thead><tr><th>作品 / 分卷 / 章节</th><th>进度</th><th>有效时长</th></tr></thead><tbody>${records.map((p) => `<tr><td>${e(p.chapters?.volumes?.works?.title)} / ${e(p.chapters?.volumes?.title)} / ${e(p.chapters?.title)}</td><td>${Math.round(p.progress_percent)}% ${p.is_completed ? "已完成" : ""}</td><td>${duration(times.filter((t) => t.chapter_id === p.chapter_id).reduce((s, t) => s + Number(t.active_seconds || 0), 0))}</td></tr>`).join("")}</tbody></table></div></details>`;
        })
        .join("") || '<p class="empty">暂时还没有受邀读者。</p>'
    }<h3 class="ruled">读者分享的笔记</h3>${notes.map((n) => `<div class="note-record"><p class="muted">${e(n.profiles?.display_name)} · ${e(n.sections?.title)}</p><p>${e(n.content)}</p></div>`).join("") || '<p class="empty">暂无读者主动分享的笔记。</p>'}</article>`,
  };
}
