import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";
import { AssetManager } from "./core/assets.js";
import { Latest } from "./core/latest.js";
import {
  defaults,
  normalizePreferences,
  check,
  escapeHtml as e,
  showToast,
} from "./core/utils.js";
import { createData } from "./services/data.js";
import { mountShell, syncNavigation } from "./components/shell.js";
import { collection } from "./pages/collection.js";
import { directory } from "./pages/directory.js";
import { reader } from "./pages/reader.js";
import { studio } from "./pages/studio.js";
import { history } from "./pages/history.js";
import { insights } from "./pages/insights.js";
import { settings } from "./pages/settings.js";
import "./styles/app.css";

const db = createClient(config.supabaseUrl, config.publishableKey);
const session = {
  user: null,
  profile: null,
  preview: false,
  preferences: defaults(),
};
const assets = new AssetManager(db),
  latest = new Latest(),
  root = document.querySelector("#root");
let cleanup = null,
  currentRoute = "",
  authGeneration = 0,
  initializing = false;
const data = createData(db, session);
const ctx = {
  db,
  data,
  session,
  draft: null,
  isAdmin: () => session.profile?.role === "admin" && !session.preview,
  navigate,
  reload: () => navigate(currentRoute, true),
  action: (fn) => async (event) => {
    const button = event?.currentTarget;
    if (button?.disabled) return;
    if (button) button.disabled = true;
    try {
      await fn(event);
    } catch (error) {
      showToast(error.message || "操作失败，请重试");
    } finally {
      if (button?.isConnected) button.disabled = false;
    }
  },
  dialog: (html) => {
    document.querySelector("#dialog-body").innerHTML = html;
    const dialog = document.querySelector("#dialog");
    if (!dialog.open) dialog.showModal();
  },
  async flushDraft() {
    await ctx.draft?.flush();
  },
  async cover(work) {
    if (work.cover_url) return assets.get(work.cover_url);
    return work.title === "原神" ? assets.get("genshin-cover.webp") : null;
  },
  applyPreferences() {
    const p = session.preferences;
    document.body.dataset.theme = p.theme;
    const style = document.documentElement.style;
    style.setProperty("--reading-size", `${p.font_size}px`);
    style.setProperty("--reading-line", p.line_height);
    style.setProperty("--reading-width", `${p.reading_width}px`);
    style.setProperty(
      "--reading-font",
      p.font_family === "sans" ? "var(--sans)" : "var(--serif)",
    );
  },
  editWork(work) {
    workDialog(work);
  },
  uploadCover(work) {
    data.admin();
    ctx.dialog(
      '<h2>替换作品封面</h2><form id="cover-form"><label>选择 WebP、PNG 或 JPEG<input type="file" name="cover" accept="image/webp,image/png,image/jpeg" required></label><p class="muted">文件只会上传到私人 story-art 素材库。</p><button type="submit" class="primary">上传并保存</button></form>',
    );
    const form = document.querySelector("#cover-form");
    form.onsubmit = async (event) => {
      event.preventDefault();
      const b = form.querySelector("button");
      b.disabled = true;
      try {
        await ctx.flushDraft();
        const file = new FormData(form).get("cover");
        if (
          !["image/webp", "image/png", "image/jpeg"].includes(file.type) ||
          file.size > 5 * 1024 * 1024
        )
          throw Error("请选择 5MB 以内的 WebP、PNG 或 JPEG 图片");
        const ext = {
          "image/webp": "webp",
          "image/png": "png",
          "image/jpeg": "jpg",
        }[file.type];
        const path = `covers/${work.id}/${crypto.randomUUID()}.${ext}`;
        check(
          await db.storage
            .from("story-art")
            .upload(path, file, { upsert: false, contentType: file.type }),
        );
        await data.update("works", work.id, { cover_url: path });
        document.querySelector("#dialog").close();
        showToast("封面已保存");
        await ctx.reload();
      } catch (error) {
        showToast(error.message);
      } finally {
        b.disabled = false;
      }
    };
  },
};
document.querySelector("#dialog-close").onclick = () =>
  document.querySelector("#dialog").close();

