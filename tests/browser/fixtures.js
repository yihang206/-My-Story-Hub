import fs from "node:fs/promises";
// Deliberately synthetic data. Never used by the deployed application.
export const ids = {
  user: "11111111-1111-4111-8111-111111111111",
  work: "22222222-2222-4222-8222-222222222222",
  volume: "33333333-3333-4333-8333-333333333333",
  chapter: "44444444-4444-4444-8444-444444444444",
  section: "55555555-5555-4555-8555-555555555555",
};
export async function fixture(
  page,
  { role = "admin", active = true, failArt = false } = {},
) {
  const requests = [];
  const writes = [];
  const user = {
    id: ids.user,
    email: "fixture@example.invalid",
    aud: "authenticated",
    role: "authenticated",
  };
  const token = {
    access_token: "fixture-token-only-not-real",
    refresh_token: "fixture-refresh",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  };
  const works = [
    {
      id: ids.work,
      title: "原神",
      subtitle: "Genshin Impact",
      description: "一段跨越七国的旅程。",
      sort_order: 10,
      is_published: true,
    },
  ];
  const volumes = [
    {
      id: ids.volume,
      work_id: ids.work,
      title: "第一卷 · 风与自由之城",
      sort_order: 10,
      is_published: true,
    },
  ];
  const chapters = [
    {
      id: ids.chapter,
      volume_id: ids.volume,
      title: "测试章节 · 风的来处",
      status: "published",
      published_at: "2026-11-20T00:00:00Z",
      sort_order: 10,
      volumes: { ...volumes[0], works: works[0] },
    },
  ];
  const sections = [
    {
      id: ids.section,
      chapter_id: ids.chapter,
      title: "测试小节",
      content: Array(45)
        .fill(
          "这是用于浏览器验证的合成测试文字，不是真实小说内容。风吹过长长的回廊，书页轻轻翻动，故事从这里继续。",
        )
        .join("\n\n"),
      is_published: true,
      section_type: "main",
      sort_order: 10,
    },
  ];
  const tables = {
    profiles: [
      { id: ids.user, display_name: "验收测试账号", role, is_active: active },
    ],
    works,
    volumes,
    chapters,
    sections,
    reading_progress: [],
    reading_stats: [],
    reader_preferences: [],
    reader_notes: [],
    section_drafts: [],
    revisions: [],
    work_access: [],
  };
  await page.route(
    "https://wkwwudednbgywllndjtc.supabase.co/**",
    async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      requests.push({ path: url.pathname, method: req.method() });
      const fulfill = (body, status = 200, extra = {}) =>
        route.fulfill({
          status,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(body),
          ...extra,
        });
      if (req.method() === "OPTIONS")
        return route.fulfill({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
          },
        });
      if (url.pathname.includes("/auth/v1/token")) {
        const body = req.postDataJSON();
        return body.password === "incorrect"
          ? fulfill(
              {
                error: "invalid_grant",
                error_description: "Invalid login credentials",
              },
              400,
            )
          : fulfill(token);
      }
      if (url.pathname.includes("/auth/v1/logout")) return fulfill({});
      if (url.pathname.includes("/auth/v1/user")) return fulfill(user);
      if (url.pathname.includes("/rest/v1/rpc/")) {
        const name = url.pathname.split("/").at(-1);
        const payload = req.postDataJSON();
        writes.push({ table: name, payload });
        if (name === "publish_story_section") {
          const target = sections.find((s) => s.id === payload.target_section);
          const draft = tables.section_drafts.find(
            (d) => d.section_id === payload.target_section,
          );
          if (target && draft)
            Object.assign(target, {
              title: draft.title,
              content: draft.content,
              is_published: true,
              section_type: payload.new_type,
              sort_order: payload.new_order,
            });
        }
        if (name === "save_story_reading") {
          let row = tables.reading_progress.find(
            (r) =>
              r.user_id === ids.user && r.chapter_id === payload.target_chapter,
          );
          if (!row) {
            row = {
              user_id: ids.user,
              chapter_id: payload.target_chapter,
              paragraph_index: 0,
              chapters: chapters.find((c) => c.id === payload.target_chapter),
            };
            tables.reading_progress.push(row);
          }
          Object.assign(row, {
            section_id: payload.target_section,
            progress_percent: payload.percent_read,
            is_completed: row.is_completed || payload.finished,
            last_read_at: new Date().toISOString(),
          });
        }
        return fulfill(null);
      }
      if (url.pathname.includes("/storage/v1/object/")) {
        if (req.method() === "POST")
          return fulfill({ Key: url.pathname.split("/story-art/")[1] });
        if (failArt) return fulfill({ message: "Fixture art failure" }, 500);
        const filename = url.pathname.includes("/covers/")
          ? "genshin-cover.webp"
          : url.pathname.split("/").at(-1);
        const dir = process.env.STORY_TEST_ART_DIR;
        if (!dir)
          throw Error(
            "Set STORY_TEST_ART_DIR to the local directory containing the user-provided artwork.",
          );
        return route.fulfill({
          status: 200,
          contentType: "image/webp",
          body: await fs.readFile(`${dir}/${filename}`),
        });
      }
      const table = url.pathname.split("/").at(-1);
      if (!Object.hasOwn(tables, table))
        return fulfill({ message: "Unknown test table" }, 400);
      if (req.method() !== "GET") {
        const payload = req.method() === "DELETE" ? null : req.postDataJSON();
        writes.push({ table, payload });
        let saved;
        if (req.method() === "POST") {
          saved = { id: "fixture-created", ...payload };
          if (table === "section_drafts")
            tables[table] = tables[table].filter(
              (r) => r.section_id !== payload.section_id,
            );
          tables[table].push(saved);
        } else {
          const matches = (row) =>
            [...url.searchParams]
              .filter(([, v]) => v.startsWith("eq."))
              .every(([key, v]) => String(row[key]) === v.slice(3));
          if (req.method() === "DELETE")
            tables[table] = tables[table].filter((r) => !matches(r));
          else
            for (const row of tables[table])
              if (matches(row)) {
                Object.assign(row, payload);
                saved = row;
              }
        }
        return fulfill(
          req.headers().accept?.includes("object+json") ? saved : null,
        );
      }
      let rows = tables[table];
      for (const [key, value] of url.searchParams)
        if (value.startsWith("eq."))
          rows = rows.filter((r) => String(r[key]) === value.slice(3));
      return fulfill(
        req.headers().accept?.includes("object+json") ? rows[0] || null : rows,
      );
    },
  );
  return { requests, writes, tables };
}
export async function signIn(page) {
  await page.goto("/");
  await page
    .getByLabel("邮箱", { exact: true })
    .fill("fixture@example.invalid");
  await page.getByLabel("密码", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "打开藏书馆" }).click();
  await page.locator("#shell[data-view=home] .art-book").waitFor();
}
