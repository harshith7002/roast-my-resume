export const LB_SEED = [
  { id: "s1", name: "TCS Waala Bhai 😂",   quote: "You listed MS Word as a skill in 2024. My grandmother knows MS Word. You expect 15 LPA with this?", verdict: "entry",   ats: 28, votes: 234, ts: 0 },
  { id: "s2", name: "Anonymous Fresher",    quote: "Your projects section is a YouTube tutorial graveyard. Todo App, Weather App — the holy trinity of doing absolutely nothing original.", verdict: "startup", ats: 45, votes: 189, ts: 0 },
  { id: "s3", name: "import numpy enjoyer", quote: "You imported NumPy once and called yourself an AI/ML Enthusiast. That's like taking an Uber once and calling yourself a transport entrepreneur.", verdict: "entry",   ats: 32, votes: 156, ts: 0 },
  { id: "s4", name: "Placement Padega 🔥",  quote: "Hobbies: Listening to music, watching movies, reading books. You've described every human being on planet Earth.", verdict: "startup", ats: 51, votes: 134, ts: 0 },
  { id: "s5", name: "Rahul from DTU",       quote: "Objective: 'seeking a challenging position to utilize my skills'. That's not an objective, that's a statement of obvious desire.", verdict: "product", ats: 67, votes: 98,  ts: 0 },
  { id: "s6", name: "CGPA 6.2 ka Don",      quote: "CGPA 6.2 and targeting FAANG. I respect the confidence. The universe does not.", verdict: "entry",   ats: 24, votes: 87,  ts: 0 },
  { id: "s7", name: "Full Stack Faker",      quote: "Listed React, Node, Python, Rust, Go, Kubernetes, and Docker. Built a static HTML page. Pick a struggle.", verdict: "startup", ats: 55, votes: 71,  ts: 0 },
];

export function getLbEntries() {
  try {
    const stored = JSON.parse(localStorage.getItem("lb_entries") || "[]");
    const realIds = new Set(stored.map(e => e.id));
    const seeds = LB_SEED.filter(s => !realIds.has(s.id));
    return [...stored, ...seeds].sort((a, b) => b.votes - a.votes);
  } catch {
    return [...LB_SEED];
  }
}

export function saveLbEntry(entry) {
  try {
    const stored = JSON.parse(localStorage.getItem("lb_entries") || "[]");
    localStorage.setItem("lb_entries", JSON.stringify([entry, ...stored]));
    window.dispatchEvent(new Event("lb_updated"));
  } catch {}
}
