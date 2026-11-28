import { test, expect as baseExpect } from "@playwright/test";
import { fixture, signIn, ids } from "./fixtures.js";
import fs from "node:fs/promises";
test.use({ browserName: process.env.STORY_TEST_BROWSER || "chromium" });
// Windows WebKit's request interception is slower than Chromium's.
const expect = baseExpect.configure({
  timeout: process.env.STORY_TEST_BROWSER === "webkit" ? 20000 : 5000,
});
test.setTimeout(process.env.STORY_TEST_BROWSER === "webkit" ? 90000 : 60000);

const opening = {
  part: "66666666-6666-4666-8666-666666666666",
  chapter: "77777777-7777-4777-8777-777777777777",
  section: "88888888-8888-4888-8888-888888888888",
};
function addOpening(f, { published = true } = {}) {
  const part = {
    id: opening.part,
    work_id: ids.work,
    title: "楔子",
    entry_type: "prologue",
    sort_order: 99,
    is_published: published,
  };
  f.tables.volumes.push(part);
  const chapter = {
    id: opening.chapter,
    volume_id: part.id,
    title: "楔子　合成开篇",
    sort_order: 0,
    status: published ? "published" : "draft",
    volumes: { ...part, works: f.tables.works[0] },
  };
  f.tables.chapters.push(chapter);
  f.tables.sections.push({
    id: opening.section,
    chapter_id: chapter.id,
    title: chapter.title,
    content: "合成第一场景。\n\n---\n\n合成第二场景。",
    is_published: published,
    sort_order: 0,
  });
  return chapter;
}

test("prologue is a standalone entry before volume one with working next/previous navigation", async ({
  page,
}) => {
  const f = await fixture(page, { role: "reader" });
  addOpening(f);
  await signIn(page);
  await page.locator(".art-book").click();
  await expect(page.locator(".prologue-entry")).toHaveCount(1);
  expect(
    await page
      .locator(".prologue-entry")
      .evaluate(
        (el) =>
          !!(
            el.compareDocumentPosition(
              document.querySelector("details.volume"),
            ) & Node.DOCUMENT_POSITION_FOLLOWING
          ),
      ),
  ).toBe(true);
  expect(
    await page
      .locator(".prologue-entry")
      .evaluate((el) => el.closest("details.volume") === null),
  ).toBe(true);
  await page.locator(".prologue-entry button").click();
  await expect(page.locator(".reader-content h1")).toHaveText("楔子　合成开篇");
  await expect(page.locator(".reader-content h2")).toHaveCount(0);
  await expect(page.locator(".scene-break")).toHaveCount(1);
  await expect(page.locator(".scene-break")).toHaveAttribute(
    "aria-label",
    "情节分隔",
  );
  await expect(page.locator(".reader-toolbar")).not.toContainText("第一卷");
  await page.getByRole("button", { name: "下一章", exact: true }).click();
  await expect(page.locator(".reader-content h1")).toHaveText(
    "测试章节 · 风的来处",
  );
  await page.getByRole("button", { name: "上一章", exact: true }).click();
  await expect(page.locator(".reader-content h1")).toHaveText("楔子　合成开篇");
});

test("admin creates one draft prologue and saves subtitles and scene separators without publishing", async ({
  page,
}) => {
  const f = await fixture(page);
  await signIn(page);
  await page.evaluate((id) => (location.hash = `#/studio/${id}`), ids.work);
  await page.getByRole("button", { name: "添加楔子", exact: true }).click();
  await page.locator("#prologue-form input").fill("楔子　合成开篇");
  await page.getByRole("button", { name: "创建楔子草稿", exact: true }).click();
  await expect(page.locator("#draft-title")).toHaveValue("楔子　合成开篇");
  await page.locator("#draft-subtitle").fill("—— 合成原作任务");
  await page
    .locator("#draft-content")
    .fill("合成前一场景。\n\n---\n\n合成后一场景。");
  await page.locator("#save-draft").click();
  await expect(page.locator("#save-status")).toContainText("已保存");
  const draft = f.writes
    .filter((w) => w.table === "section_drafts")
    .at(-1).payload;
  expect(draft.subtitle).toBe("—— 合成原作任务");
  expect(draft.content).toContain("\n\n---\n\n");
  expect(
    f.tables.volumes.find((v) => v.entry_type === "prologue").is_published,
  ).toBe(false);
  expect(f.writes.some((w) => w.table === "publish_story_section")).toBe(false);
  await page.locator("#preview-draft").click();
  await expect(page.locator("dialog .scene-break")).toBeVisible();
  await expect(page.locator("dialog .section-subtitle")).toHaveText(
    "—— 合成原作任务",
  );
  await expect(page.locator("dialog h2")).toHaveCount(1);
  await page.locator("#dialog-close").click();
  await page.getByRole("button", { name: "编辑楔子", exact: true }).click();
  expect(
    f.writes.filter((w) => w.table === "create_story_prologue"),
  ).toHaveLength(1);
  await page.getByRole("button", { name: "新增章节", exact: true }).click();
  await expect(page.locator("#new-part-form select option")).toHaveCount(1);
  await expect(page.locator("#new-part-form select")).toHaveValue(ids.volume);
});

