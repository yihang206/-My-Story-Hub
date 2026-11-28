import { check } from "../core/utils.js";
export function createData(db, session) {
  const admin = () => {
    if (
      session.preview ||
      session.profile?.role !== "admin" ||
      !session.profile.is_active
    )
      throw Error("仅创作者可执行此操作");
  };
  const ordered = (table, key, id) => {
    let q = db.from(table).select("*").order("sort_order").order("created_at");
    if (key) q = q.eq(key, id);
    if (session.preview || session.profile.role !== "admin")
      q =
        table === "chapters"
          ? q.eq("status", "published")
          : q.eq("is_published", true);
    return q.then(check);
  };
  return {
    db,
    admin,
    async profile() {
      const p = check(
        await db
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle(),
      );
      if (!p?.is_active) throw Error("该账号尚未获得藏书馆访问权限，或已停用");
      return p;
    },
    works: () => ordered("works"),
    volumes: (id) => ordered("volumes", "work_id", id),
    chapters: (id) => ordered("chapters", "volume_id", id),
    sections: (id) => ordered("sections", "chapter_id", id),
    async one(table, id) {
      let query = db.from(table).select("*").eq("id", id);
      if (session.preview || session.profile.role !== "admin") {
        query =
          table === "chapters"
            ? query.eq("status", "published")
            : query.eq("is_published", true);
      }
      return check(await query.single());
    },
    async tree(workId) {
      const volumes = await ordered("volumes", "work_id", workId);
      return Promise.all(
        volumes.map(async (v) => ({
          ...v,
          chapters: await ordered("chapters", "volume_id", v.id),
        })),
      );
    },
    async recent() {
      let ids;
      if (session.preview) {
        const works = await ordered("works");
        const volumes = (
          await Promise.all(
            works.map((w) => ordered("volumes", "work_id", w.id)),
          )
        ).flat();
        ids = (
          await Promise.all(
            volumes.map((v) => ordered("chapters", "volume_id", v.id)),
          )
        )
          .flat()
          .map((c) => c.id);
        if (!ids.length) return [];
      }
      let query = db
        .from("chapters")
        .select("*,volumes(title,works(title))")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);
      if (ids) query = query.in("id", ids);
      return check(await query);
    },
    async progress(chapterId) {
      if (session.preview) return [];
      let q = db
        .from("reading_progress")
        .select(
          "*,chapters(id,title,status,volumes(title,work_id,works(title)))",
        )
        .eq("user_id", session.user.id);
      if (chapterId) q = q.eq("chapter_id", chapterId);
      return check(await q.order("last_read_at", { ascending: false }));
    },
    async preferences() {
      return check(
        await db
          .from("reader_preferences")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle(),
      );
    },
    async savePosition(chapterId, position) {
      if (session.preview) return;
      const saved = check(
        await db
          .from("reading_progress")
          .update({
            section_id: position.sectionId,
            paragraph_index: position.paragraphIndex,
            progress_percent: position.percent,
            last_read_at: new Date().toISOString(),
          })
          .eq("user_id", session.user.id)
          .eq("chapter_id", chapterId)
          .select("chapter_id")
          .maybeSingle(),
      );
      if (!saved) throw Error("段落位置未保存，请重试");
    },
    async savePreferences(p) {
      if (session.preview) throw Error("读者预览不会保存设置");
      check(
        await db.from("reader_preferences").upsert(
          {
            ...p,
            user_id: session.user.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        ),
      );
    },
    async insert(table, payload) {
      admin();
      return check(await db.from(table).insert(payload).select().single());
    },
    async update(table, id, payload) {
      admin();
      return check(await db.from(table).update(payload).eq("id", id));
    },
    async draft(id) {
      admin();
      return check(
        await db
          .from("section_drafts")
          .select("*")
          .eq("section_id", id)
          .maybeSingle(),
      );
    },
    async saveDraft(payload) {
      admin();
      check(
        await db
          .from("section_drafts")
          .upsert(payload, { onConflict: "section_id" }),
      );
    },
    async revisions(id) {
      admin();
      return check(
        await db
          .from("revisions")
          .select("*")
          .eq("section_id", id)
          .order("created_at", { ascending: false }),
      );
    },
  };
}
