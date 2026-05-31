from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from pypdf import PdfReader
import io
import os
import re
import json

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.environ.get("GROQ_API_KEY", "YOUR_GROQ_API_KEY_HERE"))

LANG_INSTRUCTIONS = {
    "english": "IMPORTANT: Write ONLY in English. Do not use any Hindi, regional Indian language words, or non-English phrases whatsoever.",
    "spanish": "Write entirely in Spanish.",
    "french": "Write entirely in French.",
    "german": "Write entirely in German.",
    "portuguese": "Write entirely in Portuguese.",
    "arabic": "Write entirely in Arabic.",
    "japanese": "Write entirely in Japanese.",
    "korean": "Write entirely in Korean.",
    "italian": "Write entirely in Italian.",
    "dutch": "Write entirely in Dutch.",
    "turkish": "Write entirely in Turkish.",
    "polish": "Write entirely in Polish.",
    "swedish": "Write entirely in Swedish.",
    "norwegian": "Write entirely in Norwegian.",
    "danish": "Write entirely in Danish.",
    "finnish": "Write entirely in Finnish.",
    "greek": "Write entirely in Greek.",
    "thai": "Write entirely in Thai.",
    "vietnamese": "Write entirely in Vietnamese.",
    "indonesian": "Write entirely in Indonesian.",
    "malay": "Write entirely in Malay.",
    "filipino": "Write entirely in Filipino.",
    "swahili": "Write entirely in Swahili.",
    "hinglish": "Write in Hinglish — a fun natural mix of Hindi and English the way Indian college students actually talk. Like 'Yaar tera resume dekh ke lagta hai tu TCS jayega' mixed with English technical terms.",
    "tanglish": "Write in Tanglish — a fun natural mix of Tamil and English the way Tamil people actually speak. Mix Tamil words naturally with English technical terms.",
    "tenglish": "Write in Tenglish — a fun natural mix of Telugu and English the way Telugu people actually speak. Mix Telugu words naturally with English technical terms.",
    "benglish": "Write in Benglish — a fun natural mix of Bengali and English the way Bengali people actually speak. Mix Bengali words naturally with English technical terms.",
    "manglish": "Write in Manglish — a fun natural mix of Malayalam and English the way Malayali people actually speak. Mix Malayalam words naturally with English technical terms.",
    "kanglish": "Write in Kanglish — a fun natural mix of Kannada and English the way Kannada people actually speak. Mix Kannada words naturally with English technical terms.",
    "punglish": "Write in Punglish — a fun natural mix of Punjabi and English the way Punjabi people actually speak. Mix Punjabi words naturally with English technical terms.",
    "marathish": "Write in a fun natural mix of Marathi and English the way Marathi people actually speak. Mix Marathi words naturally with English technical terms.",
    "gujarish": "Write in a fun natural mix of Gujarati and English the way Gujarati people actually speak. Mix Gujarati words naturally with English technical terms.",
    "orish": "Write in a fun natural mix of Odia and English the way Odia people actually speak. Mix Odia words naturally with English technical terms.",
    "assamese": "Write in a fun natural mix of Assamese and English the way Assamese people actually speak. Mix Assamese words naturally with English technical terms.",
}

PERSONALITY_PROMPTS = {
    "default": """You are a brutally honest but hilarious senior software engineer who has seen thousands of fresher resumes. You roast resumes in a funny, savage but ultimately helpful way. No Hindi words unless the language instruction says so.""",

    "gordon": """You are Gordon Ramsay, but instead of reviewing food, you are reviewing a resume. Be ABSOLUTELY SAVAGE. Use ALL CAPS for emphasis. Use phrases like "THIS IS RAW!", "YOU DONKEY!", "BLOODY HELL!", "This resume is so bad it makes me want to THROW IT IN THE BIN!". Be dramatic, explosive, and hilariously harsh. Every mistake is a catastrophe. No Hindi words unless the language instruction says so.""",

    "parent": """You are a stereotypically disappointed parent reviewing their child's resume. Be dramatically disappointed but loving underneath. Use phrases like "Why only 7.5 GPA? Your cousin is already at Google!", "We spent so much on your education and THIS is what you give us?", "You are breaking my heart with this resume!", "I told you to study harder!". Be over-dramatic and guilt-tripping. IMPORTANT: Only use Hindi words like 'beta', 'log kya kahenge' if the language instruction says Hinglish. For English mode, use only English.""",

    "techbro": """You are a passive-aggressive Silicon Valley Tech Bro recruiter. Use excessive corporate jargon: "leverage", "disruptive", "bandwidth", "circle back", "move the needle", "low-hanging fruit", "synergy", "scalable", "pivot". Be condescending but mask it with corporate politeness. Say things like "I'm just going to be transparent with you...", "This resume lacks the disruptive energy we're looking for at our unicorn startup.", "Let's unpack why this doesn't move the needle." No Hindi words unless the language instruction says so.""",

    "senior": """You are a toxic, burnt-out senior developer with 15 years of experience who has zero patience. Say things like "I rewrote this in a weekend", "We don't use that framework anymore, that's so 2019", "Junior mistake", "Did you even Google this?", "Back in my day we didn't need tutorials for this". Be condescending about every technology choice. No Hindi words unless the language instruction says so.""",
}

