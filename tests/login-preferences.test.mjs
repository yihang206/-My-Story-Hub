import test from "node:test";
import assert from "node:assert/strict";
import { createLoginPreferences } from "../src/core/login-preferences.js";
const store = () => {
  const values = new Map();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
    values,
  };
};
test("another tab clearing persistent storage cannot resurrect an old cached token", () => {
  const local = store();
  const p = createLoginPreferences({ key: "auth", local, tab: store() });
  p.save({ autoLogin: true });
  p.storage.setItem("auth", "old-session");
  local.removeItem("auth");
  assert.equal(p.storage.getItem("auth"), null);
});
test("remembering an account does not persist a session or password", () => {
  const local = store(),
    tab = store();
  const p = createLoginPreferences({ key: "auth", local, tab });
  p.save({
    rememberAccount: true,
    autoLogin: false,
    email: "friend@example.invalid",
    password: "never-store-me",
  });
  p.storage.setItem("auth", "token");
  assert.equal(local.getItem("auth"), null);
  assert.equal(tab.getItem("auth"), "token");
  assert.equal(
    JSON.parse(local.getItem("story-hub-login-preferences")).email,
    "friend@example.invalid",
  );
  assert.ok(!JSON.stringify([...local.values]).includes("never-store-me"));
});
test("automatic login survives a fresh tab and signing out removes tokens", () => {
  const local = store();
  const p = createLoginPreferences({ key: "auth", local, tab: store() });
  p.save({ autoLogin: true, rememberAccount: false });
  p.storage.setItem("auth", "refreshable-session");
  const next = createLoginPreferences({ key: "auth", local, tab: store() });
  assert.equal(next.storage.getItem("auth"), "refreshable-session");
  next.storage.removeItem("auth");
  assert.equal(local.getItem("auth"), null);
});
test("disabling automatic login migrates the active session to the tab only", () => {
  const local = store(),
    tab = store();
  const p = createLoginPreferences({ key: "auth", local, tab });
  p.save({ autoLogin: true });
  p.storage.setItem("auth", "session");
  p.save({ autoLogin: false });
  assert.equal(local.getItem("auth"), null);
  assert.equal(tab.getItem("auth"), "session");
  assert.equal(
    createLoginPreferences({
      key: "auth",
      local,
      tab: store(),
    }).storage.getItem("auth"),
    null,
  );
});
test("legacy session migration and denied browser storage do not break login", () => {
  const local = store(),
    tab = store();
  local.setItem("auth", "legacy");
  const p = createLoginPreferences({ key: "auth", local, tab });
  assert.equal(p.storage.getItem("auth"), "legacy");
  assert.equal(local.getItem("auth"), null);
  const broken = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
    removeItem() {
      throw Error();
    },
  };
  const fallback = createLoginPreferences({
    key: "auth",
    local: broken,
    tab: broken,
  });
  fallback.storage.setItem("auth", "memory");
  assert.equal(fallback.storage.getItem("auth"), "memory");
});
