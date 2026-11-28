import { escapeHtml as e } from "../core/utils.js";

export function sectionHeading(section, chapterTitle) {
  const title =
    section.title && section.title !== chapterTitle
      ? `<h2>${e(section.title)}</h2>`
      : "";
  const subtitle = section.subtitle
    ? `<p class="section-subtitle">${e(section.subtitle)}</p>`
    : "";
  return title || subtitle
    ? `<header class="section-heading">${title}${subtitle}</header>`
    : "";
}
