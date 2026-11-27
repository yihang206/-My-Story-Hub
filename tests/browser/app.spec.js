import { test, expect } from "@playwright/test";
import { fixture, signIn, ids } from "./fixtures.js";
import fs from "node:fs/promises";
const screenshots = new URL("../../../screenshots/", import.meta.url);

test("admin can preview reader pages without creating a user or writing any records", async ({
  page,
}) => {
  const f = await fixture(page);
  await signIn(page);
  await page.getByLabel("个人菜单").click();
  await page.getByRole("button", { name: "读者视角预览", exact: true }).click();
  await expect(page.locator("#reader-preview-banner")).toBeVisible();
  await expect(page.locator(".art-add")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "阅读记录", exact: true }),
  ).toBeVisible();
  await page.locator(".art-book").click();
  await page
    .getByRole("button", { name: "测试章节 · 风的来处", exact: true })
    .click();
  await expect(page.locator("#mark-finished")).toBeDisabled();
  await page.getByText("个人阅读笔记", { exact: true }).click();
  await expect(page.locator("#note-form button[type=submit]")).toBeDisabled();
  await page.getByRole("button", { name: "阅读设置", exact: true }).click();
  await expect(
    page.locator("#reader-pref-form button[type=submit]"),
  ).toBeDisabled();
  await page.locator("#dialog-close").click();
  await page.evaluate(() => (location.hash = "#/settings"));
  await expect(page.locator("#profile-form button")).toBeDisabled();
  expect(f.writes).toHaveLength(0);
  await page.getByRole("button", { name: "退出预览", exact: true }).click();
  await expect(page.locator("#reader-preview-banner")).toBeHidden();
  await expect(page.locator(".art-add")).toBeVisible();
  expect(f.writes).toHaveLength(0);
});
test("reader preview filters drafts and blocks creative routes while preserving the art shell", async ({
  page,
}) => {
  const f = await fixture(page);
  f.tables.works.push({
    id: "unpublished",
    title: "不可显示的草稿作品",
    is_published: false,
  });
  await signIn(page);
  await page.evaluate(
    () => (window.previewShell = document.querySelector("#shell")),
  );
  await page.getByLabel("个人菜单").click();
  await page.getByRole("button", { name: "读者视角预览", exact: true }).click();
  await expect(page.locator("#reader-preview-banner")).toBeVisible();
  await page.getByRole("button", { name: "作品", exact: true }).click();
  await expect(page.locator("#shell")).toHaveAttribute("data-view", "library");
  await expect(page.locator("#page")).not.toContainText("不可显示的草稿作品");
  await page.evaluate(() => (location.hash = "#/studio"));
  await expect(page.locator("#route-status")).toContainText("仅创作者");
  expect(
    await page.evaluate(
      () => window.previewShell === document.querySelector("#shell"),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "退出预览", exact: true }).click();
  await expect(page.locator(".art-add")).toBeVisible();
});

test("new works and hierarchy forms use the audited parent columns", async ({
  page,
}) => {
  const f = await fixture(page);
  await signIn(page);
  await page.locator(".art-add").click();
  await page.locator("#work-form input[name=title]").fill("合成新作品");
  await page.locator("#work-form button[type=submit]").click();
  await expect(page.locator("#shell")).toHaveAttribute("data-view", "library");
  expect(f.writes.find((w) => w.table === "works").payload.is_published).toBe(
    false,
  );
  await page.evaluate((id) => (location.hash = `#/studio/${id}`), ids.work);
  await page.getByRole("button", { name: "新增分卷", exact: true }).click();
  await page.locator("#new-part-form input[name=title]").fill("合成新分卷");
  await page.locator("#new-part-form button[type=submit]").click();
  await expect(page.locator("dialog")).not.toBeVisible();
  expect(f.writes.find((w) => w.table === "volumes").payload.work_id).toBe(
    ids.work,
  );
  await page.getByRole("button", { name: "新增章节", exact: true }).click();
  await page.locator("#new-part-form input[name=title]").fill("合成新章节");
  await page.locator("#new-part-form button[type=submit]").click();
  await expect(page.locator("dialog")).not.toBeVisible();
  expect(f.writes.find((w) => w.table === "chapters").payload.volume_id).toBe(
    ids.volume,
  );
  await page.getByRole("button", { name: "新增小节", exact: true }).click();
  await page.locator("#new-part-form input[name=title]").fill("合成新小节");
  await page.locator("#new-part-form button[type=submit]").click();
  await expect(page.locator("dialog")).not.toBeVisible();
  expect(f.writes.find((w) => w.table === "sections").payload.chapter_id).toBe(
    ids.chapter,
  );
});
test("cover uploads remain private and write the real cover_url column", async ({
  page,
}) => {
  const f = await fixture(page);
  await signIn(page);
  await page.evaluate((id) => (location.hash = `#/studio/${id}`), ids.work);
  await page.getByRole("button", { name: "上传封面", exact: true }).click();
  await page
    .locator("#cover-form input[type=file]")
    .setInputFiles(`${process.env.STORY_TEST_ART_DIR}/genshin-cover.webp`);
  await page.getByRole("button", { name: "上传并保存", exact: true }).click();
  await expect(page.locator("#toast")).toContainText("封面已保存");
  expect(f.writes.find((w) => w.table === "works").payload.cover_url).toMatch(
    /^covers\//,
  );
  expect(
    f.requests.filter(
      (r) =>
        r.method === "POST" &&
        r.path.includes("/storage/v1/object/story-art/covers/"),
    ),
  ).toHaveLength(1);
});

