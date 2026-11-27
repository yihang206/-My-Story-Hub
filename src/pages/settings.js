import { accessPanel } from "../components/access.js";
import {
  escapeHtml as e,
  check,
  normalizePreferences,
  showToast,
} from "../core/utils.js";
export function preferenceFields(p) {
  return `<div class="form-grid"><div><label for="pref-font">正文字体</label><select id="pref-font" name="font_family"><option value="serif" ${p.font_family === "serif" ? "selected" : ""}>宋体 / 衬线</option><option value="sans" ${p.font_family === "sans" ? "selected" : ""}>黑体 / 无衬线</option></select></div><label>字号<input name="font_size" type="number" min="16" max="32" value="${p.font_size}"></label><label>行距<input name="line_height" type="number" min="1.4" max="2.6" step="0.1" value="${p.line_height}"></label><label>正文宽度<input name="reading_width" type="number" min="480" max="1000" step="20" value="${p.reading_width}"></label><div><label for="pref-theme">阅读主题</label><select id="pref-theme" name="theme"><option value="paper" ${p.theme === "paper" ? "selected" : ""}>浅色纸张</option><option value="warm" ${p.theme === "warm" ? "selected" : ""}>暖色纸张</option><option value="dark" ${p.theme === "dark" ? "selected" : ""}>深色夜读</option></select></div></div>`;
}
export function bindPreferences(ctx, form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("[type=submit]");
    button.disabled = true;
    try {
      const p = normalizePreferences(Object.fromEntries(new FormData(form)));
      await ctx.data.savePreferences(p);
      ctx.session.preferences = p;
      ctx.applyPreferences();
      showToast("阅读偏好已保存");
    } catch (e) {
      showToast(e.message);
    } finally {
      button.disabled = false;
    }
  });
}
export async function settings(ctx) {
  const access = ctx.isAdmin() ? await accessPanel(ctx) : null;
  return {
    html: `<article class="paper-page"><p class="eyebrow">A SPACE OF YOUR OWN</p><h2>个人设置</h2><p>${e(ctx.session.user.email)} · ${ctx.isAdmin() ? "创作者" : "受邀读者"}</p><form id="profile-form"><label>显示名称<input name="display_name" maxlength="80" required value="${e(ctx.session.profile.display_name)}"></label><button type="submit">保存名称</button></form><h3 class="ruled">阅读偏好</h3><form id="preferences-form">${preferenceFields(ctx.session.preferences)}<button type="submit" class="primary">保存阅读偏好</button></form><h3 class="ruled">账号安全</h3><form id="password-form"><label>新密码<input type="password" name="password" minlength="8" required autocomplete="new-password"></label><label>确认新密码<input type="password" name="confirm" minlength="8" required autocomplete="new-password"></label><button type="submit">修改密码</button></form><p class="muted">阅读进度与估算阅读时长仅用于继续阅读及作者的私人反馈，不公开展示。</p><button data-action="logout">退出登录</button>${access?.html || ""}</article>`,
    mount(el) {
      if (ctx.session.preview) {
        el.querySelectorAll("input,textarea,select,button").forEach(
          (input) => (input.disabled = true),
        );
        return;
      }
      access?.mount(el);
      bindPreferences(ctx, el.querySelector("#preferences-form"));
      for (const [selector, handler] of [
        [
          "#profile-form",
          async (f) => {
            const display_name = new FormData(f).get("display_name").trim();
            if (!display_name) throw Error("显示名称不能为空");
            check(
              await ctx.db.rpc("update_story_display_name", {
                new_name: display_name,
              }),
            );
            ctx.session.profile.display_name = display_name;
            showToast("名称已更新");
          },
        ],
        [
          "#password-form",
          async (f) => {
            const data = new FormData(f);
            if (data.get("password") !== data.get("confirm"))
              throw Error("两次密码不一致");
            check(
              await ctx.db.auth.updateUser({ password: data.get("password") }),
            );
            f.reset();
            showToast("密码已修改");
          },
        ],
      ])
        el.querySelector(selector).addEventListener("submit", async (ev) => {
          ev.preventDefault();
          const b = ev.target.querySelector("button");
          b.disabled = true;
          try {
            await handler(ev.target);
          } catch (e) {
            showToast(e.message);
          } finally {
            b.disabled = false;
          }
        });
    },
  };
}
