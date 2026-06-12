// localStorage helpers for user session + history

export function getUser() {
  try { return JSON.parse(localStorage.getItem("mcs_user") || "null"); }
  catch { return null; }
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
  arr.unshift({ ...entry, cached_at: new Date().toISOString() });
  localStorage.setItem("mcs_analyses", JSON.stringify(arr.slice(0, 20)));
}
