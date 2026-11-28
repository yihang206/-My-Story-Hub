export const escapeHtml = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const check = (r) => {
  if (r.error) throw r.error;
  return r.data;
};
export const date = (v) =>
  v
    ? new Date(v).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })
    : "暂无记录";
export const duration = (s) => `${Math.floor((Number(s) || 0) / 60)} 分钟`;
export const uid = (v) => encodeURIComponent(v);
export const textMarkup = (s) =>
  String(s ?? "")
    .split(/\n\s*\n|\n/)
    .filter(Boolean)
    .map((p) =>
      /^(?:-{3,}|—{3,}|─{3,}|\*\s*\*\s*\*)$/.test(p.trim())
        ? '<hr class="scene-break" aria-label="情节分隔">'
        : `<p>${escapeHtml(p)}</p>`,
    )
    .join("");
export function showToast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => (el.hidden = true), 5000);
}
export const defaults = () => ({
  font_family: "serif",
  font_size: 20,
  line_height: 1.9,
  reading_width: 760,
  theme: "paper",
});
export function normalizePreferences(p = {}) {
  return {
    font_family: p.font_family === "sans" ? "sans" : "serif",
    font_size: Math.max(16, Math.min(32, Number(p.font_size) || 20)),
    line_height: Math.max(1.4, Math.min(2.6, Number(p.line_height) || 1.9)),
    reading_width: Math.max(
      480,
      Math.min(1000, Number(p.reading_width) || 760),
    ),
    theme: ["paper", "warm", "dark"].includes(p.theme) ? p.theme : "paper",
  };
}
