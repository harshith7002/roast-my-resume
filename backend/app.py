from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import fitz  # PyMuPDF
import os
import re

app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

ROAST_PROMPT = """You are a brutally honest but hilarious Indian senior software engineer who has seen thousands of fresher resumes. You roast resumes in a funny, savage but ultimately helpful way. You understand the Indian CS student context deeply.

You understand:
- CGPA grading systems (out of 10), tier 1/2/3 college dynamics
- Common desi resume mistakes (listing MS Word as a skill, "hobbies: listening to music, watching movies")
- Indian IT job market: TCS/Infosys/Wipro vs product startups vs FAANG/MAANG
- Internship culture, hackathons, competitive programming in India
- The struggle of being from a tier 2/3 college trying to get good placements

Here is the resume text:
{resume_text}

Now give your roast in this EXACT format (use emojis, be funny but genuinely helpful):

🔥 THE ROAST
[2-3 savage but funny opening lines roasting the overall resume. Use Hinglish if it feels natural. Be creative and specific to what you see.]

💀 HALL OF SHAME (Top 3 Brutal Mistakes)
1. [Specific mistake from resume - be funny and savage]
2. [Specific mistake from resume - be funny and savage]  
3. [Specific mistake from resume - be funny and savage]

✅ OKAY FINE, THIS IS DECENT
[2-3 things that are actually good or show potential. Be genuine here.]

📈 GLOW UP GUIDE (5 Specific Fixes)
1. [Specific actionable improvement]
2. [Specific actionable improvement]
3. [Specific actionable improvement]
4. [Specific actionable improvement]
5. [Specific actionable improvement]

🎯 FINAL VERDICT
[Pick ONE and explain why in 2 sentences:]
- 🏭 TCS/Infosys Material (service company level)
- 🚀 Startup Ready (good enough for funded startups)  
- 💰 Product Company Ready (Amazon, Flipkart, Swiggy level)
- 🌟 FAANG Possible (with the fixes above)"""


def extract_text_from_pdf(pdf_bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
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

    try:
        pdf_bytes = file.read()
        resume_text = extract_text_from_pdf(pdf_bytes)

        if len(resume_text) < 100:
            return jsonify({"error": "Could not extract text from PDF. Make sure it's not a scanned image."}), 400

        prompt = ROAST_PROMPT.format(resume_text=resume_text[:4000])
        response = model.generate_content(prompt)
        roast_text = response.text

        return jsonify({"roast": roast_text, "success": True})

    except Exception as e:
        return jsonify({"error": f"Something went wrong: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
