import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ARTICLES = [
  {
    id: 1,
    slug: 'resume-mistakes-indian-cs-freshers',
    title: 'Top 5 Resume Mistakes Indian CS Freshers Make',
    date: 'May 29, 2026',
    readTime: '3 min read',
    excerpt: 'Most CS freshers make the same resume mistakes. Here are the top 5 and how to fix them.',
    content: `Most CS graduates competing for tech jobs make the same avoidable mistakes on their resumes. Here are the top 5 and how to fix them.

## 1. Listing MS Word as a Technical Skill

In 2026, listing MS Word as a skill is like saying you know how to breathe. Recruiters expect basic office tools. List actual technical skills instead.

**Fix:** Replace with Python, React, Node.js, MySQL, AWS, Docker.

## 2. Vague Project Descriptions

"Built a web application using React" tells recruiters nothing. What did it do? How many users?

**Fix:** "Built a task management app with React and Node.js, deployed on AWS, used by 50+ users. Reduced task completion time by 30%."

## 3. Generic Objective Statements

"Seeking a challenging position where I can utilize my skills" — every recruiter has read this a thousand times.

**Fix:** Remove the objective section entirely. Use that space for an extra project.

## 4. Not Quantifying Achievements

"Improved application performance" means nothing.

**Fix:** "Reduced API response time by 40% through query optimization."

## 5. Poor Formatting and Long Resumes

Freshers often submit 2-3 page resumes. Recruiters spend an average of 6 seconds on a resume.

**Fix:** Keep it to 1 page. Use clean formatting. Prioritize your best projects.

---

Want to know exactly what's wrong with your resume? Try our free AI resume roaster at macoostudy.info — get brutal honest feedback in 15 seconds.`
  },
  {
    id: 2,
    slug: 'get-first-tech-internship-india',
    title: 'How to Get Your First Tech Internship in India (2026 Guide)',
    date: 'May 29, 2026',
    readTime: '4 min read',
    excerpt: 'A practical guide for Indian CS students to land their first tech internship.',
    content: `Getting your first tech internship feels impossible when every job posting asks for experience. Here is the right approach.

## Start Earlier Than You Think

Most students start applying in their 3rd year. The students who get the best internships start in their 2nd year.

**Action:** Start applying from 2nd year onwards.

## Build Projects That Actually Work

The biggest differentiator is projects. Not tutorials you followed — actual projects you built to solve a real problem.

**Good project ideas:**
- A tool that solves a problem you face daily
- An automation script for something tedious
- A data analysis project on a dataset you care about

Deploy everything. A live project is 10x more impressive than one that only runs on your laptop.

## Apply on Multiple Platforms

- **Internshala** — largest internship platform in India
- **LinkedIn** — for startup and MNC internships
- **AngelList/Wellfound** — for startup internships
- **Unstop** — competitions that lead to internships
- **Company career pages** — apply directly

## Cold Email Actually Works

A well-written cold email to a startup founder has a surprisingly high success rate.

**Template:** "Hi [Name], I am a [year] CS student at [college]. I built [specific project] and would love to contribute to [specific team]. Would you be open to a 15-minute chat?"

## Competitive Programming Helps

Having 200+ LeetCode problems solved will get you past resume filters at top companies.

---

Ready to check if your resume is good enough? Get brutal honest feedback at macoostudy.info — free AI resume roaster built for Indian CS students.`
  },
  {
    id: 3,
    slug: 'resume-tips-get-hired-2026',
    title: 'How to Write a Resume That Gets You Hired in 2026',
    date: 'May 29, 2026',
    readTime: '5 min read',
    excerpt: 'A complete guide to writing a resume that passes ATS filters and impresses recruiters.',
    content: `Writing a resume that gets you hired requires understanding two audiences — the ATS system and the human recruiter.

## Understanding ATS Systems

Most companies use ATS software to filter resumes. If your resume does not pass the ATS filter, no human ever sees it.

**Tips for ATS:**
- Use standard section headings: Education, Experience, Projects, Skills
- Include keywords from the job description
- Use a clean simple format — no tables, no columns

## The STAR Method

For any experience or project, use STAR format:
- Situation: What was the context?
- Task: What were you responsible for?
- Action: What did you do?
- Result: What was the outcome?

**Example:** "Developed a REST API for a food delivery app using Node.js, reducing response time by 35% and supporting 500+ concurrent users."

## Essential Sections for CS Freshers

**Contact:** Name, email, phone, LinkedIn, GitHub. No photo.

**Education:** College, degree, CGPA (only if above 7.0), graduation year.

**Technical Skills:** Languages, frameworks, databases, tools, cloud platforms.

**Projects:** 3-4 projects with tech stack, description, metrics, and GitHub link.

**Achievements:** Hackathon wins, CP ratings, certifications, open source.

## What NOT to Include

- Hobbies like "listening to music"
- Objective statements
- Low CGPA (below 6.5, just omit it)
- Skills you barely know

## Format Rules

- Length: 1 page always
- Font: Arial or Calibri, size 10-12
- File: PDF always, never Word

---

Not sure if your resume is ready? Get it brutally roasted at macoostudy.info — free, honest feedback in 15 seconds.`
  },
  {
    id: 4,
    slug: 'dsa-preparation-guide-placements',
    title: 'DSA Preparation Guide for Campus Placements 2026',
    date: 'May 29, 2026',
    readTime: '4 min read',
    excerpt: 'How to prepare DSA for campus placements — a practical roadmap for CS students.',
    content: `Data Structures and Algorithms is the most important skill for cracking tech interviews. Here is a practical roadmap.

## How Much DSA Do You Actually Need?

- **TCS/Infosys/Wipro:** Basic arrays, strings, sorting. 50-100 easy LeetCode problems.
- **Startups/Mid-tier:** Arrays, linked lists, trees, basic DP. 150-200 problems.
- **Amazon/Flipkart:** Strong DSA + system design basics. 300+ problems.
- **Google/Microsoft:** Expert level DSA + complex DP. 500+ problems.

## The Right Order to Learn DSA

1. Arrays and Strings
2. Hashing and HashMaps
3. Two Pointers and Sliding Window
4. Linked Lists
5. Stacks and Queues
6. Binary Search
7. Trees and Binary Search Trees
8. Graphs (BFS, DFS)
9. Dynamic Programming
10. Heaps and Priority Queues

## Best Resources

- **LeetCode** — best for interview prep
- **Striver's DSA Sheet** — structured 180 problem list
- **NeetCode** — excellent YouTube explanations
- **GeeksforGeeks** — good for concept reference

## Daily Practice Schedule

- 1st year: 1 easy problem daily
- 2nd year: 1-2 problems daily, mix of easy and medium
- 3rd year: 2-3 problems daily, focus on medium
- Final year: Mock interviews + hard problems

## Common Mistakes to Avoid

- Jumping to hard problems too early
- Not understanding time complexity
- Memorizing solutions instead of understanding patterns
- Not practicing on a whiteboard or paper

---

Once your DSA is solid, make sure your resume reflects it. Get your resume roasted at macoostudy.info — free AI feedback in 15 seconds.`
  },
  {
    id: 5,
    slug: 'cgpa-vs-skills-placement',
    title: 'CGPA vs Skills — What Actually Matters for Placements?',
    date: 'May 29, 2026',
    readTime: '3 min read',
    excerpt: 'The eternal debate — does CGPA matter more than skills for getting placed?',
    content: `Every CS student asks this question. The honest answer is — it depends on which company you are targeting.

## When CGPA Matters

**Mass recruiters (TCS, Infosys, Wipro, Cognizant):**
These companies have strict CGPA cutoffs — usually 6.0, 6.5, or 7.0. Below the cutoff, your resume does not even get reviewed. For these companies, CGPA matters a lot.

**On-campus placements:**
Most college placement cells have minimum CGPA requirements. If your CGPA is below 6.0, you may not even be allowed to sit for certain companies.

**Top MNCs with CGPA filters:**
Companies like Microsoft, Google, and Amazon often use CGPA as a first filter for fresher roles. A CGPA below 7.5 may get filtered out automatically.

## When Skills Matter More

**Startups:**
Most funded startups do not care about CGPA. They care about what you have built. A strong GitHub profile with real projects will get you an interview at any startup.

**Product companies:**
Companies like Razorpay, Swiggy, Zomato care more about your DSA skills and projects than your CGPA.

**Freelancing and remote work:**
Nobody asks for your CGPA when you are freelancing. Your portfolio speaks for itself.

## The Honest Verdict

- CGPA above 8.0 — opens most doors, use it proudly
- CGPA 7.0 to 8.0 — good enough, focus on skills now
- CGPA 6.0 to 7.0 — compensate with strong projects and DSA
- CGPA below 6.0 — mass recruiters are hard, focus entirely on skills and startups

## What You Should Do Right Now

If your CGPA is low, stop worrying about it — you cannot change the past. Focus on building 2-3 strong projects, solving 200+ LeetCode problems, and getting at least one internship.

---

Wondering how your overall profile looks to recruiters? Get your resume roasted at macoostudy.info — honest AI feedback in 15 seconds.`
  }
];

