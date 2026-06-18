from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from groq import Groq
from pypdf import PdfReader
import io
import os
import re
import json
import sqlite3
import hashlib
import time
from datetime import datetime
from functools import wraps
import tempfile
import difflib

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
CORS(app, resources={r"/api/*": {"origins": os.environ.get("ALLOWED_ORIGINS", "*").split(",")}})

client = Groq(api_key=os.environ.get("GROQ_API_KEY", "YOUR_GROQ_API_KEY_HERE"))

DB_PATH = os.environ.get("DB_PATH", "macoostudy.db")

# ── Database ──────────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id          TEXT PRIMARY KEY,
            email       TEXT UNIQUE NOT NULL,
            name        TEXT,
            avatar      TEXT,
            provider    TEXT DEFAULT 'email',
            created_at  TEXT DEFAULT (datetime('now')),
            last_login  TEXT
        );

        CREATE TABLE IF NOT EXISTS analyses (
            id          TEXT PRIMARY KEY,
            user_id     TEXT,
            type        TEXT NOT NULL,
            filename    TEXT,
            ats_score   INTEGER,
            verdict     TEXT,
            result_json TEXT,
            created_at  TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS jd_matches (
            id            TEXT PRIMARY KEY,
            user_id       TEXT,
            analysis_id   TEXT,
            jd_snippet    TEXT,
            match_score   INTEGER,
            created_at    TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS email_captures (
            id         TEXT PRIMARY KEY,
            email      TEXT UNIQUE NOT NULL,
            source     TEXT DEFAULT 'pre_analysis',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS analytics_events (
            id         TEXT PRIMARY KEY,
            user_id    TEXT,
            event      TEXT NOT NULL,
            meta       TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    conn.close()

init_db()

def uid():
    return hashlib.sha256(os.urandom(16)).hexdigest()[:16]

def track(event, user_id=None, meta=None):
    try:
        conn = get_db()
        conn.execute(
            "INSERT INTO analytics_events (id, user_id, event, meta) VALUES (?,?,?,?)",
            (uid(), user_id, event, json.dumps(meta) if meta else None)
        )
        conn.commit()
        conn.close()
    except Exception:
        pass

def valid_pdf_upload(file):
    if not file or not file.filename:
        return "Choose a PDF file."
    if not file.filename.lower().endswith(".pdf"):
        return "Only PDF files are supported."
    return None

def public_error(error):
    message = str(error).lower()
    if "429" in message or "rate_limit" in message:
        return "The analysis service is busy. Please try again in a minute.", 429
    if "api key" in message or "authentication" in message:
        return "The analysis service is temporarily unavailable.", 503
    return "We could not complete the analysis. Please try again.", 500

@app.errorhandler(413)
def too_large(_error):
    return jsonify({"error": "The PDF must be smaller than 10 MB."}), 413

@app.route("/api/events", methods=["POST"])
def analytics_event():
    data = request.get_json(silent=True) or {}
    event = re.sub(r"[^a-z0-9_\-]", "", str(data.get("event", "")).lower())[:64]
    if not event:
        return jsonify({"error": "event required"}), 400
    meta = data.get("meta") if isinstance(data.get("meta"), dict) else {}
    track(event, data.get("user_id"), meta)
    return jsonify({"success": True}), 201

# ── Language / Personality config (unchanged) ────────────────────────────────

LANG_INSTRUCTIONS = {
    "english":    "IMPORTANT: Write ONLY in English.",
    "hinglish":   "Write in Hinglish — a fun natural mix of Hindi and English.",
    "tanglish":   "Write in Tanglish — a fun natural mix of Tamil and English.",
    "tenglish":   "Write in Tenglish — a fun natural mix of Telugu and English.",
    "spanish":    "Write entirely in Spanish.",
    "french":     "Write entirely in French.",
    "german":     "Write entirely in German.",
    "portuguese": "Write entirely in Portuguese.",
    "arabic":     "Write entirely in Arabic.",
    "japanese":   "Write entirely in Japanese.",
    "korean":     "Write entirely in Korean.",
}

PERSONALITY_PROMPTS = {
    "default": "You are a brutally honest but hilarious senior software engineer who has seen thousands of fresher resumes.",
    "gordon":  "You are Gordon Ramsay reviewing a resume. Be ABSOLUTELY SAVAGE. Use phrases like 'THIS IS RAW!', 'YOU DONKEY!'",
    "parent":  "You are a stereotypically disappointed parent reviewing their child's resume.",
    "techbro": "You are a passive-aggressive Silicon Valley Tech Bro recruiter. Use excessive corporate jargon.",
    "senior":  "You are a toxic burnt-out senior developer with 15 years of experience and zero patience.",
}

# ── Resume scoring (unchanged logic) ─────────────────────────────────────────

def evaluate_resume_with_ai(resume_text):
    text_lower = resume_text.lower()
    score = 0
    cgpa_match = re.search(r'(\d+\.?\d*)\s*(?:cgpa|gpa)', text_lower)
    if cgpa_match:
        cgpa = float(cgpa_match.group(1))
        if cgpa >= 9.0: score += 30
        elif cgpa >= 8.5: score += 22
        elif cgpa >= 8.0: score += 15
        elif cgpa >= 7.0: score += 8
        elif cgpa >= 6.0: score += 3
    top = ['google','microsoft','amazon','meta','flipkart','uber','swiggy','zomato','razorpay','adobe','samsung','oracle','ibm']
    if any(c in text_lower for c in top) and 'intern' in text_lower:
        score += 35
    elif 'internship' in text_lower or 'intern ' in text_lower:
        score += 15
    proj = text_lower.count('project')
    deployed = any(x in text_lower for x in ['deployed','live','netlify','vercel','heroku','render'])
    if proj >= 4 and deployed: score += 20
    elif proj >= 2 and deployed: score += 14
    elif proj >= 2: score += 8
    else: score += 2
    if 'leetcode' in text_lower or 'codeforces' in text_lower: score += 12
    elif 'hackerrank' in text_lower or 'codechef' in text_lower: score += 5
    if 'open source' in text_lower: score += 8
    if any(x in text_lower for x in ['winner','won','first place','rank 1']): score += 10
    elif 'hackathon' in text_lower: score += 4
    if 'github' in text_lower: score += 3
    if any(x in text_lower for x in ['aws certified','google certified','azure certified']): score += 4
    if score >= 80: return "🌟 FAANG Possible"
    elif score >= 50: return "💰 Product Company Ready"
    elif score >= 25: return "🚀 Startup Ready"
    else: return "🏭 Entry Level"

def calculate_ats_score(resume_text):
    text_lower = resume_text.lower()
    score = 0
    tech_keywords = ['python','java','javascript','react','node','sql','aws','docker','git','api',
        'machine learning','deep learning','flask','django','mongodb','mysql','postgresql','typescript',
        'kubernetes','rest','graphql','redis','linux','c++','kotlin','swift','tensorflow','pytorch',
        'spring','express','nextjs','vue','angular','firebase','fastapi']
    keyword_count = sum(1 for k in tech_keywords if k in text_lower)
    if keyword_count >= 12: score += 20
    elif keyword_count >= 8: score += 15
    elif keyword_count >= 5: score += 10
    elif keyword_count >= 3: score += 5
    action_verbs = ['developed','built','designed','implemented','created','led','managed','optimized',
        'improved','deployed','architected','engineered','launched','delivered','reduced','increased',
        'automated','integrated','maintained','collaborated','spearheaded','streamlined']
    verb_count = sum(1 for v in action_verbs if v in text_lower)
    if verb_count >= 10: score += 15
    elif verb_count >= 7: score += 11
    elif verb_count >= 4: score += 7
    elif verb_count >= 2: score += 3
    metrics = re.findall(r'\d+%|\d+x|\d+\+|\$\d+|\d+\s*(?:users|requests|ms|seconds|lines|commits|stars|k\b|lakh|million)', text_lower)
    unique_metrics = len(set(metrics))
    if unique_metrics >= 8: score += 35
    elif unique_metrics >= 5: score += 25
    elif unique_metrics >= 3: score += 15
    elif unique_metrics >= 1: score += 8
    if '@' in text_lower: score += 4
    if 'linkedin' in text_lower: score += 3
    if 'github' in text_lower: score += 3
    if any(x in text_lower for x in ['b.tech','b.e','bachelor','computer science','engineering','bsc']): score += 5
    if 'experience' in text_lower or 'internship' in text_lower: score += 3
    if 'project' in text_lower: score += 2
    if 'objective' in text_lower: score -= 8
    if 'hobbies' in text_lower: score -= 8
    if 'reference' in text_lower: score -= 5
    if 'ms word' in text_lower: score -= 5
    if 'ms office' in text_lower: score -= 5
    return max(0, min(100, score))

def extract_text_from_pdf(pdf_bytes):
    if len(pdf_bytes) > 10 * 1024 * 1024:
        raise ValueError("PDF is too large")
    if not pdf_bytes.startswith(b"%PDF"):
        raise ValueError("Invalid PDF")
    reader = PdfReader(io.BytesIO(pdf_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()

def fallback_resume_comparison(old_text, new_text, old_ats, new_ats):
    """Produce a useful comparison even when the AI provider is unavailable."""
    clean = lambda value: re.sub(r'\s+', ' ', value).strip()
    old_lines = {clean(line) for line in old_text.splitlines() if len(clean(line)) >= 24}
    new_lines = {clean(line) for line in new_text.splitlines() if len(clean(line)) >= 24}
    added = sorted(new_lines - old_lines, key=len, reverse=True)
    removed = sorted(old_lines - new_lines, key=len, reverse=True)

    improvements = []
    regressions = []
    if new_ats > old_ats:
        improvements.append(f"ATS readiness increased by {new_ats - old_ats} points.")
    elif new_ats < old_ats:
        regressions.append(f"ATS readiness decreased by {old_ats - new_ats} points.")

    metric_pattern = re.compile(r'\d+%|\d+x|\d+\+|\$\d+|\d+\s*(?:users|requests|customers|projects)', re.I)
    old_metrics = set(metric_pattern.findall(old_text))
    new_metrics = set(metric_pattern.findall(new_text))
    if len(new_metrics) > len(old_metrics):
        improvements.append(f"Added {len(new_metrics) - len(old_metrics)} measurable impact statement(s).")
    elif len(new_metrics) < len(old_metrics):
        regressions.append(f"Removed {len(old_metrics) - len(new_metrics)} measurable impact statement(s).")

    for line in added[:3]:
        improvements.append(f"Added: {line[:180]}")
    for line in removed[:2]:
        regressions.append(f"Removed: {line[:180]}")

    similarity = round(difflib.SequenceMatcher(None, old_text[:12000], new_text[:12000]).ratio() * 100)
    unchanged = [f"The versions are approximately {similarity}% textually similar."]
    if not improvements:
        improvements.append("The updated version preserves the previous resume's core content.")
    if not regressions:
        regressions = []

    if new_ats > old_ats:
        recommendation = "Use the updated version and keep strengthening bullets with outcomes, scope, and metrics."
    elif new_ats < old_ats:
        recommendation = "Restore the strongest removed details before using the updated version."
    else:
        recommendation = "The ATS score is unchanged; focus next on quantified impact and role-specific keywords."

    return {
        "improvements": improvements[:5],
        "regressions": regressions[:4],
        "unchanged": unchanged,
        "recommendation": recommendation,
    }

# ── JD Matcher ────────────────────────────────────────────────────────────────

JD_MATCH_PROMPT = """You are an expert ATS system and technical recruiter. Analyze the resume against the job description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Return ONLY valid JSON in this exact structure:
{{
  "match_score": <integer 0-100>,
  "strengths": [
    {{"point": "string", "detail": "string"}},
    {{"point": "string", "detail": "string"}},
    {{"point": "string", "detail": "string"}}
  ],
  "missing_skills": [
    {{"skill": "string", "importance": "critical|important|nice-to-have"}},
    {{"skill": "string", "importance": "critical|important|nice-to-have"}}
  ],
  "resume_keywords_missing_from_jd": ["string", "string", "string"],
  "improvements": [
    {{"action": "string", "why": "string"}},
    {{"action": "string", "why": "string"}},
    {{"action": "string", "why": "string"}}
  ],
  "summary": "2-sentence overall assessment"
}}

scoring guide:
- 85-100: Excellent match, apply now
- 70-84: Good match, minor gaps  
- 50-69: Decent match, notable gaps
- 30-49: Weak match, significant upskilling needed
- 0-29: Poor match

Return ONLY the JSON. No markdown, no preamble."""

@app.route("/api/jd-match", methods=["POST"])
def jd_match():
    if "resume" not in request.files:
        return jsonify({"error": "No resume uploaded"}), 400
    if not request.form.get("jd_text", "").strip():
        return jsonify({"error": "No job description provided"}), 400

    file = request.files["resume"]
    jd_text = request.form.get("jd_text", "").strip()
    user_id = request.form.get("user_id")

    validation_error = valid_pdf_upload(file)
    if validation_error:
        return jsonify({"error": validation_error}), 400

    try:
        pdf_bytes = file.read()
        resume_text = extract_text_from_pdf(pdf_bytes)
        if len(resume_text) < 100:
            return jsonify({"error": "Could not extract text from PDF."}), 400

        prompt = JD_MATCH_PROMPT.format(
            resume_text=resume_text[:3500],
            jd_text=jd_text[:2000]
        )

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.2,
        )

        raw = response.choices[0].message.content.strip()
        # strip markdown fences if present
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        result = json.loads(raw)

        analysis_id = uid()
        conn = get_db()
        conn.execute(
            "INSERT INTO analyses (id, user_id, type, filename, ats_score, verdict, result_json) VALUES (?,?,?,?,?,?,?)",
            (analysis_id, user_id, "jd_match", file.filename,
             result.get("match_score"), None, json.dumps(result))
        )
        conn.execute(
            "INSERT INTO jd_matches (id, user_id, analysis_id, jd_snippet, match_score) VALUES (?,?,?,?,?)",
            (uid(), user_id, analysis_id, jd_text[:200], result.get("match_score"))
        )
        conn.commit()
        conn.close()

        track("jd_match", user_id, {"score": result.get("match_score")})

        return jsonify({
            "success": True,
            "analysis_id": analysis_id,
            **result
        })

    except json.JSONDecodeError as e:
        return jsonify({"error": "AI returned invalid response, please retry."}), 500
    except Exception as e:
        message, status = public_error(e)
        return jsonify({"error": message}), status


# ── Roast (existing, now also saves to DB) ────────────────────────────────────

ROAST_PROMPT = """{personality_prompt}
LANGUAGE RULE: {lang_instruction}
VERDICT (DO NOT CHANGE THIS): {python_verdict}

Here is the resume:
{resume_text}

Give your roast in this EXACT format:

🔥 THE ROAST
[2-3 savage funny opening lines specific to THIS resume.]

💀 HALL OF SHAME (Top 3 Brutal Mistakes)
1. [Specific mistake]
2. [Specific mistake]
3. [Specific mistake]

✅ OKAY FINE, THIS IS DECENT
[2-3 genuinely good things]

📈 GLOW UP GUIDE (5 Specific Fixes)
1. [Actionable fix]
2. [Actionable fix]
3. [Actionable fix]
4. [Actionable fix]
5. [Actionable fix]

🎯 FINAL VERDICT
{python_verdict}
[2 sentences explaining why in character voice]"""

@app.route("/api/roast", methods=["POST"])
def roast_resume():
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["resume"]
    validation_error = valid_pdf_upload(file)
    if validation_error:
        return jsonify({"error": validation_error}), 400

    language    = request.form.get("language", "english")
    personality = request.form.get("personality", "default")
    user_id     = request.form.get("user_id")

    try:
        pdf_bytes   = file.read()
        resume_text = extract_text_from_pdf(pdf_bytes)
        if len(resume_text) < 100:
            return jsonify({"error": "Could not extract text from PDF."}), 400

        lang_instruction  = LANG_INSTRUCTIONS.get(language, LANG_INSTRUCTIONS["english"])
        personality_prompt = PERSONALITY_PROMPTS.get(personality, PERSONALITY_PROMPTS["default"])
        python_verdict    = evaluate_resume_with_ai(resume_text)
        python_ats        = calculate_ats_score(resume_text)

        prompt = ROAST_PROMPT.format(
            personality_prompt=personality_prompt,
            lang_instruction=lang_instruction,
            python_verdict=python_verdict,
            resume_text=resume_text[:4000]
        )

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1200,
            temperature=0.7,
        )
        roast_text = response.choices[0].message.content

        analysis_id = uid()
        conn = get_db()
        conn.execute(
            "INSERT INTO analyses (id, user_id, type, filename, ats_score, verdict, result_json) VALUES (?,?,?,?,?,?,?)",
            (analysis_id, user_id, "roast", file.filename, python_ats, python_verdict,
             json.dumps({"roast": roast_text}))
        )
        conn.commit()
        conn.close()

        track("resume_upload_completed", user_id, {"ats_score": python_ats, "personality": personality, "language": language})

        return jsonify({
            "roast": roast_text,
            "success": True,
            "verdict": python_verdict,
            "ats_score": python_ats,
            "analysis_id": analysis_id,
        })

    except Exception as e:
        track("resume_upload_failed", user_id, {"reason": type(e).__name__})
        message, status = public_error(e)
        return jsonify({"error": message}), status


# ── Resume History ────────────────────────────────────────────────────────────

@app.route("/api/history", methods=["GET"])
def get_history():
    user_id = request.args.get("user_id")
    search  = request.args.get("search", "")
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    conn = get_db()
    if search:
        rows = conn.execute(
            "SELECT * FROM analyses WHERE user_id=? AND (filename LIKE ? OR verdict LIKE ? OR result_json LIKE ?) ORDER BY created_at DESC LIMIT 50",
            (user_id, f"%{search}%", f"%{search}%", f"%{search}%")
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM analyses WHERE user_id=? ORDER BY created_at DESC LIMIT 50",
            (user_id,)
        ).fetchall()
    conn.close()

    return jsonify({"analyses": [dict(r) for r in rows]})


# ── Dashboard Stats ───────────────────────────────────────────────────────────

@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    conn = get_db()

    total = conn.execute("SELECT COUNT(*) FROM analyses WHERE user_id=?", (user_id,)).fetchone()[0]
    avg_ats_row = conn.execute("SELECT AVG(ats_score) FROM analyses WHERE user_id=? AND ats_score IS NOT NULL", (user_id,)).fetchone()
    avg_ats = round(avg_ats_row[0] or 0, 1)

    recent = conn.execute(
        "SELECT ats_score, created_at FROM analyses WHERE user_id=? AND ats_score IS NOT NULL ORDER BY created_at ASC LIMIT 10",
        (user_id,)
    ).fetchall()

    jd_count = conn.execute("SELECT COUNT(*) FROM jd_matches WHERE user_id=?", (user_id,)).fetchone()[0]
    avg_jd_row = conn.execute("SELECT AVG(match_score) FROM jd_matches WHERE user_id=?", (user_id,)).fetchone()
    avg_jd = round(avg_jd_row[0] or 0, 1)

    conn.close()

    trend = [{"score": r["ats_score"], "date": r["created_at"][:10]} for r in recent]

    return jsonify({
        "total_analyses": total,
        "avg_ats_score": avg_ats,
        "jd_matches_count": jd_count,
        "avg_jd_match": avg_jd,
        "ats_trend": trend,
    })


# ── Email Capture ─────────────────────────────────────────────────────────────

@app.route("/api/email-capture", methods=["POST"])
def email_capture():
    data  = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    if not email or "@" not in email:
        return jsonify({"error": "Invalid email"}), 400

    conn = get_db()
    try:
        eid = uid()
        conn.execute(
            "INSERT OR IGNORE INTO email_captures (id, email, source) VALUES (?,?,?)",
            (eid, email, data.get("source", "pre_analysis"))
        )
        # Also upsert user
        conn.execute(
            "INSERT OR IGNORE INTO users (id, email, provider) VALUES (?,?,'email')",
            (eid, email)
        )
        conn.commit()
        user_row = conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
        user_id = user_row["id"] if user_row else eid
        conn.close()
        track("signup", user_id)
        return jsonify({"success": True, "user_id": user_id})
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# ── Version Comparison ────────────────────────────────────────────────────────

@app.route("/api/compare", methods=["POST"])
def compare_resumes():
    if "resume_old" not in request.files or "resume_new" not in request.files:
        return jsonify({"error": "Both resume_old and resume_new are required"}), 400

    old_file = request.files["resume_old"]
    new_file = request.files["resume_new"]
    for file in (old_file, new_file):
        validation_error = valid_pdf_upload(file)
        if validation_error:
            return jsonify({"error": validation_error}), 400

    user_id = request.form.get("user_id")
    app.logger.info("compare_started user_id=%s old=%s new=%s", user_id, old_file.filename, new_file.filename)
    try:
        old_bytes = old_file.read()
        new_bytes = new_file.read()
        old_text  = extract_text_from_pdf(old_bytes)
        new_text  = extract_text_from_pdf(new_bytes)
        if len(old_text) < 100 or len(new_text) < 100:
            return jsonify({"error": "We could not read enough text from one of the PDFs. Try text-based PDFs instead of scanned images."}), 400
        if hashlib.sha256(old_bytes).digest() == hashlib.sha256(new_bytes).digest():
            return jsonify({"error": "The two uploaded PDFs are identical."}), 400

        old_ats = calculate_ats_score(old_text)
        new_ats = calculate_ats_score(new_text)
        old_verdict = evaluate_resume_with_ai(old_text)
        new_verdict = evaluate_resume_with_ai(new_text)

        COMPARE_PROMPT = f"""Compare these two resume versions and identify concrete changes.

OLD RESUME:
{old_text[:2000]}

NEW RESUME:
{new_text[:2000]}

Return ONLY valid JSON:
{{
  "improvements": ["string", "string", "string"],
  "regressions": ["string", "string"],
  "unchanged": ["string", "string"],
  "recommendation": "string"
}}"""

        diff = fallback_resume_comparison(old_text, new_text, old_ats, new_ats)
        api_key = os.environ.get("GROQ_API_KEY", "")
        if api_key and api_key != "YOUR_GROQ_API_KEY_HERE":
            try:
                response = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": COMPARE_PROMPT}],
                    max_tokens=800,
                    temperature=0.2,
                )
                raw = response.choices[0].message.content.strip()
                raw = re.sub(r'^```(?:json)?\s*', '', raw)
                raw = re.sub(r'\s*```$', '', raw)
                ai_diff = json.loads(raw)
                if isinstance(ai_diff, dict):
                    diff.update({key: ai_diff[key] for key in ("improvements", "regressions", "unchanged", "recommendation") if ai_diff.get(key)})
            except Exception as enrichment_error:
                app.logger.warning("compare_ai_enrichment_failed type=%s", type(enrichment_error).__name__)

        analysis_id = uid()
        result = {
            "success": True,
            "analysis_id": analysis_id,
            "old_ats": old_ats,
            "new_ats": new_ats,
            "ats_delta": new_ats - old_ats,
            "old_verdict": old_verdict,
            "new_verdict": new_verdict,
            **diff
        }
        conn = get_db()
        conn.execute(
            "INSERT INTO analyses (id, user_id, type, filename, ats_score, verdict, result_json) VALUES (?,?,?,?,?,?,?)",
            (analysis_id, user_id, "compare", f"{old_file.filename} -> {new_file.filename}", new_ats, new_verdict, json.dumps(result))
        )
        conn.commit()
        conn.close()
        track("compare_completed", user_id, {"ats_delta": new_ats - old_ats})
        app.logger.info("compare_completed analysis_id=%s ats_delta=%s", analysis_id, new_ats - old_ats)
        return jsonify(result)
    except Exception as e:
        app.logger.exception("compare_failed user_id=%s", user_id)
        track("compare_failed", user_id, {"reason": type(e).__name__})
        message, status = public_error(e)
        return jsonify({"error": message}), status


# ── Analytics (admin) ─────────────────────────────────────────────────────────

@app.route("/api/analytics/summary", methods=["GET"])
def analytics_summary():
    conn = get_db()
    total_users     = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    total_uploads   = conn.execute("SELECT COUNT(*) FROM analyses").fetchone()[0]
    total_jd        = conn.execute("SELECT COUNT(*) FROM jd_matches").fetchone()[0]
    total_emails    = conn.execute("SELECT COUNT(*) FROM email_captures").fetchone()[0]
    events_by_type  = conn.execute(
        "SELECT event, COUNT(*) as cnt FROM analytics_events GROUP BY event ORDER BY cnt DESC"
    ).fetchall()
    conn.close()
    return jsonify({
        "total_users": total_users,
        "total_uploads": total_uploads,
        "total_jd_matches": total_jd,
        "email_captures": total_emails,
        "events": [dict(r) for r in events_by_type],
    })


# ── Health ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "version": "2.0.0"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
