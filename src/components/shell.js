export const icons = {
  home: '<path d="M3 11 12 3l9 8M6 10v11h4v-7h4v7h4V10"/>',
  book: '<path d="M12 5v16M12 5C8 2 4 3 2 5v14c4-2 7-1 10 2 3-3 6-4 10-2V5c-2-2-6-3-10 0Z"/>',
  chart: '<path d="M3 3v18h19M6 18v-8h3v8m3 0V5h3v13m3 0v-6h3v6"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 21c0-10 16-10 16 0Z"/>',
  feather:
    '<path d="m3 21 15-15M6 17C4 7 15 2 22 2c0 10-8 17-16 15Zm4-4h6m-3-3V6"/>',
};
export const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">${icons[name] || icons.book}</svg>`;
export function mountShell(root, session, frame) {
  root.innerHTML = `<div id="shell" data-view="home"><div class="art-stage" aria-hidden="true"></div><header class="art-top"><div class="art-meta"><span>VOL. 01</span><span>故事 · 创作 · 阅读</span><span>SINCE 2026</span></div><div class="art-brand"><h1>Story Hub</h1><p class="art-subtitle">私人小说创作与阅读空间</p></div><nav class="art-nav" aria-label="主导航">${navigation(session)}</nav></header><div id="route-status" role="status" aria-live="polite" hidden></div><div id="reader-preview-banner" hidden><span>读者视角预览 · 只读 · 所有已发布作品</span><button data-action="reader-preview">退出预览</button></div><main id="page" tabindex="-1"></main><div class="art-mobile-art" aria-hidden="true"></div></div>`;
  document
    .querySelector("#shell")
    .style.setProperty("--art", `url("${frame}")`);
}

function navigation(session) {
  const admin = session.profile.role === "admin" && !session.preview;
  return `<button data-route="home">${icon("home")} 首页</button><button data-route="library">${icon("book")} 作品</button><button data-route="${admin ? "insights" : "history"}">${icon("chart")} ${admin ? "阅读反馈" : "阅读记录"}</button><details class="art-menu"><summary aria-label="个人菜单">${icon("user")}</summary><div class="art-menu-panel">${admin ? '<button data-route="studio">创作管理</button><button data-action="reader-preview">读者视角预览</button>' : ""}<button data-route="history">我的阅读记录</button><button data-route="settings">个人设置</button><button data-action="logout">退出登录</button></div></details>`;
}
export function syncNavigation(session) {
  const nav = document.querySelector(".art-nav");
  const mode = session.preview ? "preview" : session.profile.role;
  if (nav.dataset.mode !== mode) {
    nav.innerHTML = navigation(session);
    nav.dataset.mode = mode;
  }
  document.querySelector("#reader-preview-banner").hidden = !session.preview;
}
