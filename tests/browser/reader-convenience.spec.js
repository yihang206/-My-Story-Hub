import { test, expect } from "@playwright/test";
import { fixture, signIn, ids } from "./fixtures.js";
test.setTimeout(60000);
const authKey = "sb-wkwwudednbgywllndjtc-auth-token";
async function login(page, { remember = false, auto = false } = {}) {
  await page.goto("/");
  await page
    .getByLabel("邮箱", { exact: true })
    .fill("fixture@example.invalid");
  await page.getByLabel("密码", { exact: true }).fill("fixture-password");
  await page.getByLabel("记住账号", { exact: true }).setChecked(remember);
  await page.getByLabel("自动登录", { exact: true }).setChecked(auto);
  await page.getByRole("button", { name: "打开藏书馆" }).click();
  await page.locator(".art-book").waitFor();
}
function progress(f, patch = {}) {
  f.tables.reading_progress.push({
    user_id: ids.user,
    chapter_id: ids.chapter,
    section_id: ids.section,
    paragraph_index: 19,
    progress_percent: 48,
    is_completed: false,
    last_read_at: "2026-11-28T00:00:00Z",
    chapters: f.tables.chapters[0],
    ...patch,
  });
}
test("remember account fills email without persisting password or automatic login", async ({
  page,
  context,
}) => {
  await fixture(page, { role: "reader" });
  await login(page, { remember: true });
  expect(
    await page.evaluate((k) => localStorage.getItem(k), authKey),
  ).toBeNull();
  const next = await context.newPage();
  await fixture(next, { role: "reader" });
  await next.goto("/");
  await expect(next.locator("#login-form")).toBeVisible({ timeout: 15000 });
  await expect(next.getByLabel("邮箱", { exact: true })).toHaveValue(
    "fixture@example.invalid",
  );
  await expect(next.getByLabel("密码", { exact: true })).toHaveValue("");
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain("fixture-password");
});
test("automatic login restores a session in a fresh tab and explicit logout clears it", async ({
  page,
  context,
}) => {
  await fixture(page, { role: "reader" });
  await login(page, { remember: true, auto: true });
  expect(
    await page.evaluate((k) => localStorage.getItem(k), authKey),
  ).toBeTruthy();
  const next = await context.newPage();
  await fixture(next, { role: "reader" });
  await next.goto("/");
  await expect(next.locator(".art-book")).toBeVisible();
  await expect(next.locator("#login-form")).toHaveCount(0);
  await next.getByLabel("个人菜单").click();
  await next.getByRole("button", { name: "退出登录", exact: true }).click();
  await expect(next.locator("#login-form")).toBeVisible({ timeout: 15000 });
  expect(
    await next.evaluate((k) => localStorage.getItem(k), authKey),
  ).toBeNull();
  await next.reload();
  await expect(next.locator("#login-form")).toBeVisible({ timeout: 15000 });
});
test("home resumes the saved chapter and paragraph after layout/font changes", async ({
  page,
}) => {
  const f = await fixture(page, { role: "reader" });
  progress(f);
  f.tables.reader_preferences.push({
    user_id: ids.user,
    font_size: 24,
    reading_width: 640,
    line_height: 2.1,
    theme: "paper",
  });
  await login(page, { auto: true });
  await expect(page.locator(".resume-reading")).toContainText("继续阅读");
  await expect(page.locator(".resume-reading")).toContainText("48%");
  await page.locator(".resume-reading").click();
  const p = page.locator('[data-section] [data-paragraph="19"]');
  await expect(p).toBeVisible();
  await expect
    .poll(async () =>
      Math.abs(
        (await p.evaluate((el) => el.getBoundingClientRect().top)) -
          ((await page
            .locator(".reader-toolbar")
            .evaluate((el) => el.getBoundingClientRect().height)) +
            24),
      ),
    )
    .toBeLessThan(10);
  await page
    .locator('[data-paragraph="29"]')
    .evaluate((el) => el.scrollIntoView());
  await expect
    .poll(() => f.writes.filter((w) => w.table === "reading_progress").length)
    .toBeGreaterThan(0);
  expect(
    f.writes.filter((w) => w.table === "reading_progress").at(-1).payload
      .paragraph_index,
  ).toBeGreaterThan(19);
});
test("completed chapter resumes at the next published chapter; inaccessible history is omitted", async ({
  page,
}) => {
  const f = await fixture(page, { role: "reader" });
  progress(f, { is_completed: true, progress_percent: 100 });
  const next = "66666666-6666-4666-8666-666666666666";
  f.tables.chapters.push({
    ...f.tables.chapters[0],
    id: next,
    title: "下一章",
    sort_order: 20,
  });
  await signIn(page);
  await expect(page.locator(".resume-reading")).toHaveAttribute(
    "data-route",
    "reader/" + next,
  );
  await expect(page.locator(".resume-reading")).toContainText("下一章");
  f.tables.reading_progress[0].progress_percent = 32;
  await page.reload();
  await expect(page.locator(".resume-reading")).toHaveAttribute(
    "data-route",
    "reader/" + ids.chapter,
  );
  await expect(page.locator(".resume-reading")).toContainText("32%");
  f.tables.reading_progress[0].chapters = null;
  await page.reload();
  await expect(page.locator(".art-book")).toBeVisible();
  await expect(page.locator(".resume-reading")).toHaveCount(0);
});
test("failed progress query keeps the homepage available with a retry entry", async ({
  page,
}) => {
  await fixture(page, { role: "reader" });
  await page.route("**/rest/v1/reading_progress?**", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "offline" }),
    }),
  );
  await signIn(page);
  await expect(page.locator(".art-book")).toBeVisible();
  await expect(page.locator(".resume-error")).toContainText(
    "阅读位置暂时无法加载",
  );
});
test("reader verifies current password and changes the initial password, then signs in again", async ({
  page,
}) => {
  const f = await fixture(page, { role: "reader" });
  await login(page, { remember: true, auto: true });
  await page.evaluate(() => (location.hash = "#/settings"));
  await page.getByLabel("当前密码", { exact: true }).fill("incorrect");
  await page
    .getByLabel("新密码", { exact: true })
    .fill("new-test-password-2026");
  await page
    .getByLabel("确认新密码", { exact: true })
    .fill("new-test-password-2026");
  await page.getByRole("button", { name: "修改密码", exact: true }).click();
  await expect(page.locator("#password-message")).toContainText("Invalid");
  expect(
    f.requests.filter(
      (r) => r.method === "PUT" && r.path.endsWith("/auth/v1/user"),
    ),
  ).toHaveLength(0);
  await page.getByLabel("当前密码", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "修改密码", exact: true }).click();
  await expect(page.locator("#login-message")).toContainText("密码已修改");
  expect(
    f.requests.filter(
      (r) => r.method === "PUT" && r.path.endsWith("/auth/v1/user"),
    ),
  ).toHaveLength(1);
  expect(
    await page.evaluate((k) => localStorage.getItem(k), authKey),
  ).toBeNull();
  await expect(page.getByLabel("密码", { exact: true })).toHaveValue("");
});
for (const [width, height] of [
  [1440, 900],
  [1180, 820],
  [820, 1180],
  [390, 844],
])
  test(`resume entry remains readable at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const f = await fixture(page, { role: "reader" });
    progress(f);
    await signIn(page);
    const resume = page.locator(".resume-reading");
    await expect(resume).toBeVisible();
    const box = await resume.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `../screenshots/resume-${width}x${height}.png`,
      fullPage: true,
    });
  });
