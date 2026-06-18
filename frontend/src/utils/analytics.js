import { apiFetch } from "./api";
import { getUser } from "./storage";

export function trackEvent(event, meta = {}) {
  const user = getUser();
  const payload = { event, user_id: user?.user_id || null, meta };

  if (window.gtag) window.gtag("event", event, meta);
  apiFetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    timeout: 5000,
  }).catch(() => {});
}
