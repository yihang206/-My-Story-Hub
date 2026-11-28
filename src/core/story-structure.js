export const isPrologue = (part) => part?.entry_type === "prologue";

export function orderedParts(parts) {
  return [...parts].sort(
    (a, b) =>
      Number(isPrologue(b)) - Number(isPrologue(a)) ||
      (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) ||
      String(a.created_at || "").localeCompare(String(b.created_at || "")),
  );
}

export const chapterLabel = (chapter) =>
  [isPrologue(chapter.volumes) ? "" : chapter.volumes?.title, chapter.title]
    .filter(Boolean)
    .join(" · ");
