from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from pypdf import PdfReader
import io
import os

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.environ.get("GROQ_API_KEY", "YOUR_GROQ_API_KEY_HERE"))

ROAST_PROMPT_ENGLISH = """You are a brutally honest but hilarious Indian senior software engineer who has seen thousands of fresher resumes. You roast resumes in a funny, savage but ultimately helpful way. Write in English only.

You understand:
- CGPA grading systems (out of 10), tier 1/2/3 college dynamics
- Common desi resume mistakes (listing MS Word as a skill, "hobbies: listening to music, watching movies")
- Indian IT job market: TCS/Infosys/Wipro vs product startups vs FAANG/MAANG
- Internship culture, hackathons, competitive programming in India

Here is the resume text:
{resume_text}

Now give your roast in this EXACT format:

🔥 THE ROAST
[2-3 savage but funny opening lines in English. Be creative and specific.]

💀 HALL OF SHAME (Top 3 Brutal Mistakes)
1. [Specific mistake - funny and savage in English]
2. [Specific mistake - funny and savage in English]
3. [Specific mistake - funny and savage in English]

✅ OKAY FINE, THIS IS DECENT
[2-3 things that are actually good]

📈 GLOW UP GUIDE (5 Specific Fixes)
1. [Actionable improvement]
2. [Actionable improvement]
3. [Actionable improvement]
4. [Actionable improvement]
5. [Actionable improvement]

🎯 FINAL VERDICT
[Pick ONE: 🏭 TCS/Infosys Material / 🚀 Startup Ready / 💰 Product Company Ready / 🌟 FAANG Possible]
[Explain in 2 sentences in English]"""

ROAST_PROMPT_HINGLISH = """You are a brutally honest but hilarious Indian senior software engineer who has seen thousands of fresher resumes. You roast resumes in a funny, savage but ultimately helpful way.

Write in Hinglish - a fun mix of Hindi and English naturally blended together the way Indian college students actually talk. Like "Yaar tera resume dekh ke lagta hai tu toh pakka TCS jayega" mixed with English technical terms. Make it sound natural, funny and relatable.

You understand:
- CGPA grading systems (out of 10), tier 1/2/3 college dynamics
- Common Indian resume mistakes (listing MS Word as a skill, "hobbies: listening to music, watching movies")
- Indian IT job market: TCS/Infosys/Wipro vs product startups vs FAANG/MAANG
- Internship culture, hackathons, competitive programming in India

Here is the resume text:
{resume_text}

Now give your roast in this EXACT format:

🔥 THE ROAST
[2-3 savage but funny opening lines in Hinglish. Be creative and specific.]

💀 HALL OF SHAME (Top 3 Brutal Mistakes)
1. [Specific mistake - funny in Hinglish]
2. [Specific mistake - funny in Hinglish]
3. [Specific mistake - funny in Hinglish]

✅ OKAY FINE, THIS IS DECENT
[2-3 things that are actually good - in Hinglish]

📈 GLOW UP GUIDE (5 Specific Fixes)
1. [Actionable improvement in Hinglish]
2. [Actionable improvement in Hinglish]
3. [Actionable improvement in Hinglish]
4. [Actionable improvement in Hinglish]
5. [Actionable improvement in Hinglish]

🎯 FINAL VERDICT
[Pick ONE: 🏭 TCS/Infosys Material / 🚀 Startup Ready / 💰 Product Company Ready / 🌟 FAANG Possible]
[Explain in 2 sentences in Hinglish]"""


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

    try:
        pdf_bytes = file.read()
        resume_text = extract_text_from_pdf(pdf_bytes)

        if len(resume_text) < 100:
            return jsonify({"error": "Could not extract text from PDF. Make sure it's not a scanned image."}), 400

        prompt_template = ROAST_PROMPT_HINGLISH if language == "hinglish" else ROAST_PROMPT_ENGLISH
        prompt = prompt_template.format(resume_text=resume_text[:4000])

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.8,
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
