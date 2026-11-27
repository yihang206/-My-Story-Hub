import {
  escapeHtml as e,
  check,
  uid,
  textMarkup,
  showToast,
  date,
} from "../core/utils.js";
import { DraftController } from "../core/draft.js";
import { config } from "../config.js";
const options = (rows, id) =>
  rows
    .map(
      (r) =>
        `<option value="${e(r.id)}" ${r.id === id ? "selected" : ""}>${e(r.title)}</option>`,
    )
    .join("");
export async function studio(ctx, workId, sectionId) {
  ctx.data.admin();
  const works = await ctx.data.works();
  const work = works.find((w) => w.id === workId) || works[0];
  if (!work)
    return {
      html: '<article class="paper-page"><h2>创作管理</h2><p>从第一部作品开始。</p><button data-action="new-work">新增作品</button></article>',
    };
  const tree = await ctx.data.tree(work.id);
  const chapters = tree.flatMap((v) => v.chapters);
  const bundles = await Promise.all(
    chapters.map(async (c) => ({
      ...c,
      sections: await ctx.data.sections(c.id),
    })),
  );
  const sections = bundles.flatMap((c) => c.sections);
  const section = sections.find((s) => s.id === sectionId) || sections[0];
  const chapter =
    bundles.find((c) => c.sections.some((s) => s.id === section?.id)) ||
    bundles[0];
  const volume = tree.find((v) => v.id === chapter?.volume_id) || tree[0];
  const draft = section ? await ctx.data.draft(section.id) : null;
  return {
    html: `<article class="paper-page studio-page"><p class="eyebrow">WRITER STUDIO</p><h2>创作管理</h2><div class="studio-layout"><aside><label>作品<select id="studio-work">${options(works, work.id)}</select></label><div class="actions"><button id="edit-work">作品信息</button><button id="upload-cover">上传封面</button></div><h3>作品结构</h3><div class="actions"><button data-new="volumes">新增分卷</button><button data-new="chapters" ${volume ? "" : "disabled"}>新增章节</button><button data-new="sections" ${chapter ? "" : "disabled"}>新增小节</button></div><p class="muted">新章节默认属于当前卷；新小节默认属于当前章。</p>${tree
      .map(
        (v) =>
          `<details open><summary>${e(v.title)}</summary><button class="small" data-edit="volumes" data-id="${e(v.id)}">编辑卷标题与顺序</button>${bundles
            .filter((c) => c.volume_id === v.id)
            .map(
              (c) =>
                `<details open><summary>${e(c.title)}</summary><button class="small" data-edit="chapters" data-id="${e(c.id)}">编辑章标题与顺序</button>${c.sections.map((s) => `<button class="tree-section" data-route="studio/${uid(work.id)}/${uid(s.id)}" ${s.id === section?.id ? 'aria-current="page"' : ""}>${e(s.title)} <small>${s.is_published ? "已发布" : "草稿"}</small></button>`).join("")}</details>`,
            )
            .join("")}</details>`,
      )
      .join(
        "",
      )}</aside><div class="editor">${section ? `<div class="actions"><span class="status-tag">${section.is_published ? "已发布内容的修订草稿" : "Draft · 草稿"}</span><span id="save-status" role="status">已载入草稿</span><span id="word-count"></span></div><label>小节标题<input id="draft-title" value="${e(draft?.title ?? section.title)}" maxlength="200"></label><label>正文<textarea id="draft-content" spellcheck="false">${e(draft?.content ?? section.content)}</textarea></label><div class="form-grid"><label>内容类型<select id="section-type"><option value="main">主线</option><option value="extra">番外</option><option value="background">背景故事</option></select></label><label>排序<input id="section-order" type="number" min="0" step="1" value="${Number(section.sort_order) || 0}"></label></div><div class="actions"><button id="save-draft" class="primary">保存草稿</button><button id="preview-draft">读者视角预览</button><button id="revisions">版本记录</button><button id="publish-section" ${config.verifiedRpc ? "" : "disabled"}>发布当前小节</button><button id="withdraw-section" ${section.is_published ? "" : "disabled"}>撤回当前小节</button></div>${config.verifiedRpc ? "" : '<p class="notice">草稿与正式正文分离。发布需先核对现有 RPC 定义及 RLS，当前未启用。</p>'}` : '<p class="empty">建立分卷、章节和小节后，就可以开始书写。</p>'}</div></div></article>`,
    mount(el) {
      let controller;
      if (section) {
        const title = el.querySelector("#draft-title"),
          content = el.querySelector("#draft-content");
        const status = el.querySelector("#save-status");
        controller = new DraftController(
          {
            section_id: section.id,
            title: title.value,
            content: content.value,
          },
          (p) => ctx.data.saveDraft(p),
          (text) => (status.textContent = text),
        );
        ctx.draft = controller;
        const count = () =>
          (el.querySelector("#word-count").textContent =
            `${Array.from(content.value.replace(/\s/g, "")).length} 字`);
        count();
        for (const input of [title, content])
          input.oninput = () => {
            controller.change({ title: title.value, content: content.value });
            count();
          };
        el.querySelector("#section-type").value =
          section.section_type || "main";
        el.querySelector("#save-draft").onclick = ctx.action(async () => {
          await controller.flush();
          showToast("草稿已保存");
        });
        el.querySelector("#preview-draft").onclick = () =>
          ctx.dialog(
            `<article class="preview-text"><p class="eyebrow">草稿预览 · 未发布</p><h2>${e(title.value)}</h2>${textMarkup(content.value)}</article>`,
          );
        el.querySelector("#revisions").onclick = ctx.action(async () => {
          const revisions = await ctx.data.revisions(section.id);
          ctx.dialog(
            `<h2>版本记录</h2>${revisions.map((r, i) => `<div class="record"><span>${date(r.created_at)} · ${e(r.title)}</span><button data-restore="${i}">恢复为草稿</button></div>`).join("") || "<p>暂无历史版本。</p>"}`,
          );
          document.querySelectorAll("[data-restore]").forEach(
            (b) =>
              (b.onclick = () => {
                if (!confirm("将此版本恢复为当前草稿？")) return;
                const r = revisions[Number(b.dataset.restore)];
                title.value = r.title || "";
                content.value = r.content || "";
                content.dispatchEvent(new Event("input"));
                document.querySelector("#dialog").close();
              }),
          );
        });
        el.querySelector("#publish-section").onclick = ctx.action(async () => {
          if (!config.verifiedRpc) throw Error("尚未核验发布 RPC");
          if (!content.value.trim() || !title.value.trim())
            throw Error("标题和正文不能为空");
          const order = Number(el.querySelector("#section-order").value);
          if (!Number.isInteger(order) || order < 0)
            throw Error("排序必须为非负整数");
          if (!confirm("发布当前小节？已授权读者将看到此版本。")) return;
          const newType = el.querySelector("#section-type").value;
          const controls = [
            ...el.querySelectorAll(
              ".editor input,.editor textarea,.editor select",
            ),
          ];
          controls.forEach((control) => (control.disabled = true));
          try {
            controller.change({ title: title.value, content: content.value });
            await controller.flush();
            // A retry after a partially completed cascade must not add the same revision again.
            const current = await ctx.data.one("sections", section.id);
            if (
              !current.is_published ||
              current.title !== title.value ||
              current.content !== content.value ||
              current.section_type !== newType ||
              Number(current.sort_order) !== order
            )
              check(
                await ctx.db.rpc("publish_story_section", {
                  target_section: section.id,
                  new_type: newType,
                  new_order: order,
                }),
              );
            await ctx.data.update("chapters", chapter.id, {
              status: "published",
              published_at: new Date().toISOString(),
            });
            await ctx.data.update("volumes", volume.id, { is_published: true });
            await ctx.data.update("works", work.id, { is_published: true });
            showToast("当前小节已发布");
            await ctx.reload();
          } catch (error) {
            throw Error(
              `发布流程未全部完成：${error.message}。草稿已保留，可重试完成发布。`,
            );
          } finally {
            controls.forEach((control) => (control.disabled = false));
          }
        });
        el.querySelector("#withdraw-section").onclick = ctx.action(async () => {
          if (!confirm("撤回当前已发布小节？读者将无法继续读取它。")) return;
          await controller.flush();
          await ctx.data.update("sections", section.id, {
            is_published: false,
          });
          showToast("当前小节已撤回");
          await ctx.reload();
        });
      }
      el.querySelector("#studio-work").onchange = (event) =>
        ctx.navigate(`studio/${uid(event.target.value)}`);
      el.querySelectorAll("[data-new]").forEach(
        (b) =>
          (b.onclick = ctx.action(async () => {
            const table = b.dataset.new;
            ctx.dialog(
              `<h2>新增${{ volumes: "分卷", chapters: "章节", sections: "小节" }[table]}</h2><form id="new-part-form"><label>标题<input name="title" required maxlength="200"></label>${table !== "volumes" ? `<label>所属${table === "chapters" ? "分卷" : "章节"}<select name="parent">${options(table === "chapters" ? tree : chapters, table === "chapters" ? volume?.id : chapter?.id)}</select></label>` : ""}<button type="submit" class="primary">创建</button></form>`,
            );
            const form = document.querySelector("#new-part-form");
            form.onsubmit = async (event) => {
              event.preventDefault();
              const button = form.querySelector("button");
              button.disabled = true;
              try {
                await ctx.flushDraft();
                const fields = new FormData(form);
                const parentKey = {
                  volumes: "work_id",
                  chapters: "volume_id",
                  sections: "chapter_id",
                }[table];
                const parent =
                  table === "volumes" ? work.id : fields.get("parent");
                const siblings = (
                  table === "volumes"
                    ? tree
                    : table === "chapters"
                      ? chapters
                      : sections
                ).filter((r) => table === "volumes" || r[parentKey] === parent);
                const payload = {
                  title: fields.get("title").trim(),
                  [parentKey]: parent,
                  sort_order:
                    Math.max(
                      0,
                      ...siblings.map((s) => Number(s.sort_order) || 0),
                    ) + 10,
                };
                const created = await ctx.data.insert(table, payload);
                document.querySelector("#dialog").close();
                ctx.navigate(
                  `studio/${uid(work.id)}${table === "sections" ? "/" + uid(created.id) : ""}`,
                  true,
                );
              } catch (error) {
                showToast(error.message);
              } finally {
                button.disabled = false;
              }
            };
          })),
      );
      el.querySelectorAll("[data-edit]").forEach(
        (b) =>
          (b.onclick = ctx.action(async () => {
            const table = b.dataset.edit;
            const item = (table === "volumes" ? tree : chapters).find(
              (r) => r.id === b.dataset.id,
            );
            const title = prompt("标题", item.title);
            if (!title?.trim()) return;
            const value = prompt("排序（越小越靠前）", String(item.sort_order));
            if (value === null) return;
            const sort_order = Number(value);
            if (!Number.isInteger(sort_order) || sort_order < 0)
              throw Error("排序必须为非负整数");
            await ctx.flushDraft();
            await ctx.data.update(table, item.id, {
              title: title.trim(),
              sort_order,
            });
            await ctx.reload();
          })),
      );
      el.querySelector("#edit-work").onclick = () => ctx.editWork(work);
      el.querySelector("#upload-cover").onclick = () => ctx.uploadCover(work);
      return () => {
        controller?.dispose();
        if (ctx.draft === controller) ctx.draft = null;
      };
    },
  };
}
