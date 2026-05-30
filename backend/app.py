from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from pypdf import PdfReader
import io
import os

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

    "senior": """You are a toxic, burnt-out senior developer with 15 years of experience who has zero patience. Say things like "I rewrote this in a weekend", "We don't use that framework anymore, that's so 2019", "Junior mistake", "Did you even Google this?", "Back in my day we didn't need tutorials for this", "This is giving me flashbacks to bad code reviews". Be condescending about every technology choice. No Hindi words unless the language instruction says so.""",
}

ROAST_PROMPT = """
{personality_prompt}

LANGUAGE RULE (STRICTLY FOLLOW): {lang_instruction}

You understand:
- CGPA grading systems (out of 10), college dynamics
- Common resume mistakes (listing MS Word as a skill, "hobbies: listening to music, watching movies")
- IT job market: service companies vs product startups vs FAANG/MAANG
- Internship culture, hackathons, competitive programming

Here is the resume text:
{resume_text}

Now give your roast in this EXACT format:

🔥 THE ROAST
[2-3 savage but funny opening lines in your character's voice. Be creative and specific to THIS resume.]

💀 HALL OF SHAME (Top 3 Brutal Mistakes)
1. [Specific mistake from THIS resume - funny and savage in your character's voice]
2. [Specific mistake from THIS resume - funny and savage in your character's voice]
3. [Specific mistake from THIS resume - funny and savage in your character's voice]

✅ OKAY FINE, THIS IS DECENT
[2-3 things that are actually good in THIS resume - still in character]

📈 GLOW UP GUIDE (5 Specific Fixes)
1. [Actionable improvement specific to THIS resume]
2. [Actionable improvement specific to THIS resume]
3. [Actionable improvement specific to THIS resume]
4. [Actionable improvement specific to THIS resume]
5. [Actionable improvement specific to THIS resume]

🎯 FINAL VERDICT
CRITICAL RULES FOR VERDICT:
- Base verdict ONLY on the actual resume quality you just analyzed
- Be REALISTIC and HONEST — most freshers are Entry Level or Startup Ready
- FAANG Possible = truly exceptional (top CGPA 9+, multiple strong projects, internships at good companies, strong DSA)
- Product Company Ready = strong profile (good projects, decent CGPA, some experience)
- Startup Ready = average profile (some projects, average CGPA, limited experience)  
- Entry Level = weak profile (few projects, low CGPA, no experience)
- Pick ONLY ONE. The verdict MUST match the quality of feedback you gave above.

Write EXACTLY in this format:
[ONE OF: 🏭 Entry Level / 🚀 Startup Ready / 💰 Product Company Ready / 🌟 FAANG Possible]
[2 sentences explaining why in your character's voice]
"""


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

        prompt = ROAST_PROMPT.format(
            personality_prompt=personality_prompt,
            lang_instruction=lang_instruction,
            resume_text=resume_text[:4000]
        )

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.7,
        )

        roast_text = response.choices[0].message.content
        return jsonify({"roast": roast_text, "success": True})

    except Exception as e:
        return jsonify({"error": f"Something went wrong: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
