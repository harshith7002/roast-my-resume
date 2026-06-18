export const PREMIUM_FEATURES = Object.freeze([
  { id: "resume-rewrite", name: "Resume Rewrite", description: "Turn feedback into stronger, measurable resume bullets." },
  { id: "jd-optimization", name: "JD Optimization", description: "Tailor a resume version to a specific role." },
  { id: "cover-letter", name: "Cover Letter Generation", description: "Create a focused cover letter from a resume and job description." },
  { id: "version-tracking", name: "Resume Version Tracking", description: "Save versions and measure progress over time." },
]);

export function isPremiumFeatureEnabled(id) {
  return process.env[`REACT_APP_FEATURE_${id.toUpperCase().replace(/-/g, "_")}`] === "true";
}