function ArticlePage({ article, onBack }) {
  return (
    <div className="app">
      <div className="static-page">
        <button onClick={onBack} className="back-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Back to Blog
        </button>
        <h1 style={{ color: '#ff4444', fontFamily: 'Syne, sans-serif', fontSize: '2rem', marginBottom: 8 }}>
          {article.title}
        </h1>
        <p style={{ color: '#9090a8', fontSize: 13, marginBottom: 32 }}>
          {article.date} • {article.readTime}
        </p>
        <div style={{ color: '#c0c0d0', lineHeight: 1.8 }}>
          {article.content.split('\n').map((line, i) => {
            if (line.startsWith('## ')) {
              return <h2 key={i} style={{ color: '#f0f0f5', fontFamily: 'Syne, sans-serif', marginTop: 32, marginBottom: 12 }}>{line.replace('## ', '')}</h2>;
            }
            if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={i} style={{ color: '#f0f0f5', fontWeight: 700, marginBottom: 8 }}>{line.replace(/\*\*/g, '')}</p>;
            }
            if (line.startsWith('- ')) {
              return <li key={i} style={{ marginBottom: 6, marginLeft: 20 }}>{line.replace('- ', '')}</li>;
            }
            if (line.startsWith('---')) {
              return <hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '32px 0' }} />;
            }
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} style={{ marginBottom: 12 }}>{line}</p>;
          })}
        </div>
        <div style={{ marginTop: 40, padding: 24, background: 'rgba(255,68,68,0.1)', borderRadius: 12, border: '1px solid rgba(255,68,68,0.3)' }}>
          <p style={{ color: '#f0f0f5', marginBottom: 12 }}>🔥 Get your resume brutally roasted for free!</p>
          <Link to="/" style={{ color: '#ff4444', fontWeight: 700 }}>Try macoostudy.info →</Link>
        </div>
      </div>
    </div>
  );
}

export default function Blog() {
  const [selectedArticle, setSelectedArticle] = useState(null);

  if (selectedArticle) {
    return <ArticlePage article={selectedArticle} onBack={() => setSelectedArticle(null)} />;
  }

  return (
    <div className="app">
      <div className="static-page">
        <Link to="/" className="back-link">← Back to Roast My Resume</Link>
        <h1 style={{ color: '#ff4444', fontFamily: 'Syne, sans-serif' }}>Blog</h1>
        <p style={{ color: '#9090a8', marginBottom: 40 }}>
          Career tips, resume advice, and placement guides for CS freshers.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {ARTICLES.map(article => (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              style={{
                background: '#16161f',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 24,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,68,68,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            >
              <h2 style={{ color: '#f0f0f5', fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', marginBottom: 8 }}>
                {article.title}
              </h2>
              <p style={{ color: '#9090a8', fontSize: 13, marginBottom: 12 }}>
                {article.date} • {article.readTime}
              </p>
              <p style={{ color: '#c0c0d0', lineHeight: 1.6 }}>{article.excerpt}</p>
              <p style={{ color: '#ff4444', marginTop: 12, fontSize: 14 }}>Read more →</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