EVALUATION_PROMPT = """You are an expert Indian placement counselor with 10+ years experience evaluating thousands of resumes.

Carefully read this resume and evaluate it HONESTLY:

{resume_text}

Return ONLY a valid JSON object. No markdown, no explanation, no extra text:
{{"verdict": "Entry Level", "reasoning": "one line"}}

STRICT VERDICT RULES — be REALISTIC and HARSH:

🏭 Entry Level (most freshers — be honest):
- No real internship OR only irrelevant/unpaid internship
- Only tutorial projects (todo app, weather app, calculator, basic CRUD)
- CGPA below 7.0
- No evidence of DSA practice
- No deployed projects with real users
- Generic resume with no standout achievements

🚀 Startup Ready (decent profile):
- At least 1 real technical internship
- OR 2-3 good projects with some complexity (not just tutorials)
- CGPA 7.0 to 8.5
- Some DSA practice mentioned (LeetCode, HackerRank)
- At least 1 deployed/live project
- Reasonable tech stack

💰 Product Company Ready (strong profile — rare):
- Good internship at known company (mid-size or above)
- OR multiple strong deployed projects with real impact
- CGPA 8.0+
- Active DSA with decent problem count
- Strong diverse tech stack
- Hackathon wins OR open source contributions
- Clear quantified achievements

🌟 FAANG Possible (extremely rare — top 2% only):
- Internship at top-tier company (Google, Microsoft, Amazon, Meta, Apple, Flipkart, Uber, Goldman Sachs etc)
- CGPA 9.0+
- Exceptional DSA (LeetCode 300+ OR Codeforces 1500+ rating)
- Multiple impressive projects with real users and metrics
- Open source contributions with stars/impact
- Research papers OR patents OR exceptional hackathon wins

IMPORTANT RULES:
- Most Indian CS freshers are Entry Level or Startup Ready — be realistic
- Do NOT give Product Company Ready or FAANG just because resume looks busy
- If no internship and only basic projects → Entry Level regardless of CGPA
- If CGPA is 8+ but no internship and weak projects → Startup Ready at most
- Only give FAANG if you see truly exceptional signals"""

ROAST_PROMPT = """
{personality_prompt}

LANGUAGE RULE (STRICTLY FOLLOW): {lang_instruction}

VERDICT (DO NOT CHANGE THIS): {python_verdict}

Here is the resume:
{resume_text}

Give your roast in this EXACT format:

🔥 THE ROAST
[2-3 savage funny opening lines specific to THIS resume. Reference actual content from the resume.]

💀 HALL OF SHAME (Top 3 Brutal Mistakes)
1. [Specific mistake found in THIS resume - be specific, reference actual content]
2. [Specific mistake found in THIS resume - be specific, reference actual content]
3. [Specific mistake found in THIS resume - be specific, reference actual content]

✅ OKAY FINE, THIS IS DECENT
[2-3 genuinely good things from THIS resume - be honest and specific]

📈 GLOW UP GUIDE (5 Specific Fixes)
1. [Actionable fix specific to THIS resume with clear action]
2. [Actionable fix specific to THIS resume with clear action]
3. [Actionable fix specific to THIS resume with clear action]
4. [Actionable fix specific to THIS resume with clear action]
5. [Actionable fix specific to THIS resume with clear action]

🎯 FINAL VERDICT
{python_verdict}
[2 sentences explaining why in your character's voice]
"""


