export const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

export async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 45000);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { ...(options.headers || {}) },
    });
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { error: await response.text() };

    if (!response.ok) {
      throw new Error(data.error || "The request could not be completed.");
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("This is taking longer than expected. Please try again.");
    if (error instanceof TypeError) throw new Error("We could not reach the analysis service. Please try again shortly.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function validatePdf(file) {
  if (!file) return "Choose a PDF resume first.";
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return "Only PDF resumes are supported.";
  if (file.size > 10 * 1024 * 1024) return "Your PDF must be smaller than 10 MB.";
  if (file.size === 0) return "That PDF appears to be empty.";
  return "";
}
