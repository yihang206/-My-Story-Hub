import { check, escapeHtml as e, showToast } from "../core/utils.js";
export async function accessPanel(ctx) {
  ctx.data.admin();
  const [readers, works, access] = await Promise.all([
    ctx.db
      .from("profiles")
      .select("*")
      .eq("role", "reader")
      .order("created_at")
      .then(check),
    ctx.data.works(),
    ctx.db.from("work_access").select("*").then(check),
  ]);
  return {
    html: `<h3 class="ruled">受邀读者管理</h3><p class="muted">新账号由 Supabase Authentication 安全创建；此处只维护读者档案及作品授权。</p><button id="add-reader-profile">关联已邀请账号</button>${
      readers
        .map(
          (r) =>
            `<div class="record"><div><h4>${e(r.display_name)} · ${r.is_active ? "有效" : "已停用"}</h4><button data-reader-toggle="${e(r.id)}">${r.is_active ? "停用此账号" : "恢复此账号"}</button>${works
              .map((w) => {
                const allowed = access.some(
                  (a) =>
                    a.user_id === r.id && a.work_id === w.id && a.is_active,
                );
                return `<p>${e(w.title)} · ${allowed ? "已授权" : "未授权"} <button data-access-user="${e(r.id)}" data-access-work="${e(w.id)}" data-allowed="${allowed}">${allowed ? "撤销阅读权限" : "授予阅读权限"}</button></p>`;
              })
              .join("")}</div></div>`,
        )
        .join("") || '<p class="empty">尚无受邀读者。</p>'
    }`,
    mount(el) {
      el.querySelector("#add-reader-profile").onclick = ctx.action(async () => {
        const id = prompt("已在 Authentication 中创建的账号 UID");
        if (!id) return;
        if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id.trim()))
          throw Error("UID 格式无效");
        const name = prompt("读者显示名称");
        if (!name?.trim()) return;
        await ctx.data.insert("profiles", {
          id: id.trim(),
          display_name: name.trim(),
          role: "reader",
          is_active: true,
        });
        showToast("读者档案已关联");
        await ctx.reload();
      });
      el.querySelectorAll("[data-reader-toggle]").forEach(
        (b) =>
          (b.onclick = ctx.action(async () => {
            const r = readers.find((r) => r.id === b.dataset.readerToggle);
            if (
              !confirm(
                `${r.is_active ? "停用" : "恢复"} ${r.display_name} 的账号？`,
              )
            )
              return;
            await ctx.data.update("profiles", r.id, {
              is_active: !r.is_active,
            });
            await ctx.reload();
          })),
      );
      el.querySelectorAll("[data-access-user]").forEach(
        (b) =>
          (b.onclick = ctx.action(async () => {
            const enabled = b.dataset.allowed === "true";
            if (!confirm(`${enabled ? "撤销" : "授予"}这部作品的阅读权限？`))
              return;
            ctx.data.admin();
            check(
              await ctx.db
                .from("work_access")
                .upsert(
                  {
                    user_id: b.dataset.accessUser,
                    work_id: b.dataset.accessWork,
                    is_active: !enabled,
                  },
                  { onConflict: "user_id,work_id" },
                ),
            );
            await ctx.reload();
          })),
      );
    },
  };
}
