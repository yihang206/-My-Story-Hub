import { check, escapeHtml as e, showToast, date } from "../core/utils.js";
export async function notesPanel(ctx, sections) {
  const own = ctx.session.user.id;
  let notes = ctx.session.preview
    ? []
    : check(
        await ctx.db
          .from("reader_notes")
          .select("*")
          .eq("user_id", own)
          .in(
            "section_id",
            sections.map((s) => s.id),
          )
          .order("created_at", { ascending: false }),
      );
  const rows = () =>
    notes
      .map(
        (n) =>
          `<div class="note-record"><p>${e(n.content)}</p><p class="muted">${date(n.updated_at)} · ${n.share_with_author ? "已分享给作者" : "仅自己可见"}</p><div class="actions"><button data-note-edit="${e(n.id)}">编辑笔记</button><button data-note-share="${e(n.id)}">${n.share_with_author ? "取消分享" : "分享给作者"}</button><button data-note-delete="${e(n.id)}">删除笔记</button></div></div>`,
      )
      .join("") ||
    '<p class="muted">还没有笔记。分享给作者的选项默认关闭。</p>';
  return {
    html: `<details class="notes-panel"><summary>个人阅读笔记</summary><div id="notes-list">${rows()}</div><form id="note-form"><label for="note-section">所属小节</label><select id="note-section" name="section_id">${sections.map((s) => `<option value="${e(s.id)}">${e(s.title)}</option>`).join("")}</select><label>笔记内容<textarea name="content" rows="4" required maxlength="20000"></textarea></label><label class="check-label"><input name="share_with_author" type="checkbox">自愿分享给作者</label><input name="id" type="hidden"><button type="submit">保存笔记</button><button type="button" id="note-cancel">取消编辑</button></form></details>`,
    mount(el) {
      if (ctx.session.preview) {
        el.querySelectorAll(
          ".notes-panel input,.notes-panel select,.notes-panel textarea,.notes-panel button",
        ).forEach((input) => (input.disabled = true));
        return;
      }
      const form = el.querySelector("#note-form");
      const refresh = () =>
        (el.querySelector("#notes-list").innerHTML = rows());
      form.querySelector("#note-cancel").onclick = () => form.reset();
      form.onsubmit = async (event) => {
        event.preventDefault();
        const button = form.querySelector("[type=submit]");
        button.disabled = true;
        try {
          const fields = new FormData(form);
          const id = fields.get("id");
          const payload = {
            user_id: own,
            section_id: fields.get("section_id"),
            content: fields.get("content").trim(),
            share_with_author: fields.has("share_with_author"),
            updated_at: new Date().toISOString(),
          };
          if (!payload.content) throw Error("笔记内容不能为空");
          const query = id
            ? ctx.db
                .from("reader_notes")
                .update(payload)
                .eq("id", id)
                .eq("user_id", own)
            : ctx.db.from("reader_notes").insert(payload);
          const saved = check(await query.select().single());
          notes = [saved, ...notes.filter((n) => n.id !== saved.id)];
          refresh();
          form.reset();
          showToast("笔记已保存");
        } catch (error) {
          showToast(error.message);
        } finally {
          button.disabled = false;
        }
      };
      el.querySelector("#notes-list").onclick = async (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        const id =
          button.dataset.noteEdit ||
          button.dataset.noteShare ||
          button.dataset.noteDelete;
        const note = notes.find((n) => n.id === id);
        if (!note) return;
        button.disabled = true;
        try {
          if (button.dataset.noteEdit) {
            form.elements.id.value = note.id;
            form.elements.section_id.value = note.section_id;
            form.elements.content.value = note.content;
            form.elements.share_with_author.checked = note.share_with_author;
            form.elements.content.focus();
          } else if (button.dataset.noteShare) {
            check(
              await ctx.db
                .from("reader_notes")
                .update({
                  share_with_author: !note.share_with_author,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", id)
                .eq("user_id", own),
            );
            note.share_with_author = !note.share_with_author;
            refresh();
          } else if (confirm("删除这条个人笔记？")) {
            check(
              await ctx.db
                .from("reader_notes")
                .delete()
                .eq("id", id)
                .eq("user_id", own),
            );
            notes = notes.filter((n) => n.id !== id);
            refresh();
          }
        } catch (error) {
          showToast(error.message);
        } finally {
          if (button.isConnected) button.disabled = false;
        }
      };
    },
  };
}
