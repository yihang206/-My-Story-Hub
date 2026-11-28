import { escapeHtml as e, uid } from "../core/utils.js";
import { isPrologue } from "../core/story-structure.js";

export function studioStructure(tree, chapters, work, current) {
  const sectionLinks = (chapter) =>
    chapter.sections
      .map(
        (s) =>
          `<button class="tree-section" data-route="studio/${uid(work.id)}/${uid(s.id)}" ${s.id === current?.id ? 'aria-current="page"' : ""}>${e(s.title)} <small>${s.is_published ? "已发布" : "草稿"}</small></button>`,
      )
      .join("");
  return tree
    .map((part) => {
      const entries = chapters.filter((c) => c.volume_id === part.id);
      if (isPrologue(part))
        return `<div class="studio-prologue"><h4>作品开篇</h4>${entries.map((c) => `<p>${e(c.title)}</p><button class="small" data-edit="chapters" data-id="${e(c.id)}">编辑楔子标题</button>${sectionLinks(c)}`).join("")}</div>`;
      return `<details open><summary>${e(part.title)}</summary><button class="small" data-edit="volumes" data-id="${e(part.id)}">编辑卷标题与顺序</button>${entries.map((c) => `<details open><summary>${e(c.title)}</summary><button class="small" data-edit="chapters" data-id="${e(c.id)}">编辑章标题与顺序</button>${sectionLinks(c)}</details>`).join("")}</details>`;
    })
    .join("");
}
