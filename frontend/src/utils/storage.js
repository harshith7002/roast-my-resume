// localStorage helpers for user session + history

export function getUser() {
  try { return JSON.parse(localStorage.getItem("mcs_user") || "null"); }
  catch { return null; }
}

export function getVisitorId() {
  let id = localStorage.getItem("rmr_visitor_id");
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() || `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("rmr_visitor_id", id);
  }
  return id;
}

export function setUser(user) {
  localStorage.setItem("mcs_user", JSON.stringify(user));
  window.dispatchEvent(new Event("mcs_user_changed"));
}

export function clearUser() {
  localStorage.removeItem("mcs_user");
  window.dispatchEvent(new Event("mcs_user_changed"));
}

export function getAnalysisCache() {
  try { return JSON.parse(localStorage.getItem("mcs_analyses") || "[]"); }
  catch { return []; }
}

export function pushAnalysisCache(entry) {
  const arr = getAnalysisCache();
  const cached = {
    ...entry,
    id: entry.id || globalThis.crypto?.randomUUID?.() || `local_${Date.now()}`,
    cached_at: entry.cached_at || new Date().toISOString(),
  };
  const deduped = [cached, ...arr].filter((item, index, all) =>
    all.findIndex(other => other.id === item.id) === index
  );
  localStorage.setItem("mcs_analyses", JSON.stringify(deduped.slice(0, 30)));
  window.dispatchEvent(new Event("mcs_history_changed"));
  return cached;
}

export function removeAnalysisCache(id) {
  localStorage.setItem("mcs_analyses", JSON.stringify(getAnalysisCache().filter(item => item.id !== id)));
  window.dispatchEvent(new Event("mcs_history_changed"));
}
