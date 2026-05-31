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
    "hinglish": "Write in Hinglish — a fun natural mix of Hindi and English the way Indian college students actually talk.",
    "tanglish": "Write in Tanglish — a fun natural mix of Tamil and English the way Tamil people actually speak.",
    "tenglish": "Write in Tenglish — a fun natural mix of Telugu and English the way Telugu people actually speak.",
    "benglish": "Write in Benglish — a fun natural mix of Bengali and English the way Bengali people actually speak.",
    "manglish": "Write in Manglish — a fun natural mix of Malayalam and English the way Malayali people actually speak.",
    "kanglish": "Write in Kanglish — a fun natural mix of Kannada and English the way Kannada people actually speak.",
    "punglish": "Write in Punglish — a fun natural mix of Punjabi and English the way Punjabi people actually speak.",
    "marathish": "Write in a fun natural mix of Marathi and English the way Marathi people actually speak.",
    "gujarish": "Write in a fun natural mix of Gujarati and English the way Gujarati people actually speak.",
    "orish": "Write in a fun natural mix of Odia and English the way Odia people actually speak.",
    "assamese": "Write in a fun natural mix of Assamese and English the way Assamese people actually speak.",
}

PERSONALITY_PROMPTS = {
    "default": """You are a brutally honest but hilarious senior software engineer who has seen thousands of fresher resumes. You roast resumes in a funny, savage but ultimately helpful way. No Hindi words unless the language instruction says so.""",
    "gordon": """You are Gordon Ramsay, but instead of reviewing food, you are reviewing a resume. Be ABSOLUTELY SAVAGE. Use ALL CAPS for emphasis. Use phrases like "THIS IS RAW!", "YOU DONKEY!", "BLOODY HELL!", "This resume is so bad it makes me want to THROW IT IN THE BIN!". No Hindi words unless the language instruction says so.""",
    "parent": """You are a stereotypically disappointed parent reviewing their child's resume. Use phrases like "Why only 7.5 GPA? Your cousin is already at Google!", "We spent so much on your education and THIS is what you give us?". IMPORTANT: Only use Hindi words like 'beta' if the language instruction says Hinglish. For English mode, use only English.""",
    "techbro": """You are a passive-aggressive Silicon Valley Tech Bro recruiter. Use corporate jargon: "leverage", "disruptive", "bandwidth", "circle back", "move the needle", "synergy". Say things like "This resume lacks the disruptive energy we're looking for." No Hindi words unless the language instruction says so.""",
    "senior": """You are a toxic burnt-out senior developer with 15 years experience. Say things like "I rewrote this in a weekend", "We don't use that framework anymore", "Junior mistake", "Did you even Google this?". No Hindi words unless the language instruction says so.""",
}

# AI evaluation prompt — much more accurate than Python keywords
EVALUATION_PROMPT = """You are an expert Indian placement counselor with 10+ years experience evaluating thousands of resumes.

Carefully read this resume and evaluate it:

{resume_text}

Return ONLY a valid JSON object with NO extra text, NO markdown, NO explanation:
{{
  "verdict": "Entry Level",
  "ats_score": 45,
  "reasoning": "one line explanation"
}}

STRICT RULES for verdict — be REALISTIC and HARSH:

Entry Level (most freshers fall here):
- No internship OR only irrelevant internship
- Only tutorial projects (todo app, weather app, calculator)
- CGPA below 7.0
- No DSA practice
- No deployed projects

Startup Ready (decent but not exceptional):
- At least 1 real internship OR 2-3 good projects
- CGPA 7.0 to 8.0
- Some DSA practice (LeetCode mentioned)
- At least 1 deployed project
- Basic tech stack

Product Company Ready (strong profile):
- Good internship at known company OR multiple strong deployed projects
- CGPA 8.0+
- Active DSA practice with good problem count
- Strong tech stack with real projects
- Open source OR hackathon wins

FAANG Possible (extremely rare — top 2% of freshers):
- Internship at top company (Google, Microsoft, Amazon, Meta, Flipkart, Uber etc)
- CGPA 9.0+
- Exceptional DSA (LeetCode 300+ or Codeforces 1600+)
- Multiple impressive deployed projects with real users
- Open source contributions

ATS Score rules (0-100):
- Check for technical keywords relevant to job market
- Check for action verbs (developed, built, implemented, optimized)
- Check for quantified metrics (%, numbers, user counts)
- Check for proper contact info, LinkedIn, GitHub
- Penalize: objective sections, hobbies, references, no metrics

IMPORTANT: Most Indian CS freshers are Entry Level or Startup Ready. Be realistic!"""

ROAST_PROMPT = """
{personality_prompt}

LANGUAGE RULE (STRICTLY FOLLOW): {lang_instruction}

VERDICT (DO NOT CHANGE): {python_verdict}

Resume text:
{resume_text}

Give your roast in this EXACT format:

🔥 THE ROAST
[2-3 savage funny opening lines specific to THIS resume]

💀 HALL OF SHAME (Top 3 Brutal Mistakes)
1. [Specific mistake from THIS resume]
2. [Specific mistake from THIS resume]
3. [Specific mistake from THIS resume]

✅ OKAY FINE, THIS IS DECENT
[2-3 good things from THIS resume]

📈 GLOW UP GUIDE (5 Specific Fixes)
1. [Actionable fix specific to THIS resume]
2. [Actionable fix specific to THIS resume]
3. [Actionable fix specific to THIS resume]
4. [Actionable fix specific to THIS resume]
5. [Actionable fix specific to THIS resume]

🎯 FINAL VERDICT
{python_verdict}
[2 sentences explaining why in your character's voice]
"""


def evaluate_resume_with_ai(resume_text):
    """Use AI to accurately evaluate resume — much better than keyword matching"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "user",
                "content": EVALUATION_PROMPT.format(resume_text=resume_text[:3000])
            }],
            max_tokens=300,
            temperature=0.1,  # Very low for consistency
        )

        eval_text = response.choices[0].message.content.strip()
        # Clean any markdown
        eval_text = re.sub(r'```json|```', '', eval_text).strip()
        # Extract JSON
        json_match = re.search(r'\{.*\}', eval_text, re.DOTALL)
        if json_match:
            eval_data = json.loads(json_match.group())
            verdict = eval_data.get('verdict', 'Startup Ready')
            ats_score = int(eval_data.get('ats_score', 50))
            ats_score = max(0, min(100, ats_score))

            # Format verdict with emoji
            if 'FAANG' in verdict:
                formatted_verdict = "🌟 FAANG Possible"
            elif 'Product' in verdict:
                formatted_verdict = "💰 Product Company Ready"
            elif 'Startup' in verdict:
                formatted_verdict = "🚀 Startup Ready"
            else:
                formatted_verdict = "🏭 Entry Level"

            return formatted_verdict, ats_score

    except Exception as e:
        print(f"AI evaluation failed: {e}")

    # Fallback to basic Python if AI fails
    return "🚀 Startup Ready", 50


def extract_text_from_pdf(pdf_bytes):
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

        # AI evaluates verdict and ATS accurately
        python_verdict, python_ats = evaluate_resume_with_ai(resume_text)

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
            "ats_score": python_ats
        })

    except Exception as e:
        return jsonify({"error": f"Something went wrong: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
