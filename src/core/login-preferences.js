// Only account preferences and Supabase's revocable session tokens are stored.
// Passwords never enter this module.
export function createLoginPreferences({ key, local, tab }) {
  const prefKey = "story-hub-login-preferences";
  const memory = new Map();
  const fallbackKeys = new Set();
  const read = (store, name) => {
    try {
      return store?.getItem(name) ?? null;
    } catch {
      return null;
    }
  };
  const remove = (store, name) => {
    try {
      store?.removeItem(name);
    } catch {}
  };
  const write = (store, name, value) => {
    try {
      store?.setItem(name, value);
      return !!store;
    } catch {
      return false;
    }
  };
  let prefs = { rememberAccount: false, autoLogin: false, email: "" };
  let existing;
  try {
    existing = JSON.parse(read(local, prefKey));
    if (existing)
      prefs = {
        rememberAccount: existing.rememberAccount === true,
        autoLogin: existing.autoLogin === true,
        email:
          existing.rememberAccount === true ? String(existing.email || "") : "",
      };
  } catch {}
  // Keep an existing login usable in this tab, without silently opting users in.
  if (!existing) {
    const legacy = read(local, key);
    if (legacy) {
      memory.set(key, legacy);
      write(tab, key, legacy);
      remove(local, key);
    }
  }
  const storage = {
    getItem(name) {
      const target = prefs.autoLogin ? local : tab;
      try {
        if (target && !fallbackKeys.has(name)) return target.getItem(name);
      } catch {}
      return memory.get(name) ?? null;
    },
    setItem(name, value) {
      memory.set(name, value);
      const target = prefs.autoLogin ? local : tab;
      if (write(target, name, value)) fallbackKeys.delete(name);
      else fallbackKeys.add(name);
      remove(prefs.autoLogin ? tab : local, name);
    },
    removeItem(name) {
      memory.delete(name);
      fallbackKeys.delete(name);
      remove(local, name);
      remove(tab, name);
    },
  };
  return {
    storage,
    get: () => ({ ...prefs }),
    save(next) {
      const token = storage.getItem(key);
      prefs = {
        rememberAccount: next.rememberAccount === true,
        autoLogin: next.autoLogin === true,
        email:
          next.rememberAccount === true ? String(next.email || "").trim() : "",
      };
      write(local, prefKey, JSON.stringify(prefs));
      if (token) storage.setItem(key, token);
      return { ...prefs };
    },
  };
}
export function browserLoginPreferences(key) {
  let local, tab;
  try {
    local = window.localStorage;
  } catch {}
  try {
    tab = window.sessionStorage;
  } catch {}
  return createLoginPreferences({ key, local, tab });
}