def evaluate_resume_with_ai(resume_text):
    """Use AI to accurately evaluate resume verdict — much better than keyword matching"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "user",
                "content": EVALUATION_PROMPT.format(resume_text=resume_text[:3000])
            }],
            max_tokens=150,
            temperature=0.1,
        )

        eval_text = response.choices[0].message.content.strip()
        eval_text = re.sub(r'```json|```', '', eval_text).strip()
        json_match = re.search(r'\{.*\}', eval_text, re.DOTALL)

        if json_match:
            eval_data = json.loads(json_match.group())
            verdict = eval_data.get('verdict', 'Entry Level')

            if 'FAANG' in verdict:
                return "🌟 FAANG Possible"
            elif 'Product' in verdict:
                return "💰 Product Company Ready"
            elif 'Startup' in verdict:
                return "🚀 Startup Ready"
            else:
                return "🏭 Entry Level"

    except Exception as e:
        print(f"AI evaluation failed: {e}")

    return "🏭 Entry Level"


def calculate_ats_score(resume_text):
    """
    ATS Score — Python rule-based for consistency.
    Real ATS systems care about: keywords, action verbs, metrics, contact info.
    Most freshers fail on METRICS — the biggest differentiator.
    Max score breakdown:
    - Technical keywords: 20
    - Action verbs: 15
    - Quantified metrics: 35 (most important — most people have ZERO)
    - Contact info: 10
    - Education: 5
    - Sections: 5
    - Penalties: up to -25
    Total max: 90 (realistic ceiling for even great resumes)
    """
    text_lower = resume_text.lower()
    score = 0

    # Technical keywords (max +20)
    tech_keywords = [
        'python', 'java', 'javascript', 'react', 'node', 'sql', 'aws',
        'docker', 'git', 'api', 'machine learning', 'deep learning',
        'flask', 'django', 'mongodb', 'mysql', 'postgresql', 'typescript',
        'kubernetes', 'rest', 'graphql', 'redis', 'linux', 'c++',
        'kotlin', 'swift', 'tensorflow', 'pytorch', 'spring', 'express',
        'nextjs', 'vue', 'angular', 'firebase', 'fastapi'
    ]
    keyword_count = sum(1 for k in tech_keywords if k in text_lower)
    if keyword_count >= 12: score += 20
    elif keyword_count >= 8: score += 15
    elif keyword_count >= 5: score += 10
    elif keyword_count >= 3: score += 5
    else: score += 0

    # Action verbs (max +15)
    action_verbs = [
        'developed', 'built', 'designed', 'implemented', 'created',
        'led', 'managed', 'optimized', 'improved', 'deployed',
        'architected', 'engineered', 'launched', 'delivered', 'reduced',
        'increased', 'automated', 'integrated', 'maintained', 'collaborated',
        'developed', 'spearheaded', 'streamlined', 'established', 'achieved'
    ]
    verb_count = sum(1 for v in action_verbs if v in text_lower)
    if verb_count >= 10: score += 15
    elif verb_count >= 7: score += 11
    elif verb_count >= 4: score += 7
    elif verb_count >= 2: score += 3
    else: score += 0

    # Quantified metrics (max +35 — MOST IMPORTANT)
    # Real ATS systems heavily reward numbers and metrics
    # Most freshers score 0 here — this is the biggest differentiator
    metrics = re.findall(
        r'\d+%'           # percentages (improved by 40%)
        r'|\d+x'          # multipliers (3x faster)
        r'|\d+\+'         # plus numbers (100+ users)
        r'|\$\d+'         # dollar amounts
        r'|\d+\s*(?:users|requests|ms|seconds|hours|lines|commits|stars|k\b|lakh|crore|million|thousand)',
        text_lower
    )
    unique_metrics = len(set(metrics))
    if unique_metrics >= 8: score += 35
    elif unique_metrics >= 5: score += 25
    elif unique_metrics >= 3: score += 15
    elif unique_metrics >= 1: score += 8
    else: score += 0  # No metrics = 0, huge penalty effectively

    # Contact info (max +10)
    if '@' in text_lower: score += 4
    if 'linkedin' in text_lower: score += 3
    if 'github' in text_lower: score += 3

    # Education (max +5)
    if any(x in text_lower for x in ['b.tech', 'b.e', 'bachelor', 'computer science', 'engineering', 'bsc']):
        score += 5

    # Sections present (max +5)
    if 'experience' in text_lower or 'internship' in text_lower: score += 3
    if 'project' in text_lower: score += 2

    # PENALTIES — real ATS systems penalize these
    if 'objective' in text_lower: score -= 8      # Outdated section
    if 'hobbies' in text_lower: score -= 8        # Irrelevant to ATS
    if 'reference' in text_lower: score -= 5      # Waste of space
    if 'ms word' in text_lower: score -= 5        # Listing basic tools
    if 'ms office' in text_lower: score -= 5      # Same
    if 'microsoft office' in text_lower: score -= 5
    if 'listening to music' in text_lower: score -= 3
    if 'watching movies' in text_lower: score -= 3

    return max(0, min(100, score))


def extract_text_from_pdf(pdf_bytes):
    """Extract text content from PDF"""
    reader = PdfReader(io.BytesIO(pdf_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()


@app.route("/api/roast", methods=["POST"])
def roast_resume():
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["resume"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Please upload a PDF file"}), 400

    language = request.form.get("language", "english")
    personality = request.form.get("personality", "default")

    try:
        pdf_bytes = file.read()
        resume_text = extract_text_from_pdf(pdf_bytes)

        if len(resume_text) < 100:
            return jsonify({"error": "Could not extract text from PDF. Make sure it's not a scanned image."}), 400

        lang_instruction = LANG_INSTRUCTIONS.get(language, LANG_INSTRUCTIONS["english"])
        personality_prompt = PERSONALITY_PROMPTS.get(personality, PERSONALITY_PROMPTS["default"])

        # AI evaluates verdict — holistic understanding
        python_verdict = evaluate_resume_with_ai(resume_text)

        # Python calculates ATS — consistent rule-based
        python_ats = calculate_ats_score(resume_text)

        # Build roast prompt
        prompt = ROAST_PROMPT.format(
            personality_prompt=personality_prompt,
            lang_instruction=lang_instruction,
            python_verdict=python_verdict,
            resume_text=resume_text[:4000]
        )

        # AI generates roast text
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.7,
        )

        roast_text = response.choices[0].message.content

        return jsonify({
            "roast": roast_text,
            "success": True,
            "verdict": python_verdict,
            "ats_score": python_ats,
        })

    except Exception as e:
        return jsonify({"error": f"Something went wrong: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
