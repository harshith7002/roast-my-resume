export const PREMIUM_FEATURES = Object.freeze([
  { id: "resume-rewrite", name: "Resume Rewrite", description: "Turn feedback into stronger, measurable resume bullets." },
  { id: "cover-letter", name: "Cover Letter Generation", description: "Create a focused cover letter from a resume and job description." },
  { id: "linkedin-review", name: "LinkedIn Profile Review", description: "Get the same brutal analysis for your LinkedIn profile." },
  { id: "interview-questions", name: "AI Interview Questions", description: "Practice questions generated from your own resume." },
]);

export function isPremiumFeatureEnabled(id) {
  return process.env[`REACT_APP_FEATURE_${id.toUpperCase().replace(/-/g, "_")}`] === "true";
}