test("chapter subheadings link to the selected section and omit absent subtitles", async ({
  page,
}) => {
  const f = await fixture(page, { role: "reader" });
  f.tables.sections[0].title = "风起";
  f.tables.sections[0].subtitle = "—— 合成任务甲 · 合成任务乙";
  f.tables.sections.push({
    id: opening.section,
    chapter_id: ids.chapter,
    title: "自由之都",
    subtitle: null,
    content: Array(30)
      .fill("这是合成的后续场景，用于验证目录定位及移动端阅读排版。")
      .join("\n\n"),
    is_published: true,
    sort_order: 20,
  });
  await signIn(page);
  await page.locator(".art-book").click();
  await page.getByRole("button", { name: "自由之都", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(opening.section));
  await expect(page.locator(".section-heading h2")).toHaveText([
    "风起",
    "自由之都",
  ]);
  await expect(page.locator(".section-subtitle")).toHaveCount(1);
  await expect(page.locator(".section-subtitle")).toHaveText(
    "—— 合成任务甲 · 合成任务乙",
  );
  expect(
    await page
      .locator(".section-heading h2")
      .first()
      .evaluate((el) => getComputedStyle(el).textAlign),
  ).toBe("center");
  await expect
    .poll(async () =>
      Math.abs(
        (await page
          .locator(`[data-section="${opening.section}"]`)
          .evaluate((el) => el.getBoundingClientRect().top)) -
          (await page
            .locator(".reader-toolbar")
            .evaluate((el) => el.getBoundingClientRect().height)) -
          24,
      ),
    )
    .toBeLessThan(5);
});

for (const [width, height] of [
  [820, 1180],
  [390, 844],
])
  test(`prologue and subtitle layout at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const f = await fixture(page, { role: "reader" });
    addOpening(f);
    f.tables.sections[0].title = "风起";
    f.tables.sections[0].subtitle =
      "—— 合成原作任务甲 · 合成原作任务乙 · 合成原作任务丙";
    await signIn(page);
    await page.locator(".art-book").click();
    await expect(page.locator(".prologue-entry")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "风起", exact: true }).click();
    await expect(page.locator(".section-subtitle")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const dir = new URL("../../../screenshots/", import.meta.url);
    await fs.mkdir(dir, { recursive: true });
    await page.screenshot({
      path: new URL(
        `section-subtitle-${width}x${height}.png`,
        dir,
      ).pathname.replace(/^\/(\w:)/, "$1"),
    });
  });

test("reader preview excludes the unpublished prologue and never writes it", async ({
  page,
}) => {
  const f = await fixture(page);
  addOpening(f, { published: false });
  await signIn(page);
  await page.getByLabel("个人菜单").click();
  await page.getByRole("button", { name: "读者视角预览", exact: true }).click();
  await page.locator(".art-book").click();
  await expect(page.locator(".prologue-entry")).toHaveCount(0);
  await expect(page.locator("details.volume")).toHaveCount(1);
  expect(f.writes).toHaveLength(0);
});

test("clearing a published subtitle survives reload and publishes without restoring the old value", async ({
  page,
}) => {
  const f = await fixture(page);
  f.tables.sections[0].subtitle = "—— 原有副标题";
  await signIn(page);
  await page.evaluate((id) => (location.hash = `#/studio/${id}`), ids.work);
  await expect(page.locator("#draft-subtitle")).toHaveValue("—— 原有副标题");
  await page.locator("#draft-subtitle").fill("");
  await page.locator("#save-draft").click();
  await expect(page.locator("#save-status")).toContainText("已保存");
  await page.reload();
  await expect(page.locator("#draft-subtitle")).toHaveValue("");
  page.once("dialog", (d) => d.accept());
  await page.locator("#publish-section").click();
  await expect(page.locator("#toast")).toContainText("当前小节已发布");
  expect(f.tables.sections[0].subtitle).toBeNull();
  expect(f.tables.revisions.at(-1).subtitle).toBe("—— 原有副标题");
  await page.evaluate((id) => (location.hash = `#/reader/${id}`), ids.chapter);
  await expect(page.locator(".reader-content")).toBeVisible();
  await expect(page.locator(".section-subtitle")).toHaveCount(0);
});

test("completed prologue resumes at the first chapter and partial prologue resumes in place", async ({
  page,
}) => {
  const f = await fixture(page, { role: "reader" });
  const chapter = addOpening(f);
  f.tables.reading_progress.push({
    user_id: ids.user,
    chapter_id: chapter.id,
    section_id: opening.section,
    paragraph_index: 1,
    progress_percent: 100,
    is_completed: true,
    chapters: chapter,
  });
  await signIn(page);
  await expect(page.locator(".resume-reading")).toHaveAttribute(
    "data-route",
    "reader/" + ids.chapter,
  );
  f.tables.reading_progress[0].progress_percent = 40;
  await page.reload();
  await expect(page.locator(".resume-reading")).toHaveAttribute(
    "data-route",
    "reader/" + opening.chapter,
  );
});