function login(message = "") {
  document.body.dataset.mode = "login";
  document.body.dataset.theme = "paper";
  root.innerHTML = `<main class="login-screen"><section class="login-card"><div class="ornament" aria-hidden="true">✧</div><p class="eyebrow">PRIVATE LIBRARY · SINCE 2026</p><h1>Story Hub</h1><p>私人创作与阅读空间</p><div class="gold-divider"></div><p class="login-quote">让故事，以另一种方式延续。</p><form id="login-form"><label for="email">邮箱</label><input id="email" type="email" autocomplete="username" required placeholder="请输入受邀邮箱"><label for="password">密码</label><input id="password" type="password" autocomplete="current-password" required placeholder="请输入密码"><button class="primary" type="submit">打开藏书馆</button><p id="login-message" role="status" aria-live="polite">${e(message)}</p></form><p class="muted">仅向受邀好友开放 · 不提供公开注册</p></section></main>`;
  root.querySelector("#login-form").onsubmit = async (event) => {
    event.preventDefault();
    const button = event.target.querySelector("button");
    const status = root.querySelector("#login-message");
    button.disabled = true;
    status.textContent = "正在验证账号……";
    try {
      const { user } = check(
        await db.auth.signInWithPassword({
          email: root.querySelector("#email").value.trim(),
          password: root.querySelector("#password").value,
        }),
      );
      root.querySelector("#password").value = "";
      await initialize(user);
    } catch (error) {
      if (status.isConnected) status.textContent = `登录失败：${error.message}`;
      else login(error.message);
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  };
}
async function initialize(user) {
  const generation = ++authGeneration;
  initializing = true;
  session.user = user;
  try {
    const profile = await data.profile();
    if (generation !== authGeneration) return;
    session.profile = profile;
    const message = root.querySelector("#login-message");
    if (message) message.textContent = "正在展开书卷与私人素材……";
    const [frame, prefs] = await Promise.all([
      assets.get("story-frame.webp"),
      data.preferences(),
    ]);
    if (generation !== authGeneration) return;
    session.preferences = normalizePreferences(prefs || {});
    document.body.dataset.mode = "app";
    mountShell(root, session, frame);
    await renderRoute();
  } catch (error) {
    if (generation === authGeneration) {
      await clearSession();
      login(`无法打开藏书馆：${error.message}。请重试登录。`);
    }
  } finally {
    initializing = false;
  }
}
async function clearSession() {
  authGeneration++;
  latest.cancel();
  const dispose = cleanup;
  cleanup = null;
  ctx.draft?.dispose();
  ctx.draft = null;
  session.user = null;
  session.profile = null;
  session.preview = false;
  session.preferences = defaults();
  currentRoute = "";
  root.replaceChildren();
  assets.clear();
  document.querySelector("#dialog").close();
  document.querySelector("#dialog-body").replaceChildren();
  document.querySelector("#toast").hidden = true;
  for (const key of [
    "--reading-size",
    "--reading-line",
    "--reading-width",
    "--reading-font",
  ])
    document.documentElement.style.removeProperty(key);
  if (dispose) await dispose();
}
async function logout() {
  await ctx.flushDraft();
  if (cleanup) {
    const dispose = cleanup;
    cleanup = null;
    await dispose();
  }
  check(await db.auth.signOut());
  await clearSession();
  historyReplace("home");
  login();
}
function historyReplace(route) {
  window.history.replaceState(null, "", `#/${route}`);
}
async function navigate(route, replace = false) {
  if (replace) historyReplace(route);
  else window.history.pushState(null, "", `#/${route}`);
  await renderRoute();
}
async function renderRoute() {
  if (!session.user || !document.querySelector("#shell")) return;
  const valid = latest.begin();
  const route = location.hash.replace(/^#\/?/, "") || "home";
  const [view, rawId, rawSection] = route.split("/");
  let id, sectionId;
  try {
    id = rawId ? decodeURIComponent(rawId) : undefined;
    sectionId = rawSection ? decodeURIComponent(rawSection) : undefined;
  } catch {
    showToast("页面地址无效");
    return;
  }
  const status = document.querySelector("#route-status");
  status.textContent = "正在展开故事……";
  status.hidden = false;
  try {
    await ctx.flushDraft();
    if (!valid()) return;
    const profile = await data.profile();
    if (!valid()) return;
    session.profile = profile;
    if (profile.role !== "admin") session.preview = false;
    if (["studio", "insights"].includes(view)) data.admin();
    let result;
    if (view === "home" || view === "library")
      result = await collection(ctx, view);
    else if (view === "directory" && id) result = await directory(ctx, id);
    else if (view === "reader" && id) result = await reader(ctx, id);
    else if (view === "studio") result = await studio(ctx, id, sectionId);
    else if (view === "history") result = await history(ctx);
    else if (view === "insights") result = await insights(ctx);
    else if (view === "settings") result = await settings(ctx);
    else throw Error("没有找到这一页");
    if (!valid()) return;
    if (cleanup) {
      const dispose = cleanup;
      cleanup = null;
      await dispose();
    }
    if (!valid()) return;
    const shell = document.querySelector("#shell"),
      page = document.querySelector("#page");
    syncNavigation(session);
    shell.dataset.view = view;
    document.body.dataset.mode = view === "reader" ? "reader" : "app";
    document.body.dataset.theme = "paper";
    page.innerHTML = result.html;
    currentRoute = route;
    root.querySelectorAll(".art-nav [data-route]").forEach((b) => {
      if (b.dataset.route === view) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    root.querySelectorAll(".art-menu").forEach((el) => (el.open = false));
    window.scrollTo(0, 0);
    cleanup = result.mount?.(page) || null;
    status.hidden = true;
    page.focus({ preventScroll: true });
  } catch (error) {
    if (!valid()) return;
    // Failed draft saves keep the current editor and block navigation.
    if (ctx.draft?.dirty) {
      historyReplace(currentRoute);
      status.hidden = true;
      showToast(error.message);
      return;
    }
    status.innerHTML = `<span>${e(error.message || "页面暂时无法加载")}</span> <button data-action="retry">重试</button>`;
    // The persistent shell and last good page remain visible on failure.
    if (/停用|尚未获得/.test(error.message)) {
      await clearSession();
      login(error.message);
    }
  }
}
function workDialog(work) {
  data.admin();
  ctx.dialog(
    `<h2>${work ? "作品信息" : "新增作品"}</h2><form id="work-form"><label>中文标题<input name="title" required maxlength="200" value="${e(work?.title)}"></label><label>英文标题<input name="subtitle" maxlength="200" value="${e(work?.subtitle)}"></label><label>简介<textarea name="description" rows="4">${e(work?.description)}</textarea></label><button type="submit" class="primary">保存作品</button></form>`,
  );
  document.querySelector("#work-form").onsubmit = async (event) => {
    event.preventDefault();
    const button = event.target.querySelector("button");
    button.disabled = true;
    try {
      await ctx.flushDraft();
      const fields = Object.fromEntries(new FormData(event.target));
      fields.title = fields.title.trim();
      if (!fields.title) throw Error("请输入作品标题");
      if (work) await data.update("works", work.id, fields);
      else {
        const works = await data.works();
        await data.insert("works", {
          ...fields,
          sort_order:
            Math.max(0, ...works.map((w) => Number(w.sort_order) || 0)) + 10,
          is_published: false,
        });
      }
      document.querySelector("#dialog").close();
      showToast("作品已保存");
      await navigate(work ? currentRoute : "library", true);
    } catch (error) {
      showToast(error.message);
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  };
}
root.addEventListener("click", (event) => {
  const target = event.target.closest("[data-route],[data-action]");
  if (!target || target.disabled) return;
  if (target.dataset.route) {
    void navigate(target.dataset.route);
    return;
  }
  const action = target.dataset.action;
  void ctx.action(async () => {
    if (action === "reader-preview") {
      if (session.profile?.role !== "admin") throw Error("仅创作者可预览");
      await ctx.flushDraft();
      latest.cancel();
      if (cleanup) {
        const dispose = cleanup;
        cleanup = null;
        await dispose();
      }
      session.preview = !session.preview;
      syncNavigation(session);
      await navigate("home", true);
    }
    if (action === "logout") await logout();
    if (action === "new-work") workDialog();
    if (action === "retry") await renderRoute();
  })({ currentTarget: target });
});
window.addEventListener("hashchange", () => void renderRoute());
window.addEventListener("beforeunload", (event) => {
  if (ctx.draft?.dirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) void ctx.flushDraft().catch((e) => showToast(e.message));
});
db.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    const generation = authGeneration;
    setTimeout(() => {
      if (generation === authGeneration && !initializing)
        void clearSession().then(() => login());
    }, 0);
  }
  if (event === "TOKEN_REFRESHED" && !initializing && session.user)
    void renderRoute();
});
login();
try {
  const auth = check(await db.auth.getSession());
  if (auth.session?.user) await initialize(auth.session.user);
} catch (error) {
  login(`无法恢复会话：${error.message}`);
}
