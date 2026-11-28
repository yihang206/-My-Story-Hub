import { resumeReading } from "../components/resume-reading.js";
import { escapeHtml as e, date, uid } from "../core/utils.js";
import { icon } from "../components/shell.js";
export function book(work, cover) {
  return work
    ? `<button class="art-book" data-route="directory/${uid(work.id)}">${cover ? `<img class="art-book-cover" src="${e(cover)}" alt="${e(work.title)}作品封面">` : `<span class="art-book-cover cover-empty">${e(work.title)}</span>`}<span class="art-book-info"><span class="art-book-meta">长篇小说</span><h3>${e(work.title)}</h3><i>${e(work.subtitle)}</i><p>${e(work.description)}</p></span><span class="art-book-arrow" aria-hidden="true">→</span></button>`
    : '<p class="art-empty">暂时还没有可阅读的作品。</p>';
}
const heading = (title, en, name) =>
  `<div class="art-heading"><div class="art-heading-main">${icon(name)}<h2>${title}</h2><em>${en}</em></div></div>`;
export async function collection(ctx, view) {
  const [works, recent] = await Promise.all([
    ctx.data.works(),
    view === "home" ? ctx.data.recent() : Promise.resolve([]),
  ]);
  const resume = view === "home" ? await resumeReading(ctx, works) : "";
  const featured = works[0];
  const cover = featured ? await ctx.cover(featured) : null;
  const admin = ctx.isAdmin();
  return {
    html: `<section class="art-hero"><h2>${view === "home" ? "让故事，<br>以另一种方式延续。" : "把世界，<br>收藏进故事里。"}</h2><p>${view === "home" ? "Turn the stories from games<br>into novels worth reading." : "Every book holds a world<br>waiting to unfold."}</p></section>${resume}<section class="art-collection">${heading("作品书架", "The Bookshelf", "book")}<div class="art-books ${admin ? "" : "reader-books"}">${book(featured, cover)}${admin ? '<button class="art-add" data-action="new-work"><span>＋</span>新增作品</button>' : ""}</div>${view === "home" ? '<button class="all-works" data-route="library">全部作品 →</button>' : ""}</section><section class="art-recent">${heading(view === "home" ? "最近更新" : "全部作品", view === "home" ? "Recent Updates" : "All Works", view === "home" ? "feather" : "book")}<ul class="art-updates">${view === "home" ? (recent.length ? recent.map((c, i) => `<li><button class="art-update" data-route="reader/${uid(c.id)}"><span class="art-update-number">${String(i + 1).padStart(2, "0")}</span><span class="art-update-title" title="${e(c.title)}">《${e(c.volumes?.works?.title)}》 ${e(c.volumes?.title)} · ${e(c.title)}</span><time class="art-update-date">${date(c.published_at)}</time></button></li>`).join("") : '<li class="art-empty">故事尚未开始。</li>') : works.map((w, i) => `<li><button class="art-update" data-route="directory/${uid(w.id)}"><span class="art-update-number">${String(i + 1).padStart(2, "0")}</span><span>${e(w.title)}</span><span aria-hidden="true">→</span></button></li>`).join("") || '<li class="art-empty">暂无开放的作品。</li>'}</ul></section>`,
  };
}
