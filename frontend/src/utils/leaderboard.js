// No seeded/fabricated entries — the leaderboard only shows real, opt-in
// submissions saved on this device.
export function getLbEntries() {
  try {
    const stored = JSON.parse(localStorage.getItem("lb_entries") || "[]");
    return [...stored].sort((a, b) => b.votes - a.votes);
  } catch {
    return [];
  }
}

export function saveLbEntry(entry) {
  try {
    const stored = JSON.parse(localStorage.getItem("lb_entries") || "[]");
    localStorage.setItem("lb_entries", JSON.stringify([entry, ...stored]));
    window.dispatchEvent(new Event("lb_updated"));
  } catch {}
}