test("all secondary pages render in the shared literary shell", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await fixture(page);
  await signIn(page);
  await fs.mkdir(screenshots, { recursive: true });
  for (const route of [
    `directory/${ids.work}`,
    `studio/${ids.work}`,
    "history",
    "insights",
    "settings",
  ]) {
    await page.evaluate((route) => (location.hash = `#/${route}`), route);
    await expect(page.locator("#shell")).toHaveAttribute(
      "data-view",
      route.split("/")[0],
    );
    await expect(page.locator(".art-brand")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: new URL(
        `${route.split("/")[0]}-1440x900.png`,
        screenshots,
      ).pathname.replace(/^\/(\w:)/, "$1"),
      fullPage: true,
    });
  }
});

test("personal notes default to private and can be explicitly shared and deleted", async ({
  page,
}) => {
  const f = await fixture(page, { role: "reader" });
  await signIn(page);
  await page.evaluate((id) => (location.hash = `#/reader/${id}`), ids.chapter);
  await page.getByText("个人阅读笔记", { exact: true }).click();
  await page.getByLabel("笔记内容", { exact: true }).fill("我的合成私人笔记");
  await page.getByRole("button", { name: "保存笔记", exact: true }).click();
  await expect(page.locator("#notes-list")).toContainText("仅自己可见");
  expect(
    f.writes.find((w) => w.table === "reader_notes").payload.share_with_author,
  ).toBe(false);
  await page.getByRole("button", { name: "分享给作者", exact: true }).click();
  await expect(page.locator("#notes-list")).toContainText("已分享给作者");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "删除笔记", exact: true }).click();
  await expect(page.locator("#notes-list")).not.toContainText(
    "我的合成私人笔记",
  );
});
test("verified reading synchronization reports completion once and changes stop on leave", async ({
  page,
}) => {
  const f = await fixture(page);
  await signIn(page);
  await page.evaluate((id) => (location.hash = `#/reader/${id}`), ids.chapter);
  await page.getByRole("button", { name: "标记读完", exact: true }).click();
  await expect(page.locator("#sync-status")).toHaveText("阅读记录已同步");
  expect(f.writes.filter((w) => w.table === "save_story_reading")).toHaveLength(
    1,
  );
  expect(
    f.writes.find((w) => w.table === "save_story_reading").payload.finished,
  ).toBe(true);
  await page
    .locator(".reader-toolbar")
    .getByRole("button", { name: "返回目录", exact: true })
    .click();
  await expect(page.locator(".work-intro")).toBeVisible();
  const count = f.writes.filter((w) => w.table === "save_story_reading").length;
  await page.waitForTimeout(1200);
  expect(f.writes.filter((w) => w.table === "save_story_reading")).toHaveLength(
    count,
  );
});
test("name changes use the narrow RPC instead of profile field writes", async ({
  page,
}) => {
  const f = await fixture(page, { role: "reader" });
  await signIn(page);
  await page.evaluate(() => (location.hash = "#/settings"));
  await page.getByLabel("显示名称", { exact: true }).fill("新的测试名称");
  await page.getByRole("button", { name: "保存名称", exact: true }).click();
  await expect(page.locator("#toast")).toContainText("名称已更新");
  expect(
    f.writes.find((w) => w.table === "update_story_display_name").payload,
  ).toEqual({ new_name: "新的测试名称" });
  expect(f.writes.filter((w) => w.table === "profiles")).toHaveLength(0);
});

