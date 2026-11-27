import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  stdio: "ignore",
  windowsHide: true,
});
try {
  for (let n = 0; n < 40; n++) {
    try {
      if ((await fetch("http://127.0.0.1:4173")).ok) break;
    } catch {}
    await delay(100);
  }
  const child = spawn(
    process.execPath,
    ["node_modules/playwright/cli.js", "test", ...process.argv.slice(2)],
    {
      env: { ...process.env, STORY_TEST_SERVER_EXTERNAL: "1" },
      stdio: "inherit",
      windowsHide: true,
    },
  );
  process.exitCode = await new Promise((resolve, reject) => {
    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", reject);
  });
} finally {
  server.kill();
}