test("slow outdated navigation cannot replace a newer page", async ({
  page,
}) => {
  await fixture(page);
  await signIn(page);
  await page.route("**/rest/v1/works?**", async (route) => {
    await new Promise((r) => setTimeout(r, 700));
    await route.fallback();
  });
  await page.evaluate(() => (location.hash = "#/library"));
  await page.waitForTimeout(100);
  await page.evaluate(() => (location.hash = "#/settings"));
  await expect(page.locator("#shell")).toHaveAttribute("data-view", "settings");
  await page.waitForTimeout(850);
  await expect(page.locator("#shell")).toHaveAttribute("data-view", "settings");
});
test("data failure keeps the shell and allows retry without redownloading art", async ({
  page,
}) => {
  const f = await fixture(page);
  await signIn(page);
  const fail = (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Fixture temporary failure" }),
    });
  await page.route("**/rest/v1/works?**", fail);
  await page.getByRole("button", { name: "作品", exact: true }).click();
  await expect(page.locator("#route-status")).toContainText(
    "Fixture temporary failure",
  );
  await expect(page.locator(".art-brand")).toBeVisible();
  await page.unroute("**/rest/v1/works?**", fail);
  await page.getByRole("button", { name: "重试", exact: true }).click();
  await expect(page.locator("#shell")).toHaveAttribute("data-view", "library");
  expect(
    f.requests.filter((r) => r.path.endsWith("story-frame.webp")),
  ).toHaveLength(1);
});
test("a failed draft save blocks navigation and keeps the typed text", async ({
  page,
}) => {
  await fixture(page);
  await signIn(page);
  await page.evaluate((id) => (location.hash = `#/studio/${id}`), ids.work);
  await page.locator("#draft-content").waitFor();
  await page.route("**/rest/v1/section_drafts?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Fixture offline" }),
    }),
  );
  await page.locator("#draft-content").fill("不能丢失的草稿");
  await page.getByRole("button", { name: "作品", exact: true }).click();
  await expect(page.locator("#save-status")).toContainText("保存失败");
  await expect(page.locator("#draft-content")).toHaveValue("不能丢失的草稿");
  await expect(page).toHaveURL(/studio/);
});
test("reader preference changes persist and apply to immersive text", async ({
  page,
}) => {
  const f = await fixture(page);
  await signIn(page);
  await page.evaluate((id) => (location.hash = `#/reader/${id}`), ids.chapter);
  await page.getByRole("button", { name: "阅读设置", exact: true }).click();
  await page.getByLabel("字号", { exact: true }).fill("24");
  await page.getByLabel("阅读主题", { exact: true }).selectOption("dark");
  await page.locator("#reader-pref-form button[type=submit]").click();
  await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
  expect(
    f.writes.find((w) => w.table === "reader_preferences").payload.user_id,
  ).toBe(ids.user);
  expect(
    await page
      .locator(".reader-content")
      .evaluate((el) => getComputedStyle(el).fontSize),
  ).toBe("24px");
});
test("reader data reads enforce published filters and personal user scope", async ({
  page,
}) => {
  const f = await fixture(page, { role: "reader" });
  await signIn(page);
  await page.locator(".art-book").click();
  await expect(page.locator(".work-intro")).toBeVisible();
  const urls = [];
  page.on("request", (r) => urls.push(r.url()));
  await page.evaluate(() => (location.hash = "#/history"));
  await expect(page.locator(".paper-page")).toContainText("我的阅读记录");
  expect(
    urls
      .filter(
        (url) =>
          url.includes("/reading_progress?") || url.includes("/reading_stats?"),
      )
      .every(
        (url) => new URL(url).searchParams.get("user_id") === `eq.${ids.user}`,
      ),
  ).toBe(true);
});
test("login has no private requests, rejects a wrong password, restores session, and clears logout", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.goto("/");
  expect(f.requests.filter((r) => /storage|rest/.test(r.path))).toHaveLength(0);
  await page
    .getByLabel("邮箱", { exact: true })
    .fill("fixture@example.invalid");
  await page.getByLabel("密码", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "打开藏书馆" }).click();
  await expect(page.locator("#login-message")).toContainText("登录失败");
  await signIn(page);
  await page.reload();
  await expect(page.locator(".art-book")).toBeVisible();
  await page.getByLabel("个人菜单").click();
  await page.getByRole("button", { name: "退出登录", exact: true }).click();
  await expect(page.locator("#login-form")).toBeVisible();
  await expect(page.locator("#shell")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.querySelectorAll('[src^="blob:"]').length,
    ),
  ).toBe(0);
});
test("inactive account cannot load artwork or data", async ({ page }) => {
  const f = await fixture(page, { active: false });
  await page.goto("/");
  await page
    .getByLabel("邮箱", { exact: true })
    .fill("fixture@example.invalid");
  await page.getByLabel("密码", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "打开藏书馆" }).click();
  await expect(page.locator("#login-message")).toContainText("访问权限");
  expect(f.requests.filter((r) => /storage/.test(r.path))).toHaveLength(0);
});
test("artwork failure stays on login and offers an actionable error", async ({
  page,
}) => {
  await fixture(page, { failArt: true });
  await page.goto("/");
  await page
    .getByLabel("邮箱", { exact: true })
    .fill("fixture@example.invalid");
  await page.getByLabel("密码", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "打开藏书馆" }).click();
  await expect(page.locator("#login-message")).toContainText("无法打开藏书馆");
  await expect(page.locator("#shell")).toHaveCount(0);
});
test("rapid switching preserves shell identity and downloads assets only once", async ({
  page,
}) => {
  const f = await fixture(page);
  await signIn(page);
  await page.evaluate(
    () => (window.testShell = document.querySelector("#shell")),
  );
  for (let i = 0; i < 8; i++)
    await page.evaluate((i) => {
      location.hash = i % 2 ? "#/home" : "#/library";
    }, i);
  await page.evaluate(() => (location.hash = "#/library"));
  await expect(page.locator("#shell")).toHaveAttribute("data-view", "library");
  expect(
    await page.evaluate(
      () => window.testShell === document.querySelector("#shell"),
    ),
  ).toBe(true);
  expect(
    f.requests.filter((r) => r.path.endsWith("/story-frame.webp")),
  ).toHaveLength(1);
  expect(
    f.requests.filter((r) => r.path.endsWith("/genshin-cover.webp")),
  ).toHaveLength(1);
  await page.reload();
  await expect(page.locator("#shell")).toHaveAttribute("data-view", "library");
});
test("reader routes deny studio and hide all admin operations", async ({
  page,
}) => {
  await fixture(page, { role: "reader" });
  await signIn(page);
  await expect(page.locator(".art-add")).toHaveCount(0);
  await page.evaluate(() => (location.hash = "#/studio"));
  await expect(page.locator("#route-status")).toContainText("仅创作者");
  await expect(page.locator("#draft-content")).toHaveCount(0);
});
test("draft saves are separate, preview and revisions work, verified publication cascades", async ({
  page,
}) => {
  const f = await fixture(page);
  await signIn(page);
  await page.evaluate((id) => (location.hash = `#/studio/${id}`), ids.work);
  await page.locator("#draft-content").waitFor();
  await page.locator("#draft-content").fill("合成草稿验收内容");
  await page.locator("#save-draft").click();
  await expect(page.locator("#save-status")).toContainText("已保存");
  expect(
    f.writes.filter((w) => w.table === "section_drafts").at(-1).payload.content,
  ).toBe("合成草稿验收内容");
  expect(f.writes.filter((w) => w.table === "sections")).toHaveLength(0);
  await expect(page.locator("#publish-section")).toBeEnabled();
  await page.locator("#preview-draft").click();
  await expect(page.locator("dialog")).toContainText("合成草稿验收内容");
  await page.locator("#dialog-close").click();
  await page.locator("#revisions").click();
  await expect(page.locator("dialog")).toContainText("暂无历史版本");
  await page.locator("#dialog-close").click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#publish-section").click();
  await expect(page.locator("#toast")).toContainText("当前小节已发布");
  expect(
    f.writes.filter((w) => w.table === "publish_story_section"),
  ).toHaveLength(1);
  for (const table of ["chapters", "volumes", "works"])
    expect(f.writes.some((w) => w.table === table)).toBe(true);
});
for (const [width, height] of [
  [1920, 1080],
  [1536, 1024],
  [1440, 900],
  [1366, 768],
  [1180, 820],
  [820, 1180],
  [390, 844],
])
  test(`responsive browser rendering ${width}x${height}`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height });
    await fixture(page);
    await signIn(page);
    await fs.mkdir(screenshots, { recursive: true });
    await page.screenshot({
      path: new URL(
        `home-${width}x${height}.png`,
        screenshots,
      ).pathname.replace(/^\/(\w:)/, "$1"),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "作品", exact: true }).click();
    await expect(page.locator("#shell")).toHaveAttribute(
      "data-view",
      "library",
    );
    await page.screenshot({
      path: new URL(
        `library-${width}x${height}.png`,
        screenshots,
      ).pathname.replace(/^\/(\w:)/, "$1"),
      fullPage: true,
    });
    await page.locator(".art-book").click();
    await expect(page.locator(".work-intro")).toBeVisible();
    await page
      .getByRole("button", { name: "测试章节 · 风的来处", exact: true })
      .click();
    await expect(page.locator(".reader-content h1")).toHaveText(
      "测试章节 · 风的来处",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: new URL(
        `reader-${width}x${height}.png`,
        screenshots,
      ).pathname.replace(/^\/(\w:)/, "$1"),
      fullPage: false,
    });
    expect(errors).toEqual([]);
  });
