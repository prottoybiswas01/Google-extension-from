import io
import re
import base64
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import numpy as np

app = FastAPI(
    title="TTC Form Auto-Fill Local Python OCR Engine",
    description="Free, Offline Local Python OCR & Form Field Extraction Service",
    version="1.0.0",
)

# Enable CORS for Chrome Extension requests (chrome-extension:// origins & localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Lazy-loaded EasyOCR Reader
reader = None

def get_ocr_reader():
    global reader
    if reader is None:
        try:
            import easyocr
            print("[Python OCR Engine] Initializing EasyOCR for Bengali ('bn') and English ('en')...")
            reader = easyocr.Reader(['bn', 'en'], gpu=False)
            print("[Python OCR Engine] EasyOCR loaded successfully!")
        except Exception as e:
            print(f"[Python OCR Engine Warning] EasyOCR failed to load: {e}. Will fallback to basic text processing.")
            reader = False
    return reader


class Base64ExtractRequest(BaseModel):
    image: str  # Base64 data URL or raw base64 string
    text: Optional[str] = None


FIELD_REGEX_PATTERNS = [
    ("student_name", [
        r"(?:full\s*name\s*\[?english\]?|student\s*name|applicant\s*name|name\s*of\s*student|শিক্ষার্থীর\s*নাম|নাম)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([A-Za-z0-9.\s]{2,60})",
        r"Student\s*Name\s*(?:\([^)]*\))?\s*([^\n]+)",
    ]),
    ("name_bangla", [
        r"(?:full\s*name\s*\[?bangla\]?|বাংলায়\s*নাম|নাম\s*\(বাংলা\))\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("username", [
        r"(?:username|user\s*name|ইউজারনেম)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([a-zA-Z0-9_.\-]{3,30})",
    ]),
    ("father_name", [
        r"(?:father'?s?\s*name(?:\s*\[english\])?|father\s*name|পিতার\s*নাম|বাবার\s*নাম)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([A-Za-z0-9.\s]{2,60})",
        r"Father's\s*Name\s*(?:\([^)]*\))?\s*([^\n]+)",
    ]),
    ("father_occupation", [
        r"(?:father'?s?\s*occupation|পিতার\s*পেশা|বাবার\s*পেশা)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("mother_name", [
        r"(?:mother'?s?\s*name(?:\s*\[english\])?|mother\s*name|মাতার\s*নাম|মার\s*নাম)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([A-Za-z0-9.\s]{2,60})",
        r"Mother's\s*Name\s*(?:\([^)]*\))?\s*([^\n]+)",
    ]),
    ("mother_occupation", [
        r"(?:mother'?s?\s*occupation|মাতার\s*পেশা|মার\s*পেশা)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("phone", [
        r"(?:contact\s*number|phone|mobile|tel|মোবাইল|ফোন)\s*(?:\/[^:\n]+)?\s*(?:\([^)]*\))?\s*[:;\-\s]\s*(\+?[0-9\s\-]{10,18})",
        r"(\+?880\s*1[3-9][0-9\s\-]{8,12})",
        r"(01[3-9][0-9\s\-]{8,10})",
    ]),
    ("emergency_contact", [
        r"(?:emergency\s*contact(?:\s*no)?|জরুরী\s*যোগাযোগ)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*(\+?[0-9\s\-]{10,18})",
    ]),
    ("email", [
        r"(?:email|e-mail|ইমেইল)\s*(?:address)?\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})",
        r"([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})",
    ]),
    ("date_of_birth", [
        r"(?:date\s*of\s*birth|dob|birth\s*date|জন্ম\s*তারিখ)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([0-9]{1,4}\s+[A-Za-z]+\s+[0-9]{2,4}|[0-9]{1,4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,4})",
    ]),
    ("gender", [
        r"(?:gender|sex|লিঙ্গ)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*(Male|Female|Other|পুরুষ|মহিলা)",
    ]),
    ("nid", [
        r"(?:nid|birth\s*certificate|passport|national\s*id|brn|identity\s*no|জাতীয়\s*পরিচয়পত্র)\s*(?:\/[^:\n]+)?\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([0-9]{10,18})",
        r"(\b[0-9]{10,18}\b)",
    ]),
    ("pwd", [
        r"(?:personal\s*with\s*disability|pwd|প্রতিবন্ধী)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*(Yes|No|হ্যাঁ|না)",
    ]),
    ("religion", [
        r"(?:religion|ধর্ম)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*(Islam|Hinduism|Christianity|Buddhism|ইসলাম|হিন্দু)",
    ]),
    ("blood_group", [
        r"(?:blood\s*group|রক্তের\s*গ্রুপ)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([ABO][\+\-](?:\s*\([^)]*\))?)",
    ]),
    ("marital_status", [
        r"(?:marital\s*status|বৈবাহিক\s*অবস্থা)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*(Single|Married|Unmarried|Divorced|অবিবাহিত|বিবাহিত)",
    ]),
    ("permanent_division", [
        r"(?:permanent\s*division|division)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([A-Za-z\s]+)",
    ]),
    ("permanent_district", [
        r"(?:permanent\s*district|district)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([A-Za-z\s]+)",
    ]),
    ("permanent_upazila", [
        r"(?:permanent\s*upazila|upazila|উপজেলা)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([A-Za-z\s]+)",
    ]),
    ("permanent_post_office", [
        r"(?:permanent\s*post\s*office|post\s*office|পোস্ট\s*অফিস)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("rural_urban", [
        r"(?:from\s*rural\s*or\s*urban\s*area|rural|urban)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*(Rural|Urban|গ্রাম|শহর)",
    ]),
    ("permanent_address", [
        r"(?:permanent\s*address|স্থায়ী\s*ঠিকানা)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("present_address", [
        r"(?:present\s*address|current\s*address|বর্তমান\s*ঠিকানা)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("board_university", [
        r"(?:board\/university|board|university|বোর্ড|বিশ্ববিদ্যালয়)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("education", [
        r"(?:highest\s*educational\s*level|qualification|education|degree)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("institute_name", [
        r"(?:highest\s*education\s*institute\s*name|institute\s*name|institution|প্রতিষ্ঠানের\s*নাম)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("passing_year", [
        r"(?:highest\s*education\s*passing\s*year|passing\s*year|পাশের\s*সাল)\s*(?:\([^)]*\))?\s*([0-9]{4})",
    ]),
    ("tvet_certificate", [
        r"(?:tvet\s*certificate)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*(Yes|No|হ্যাঁ|না)",
    ]),
    ("ethnic_minority", [
        r"(?:ethnic\s*minority|ক্ষুদ্র\s*নৃগোষ্ঠী)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*(Yes|No|হ্যাঁ|না)",
    ]),
    ("company_name", [
        r"(?:company\s*name|কোম্পানির\s*নাম)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("designation", [
        r"(?:designation|পদবী)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("skill_training_past", [
        r"(?:received\s*any\s*skill\s*training\s*in\s*the\s*past\??)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("employment_status", [
        r"(?:employment\s*status\s*before\s*training|employment\s*status)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("monthly_income", [
        r"(?:amount\s*of\s*monthly\s*income|monthly\s*income|মাসিক\s*আয়)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([0-9,.]+)",
    ]),
    ("course", [
        r"(?:course|program|কোর্স)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("trade", [
        r"(?:trade|department|technology|ট্রেড|ডিপার্টমেন্ট)\s*(?:\/[^:\n]+)?\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
    ("nationality", [
        r"(?:nationality|জাতীয়তা)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([A-Za-z]+|বাংলাদেশী)",
    ]),
    ("remarks", [
        r"(?:remarks|comments|মন্তব্য)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)",
    ]),
]


def extract_fields_from_text(raw_text: str) -> Dict[str, Optional[str]]:
    """Applies regex pattern matching over OCR lines to populate ExtractedFormData."""
    result: Dict[str, Optional[str]] = {
        "student_name": None, "father_name": None, "mother_name": None,
        "phone": None, "email": None, "date_of_birth": None, "gender": None,
        "nid": None, "present_address": None, "permanent_address": None,
        "course": None, "trade": None, "education": None, "blood_group": None,
        "religion": None, "nationality": None, "remarks": None,
        "username": None, "name_bangla": None, "emergency_contact": None,
        "password": None, "father_occupation": None, "mother_occupation": None,
        "pwd": None, "marital_status": None, "permanent_division": None,
        "permanent_district": None, "permanent_upazila": None,
        "permanent_post_office": None, "rural_urban": None,
        "present_division": None, "present_district": None,
        "present_upazila": None, "present_post_office": None,
        "board_university": None, "institute_name": None, "passing_year": None,
        "tvet_certificate": None, "ethnic_minority": None, "company_name": None,
        "designation": None, "skill_training_past": None,
        "employment_status": None, "monthly_income": None
    }

    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    full_text = "\n".join(lines)

    for field_key, patterns in FIELD_REGEX_PATTERNS:
        for pat in patterns:
            match = re.search(pat, full_text, re.IGNORECASE)
            if match and match.group(1):
                val = match.group(1).strip()
                if val and not result[field_key]:
                    result[field_key] = val
                    break

        if not result[field_key]:
            for line in lines:
                for pat in patterns:
                    match = re.search(pat, line, re.IGNORECASE)
                    if match and match.group(1):
                        val = match.group(1).strip()
                        if val:
                            result[field_key] = val
                            break
                if result[field_key]:
                    break

    return result


def process_pil_image(image: Image.Image, additional_text: str = "") -> Dict[str, Any]:
    """Runs EasyOCR or text extraction over PIL Image and parses form fields."""
    ocr_lines = []
    ocr_engine = get_ocr_reader()

    if ocr_engine:
        try:
            img_np = np.array(image.convert('RGB'))
            ocr_results = ocr_engine.readtext(img_np)
            for res in ocr_results:
                if len(res) >= 2 and res[1]:
                    ocr_lines.append(res[1])
        except Exception as e:
            print(f"[Python OCR] Error during OCR reading: {e}")

    if additional_text:
        ocr_lines.append(additional_text)

    combined_text = "\n".join(ocr_lines)
    extracted_data = extract_fields_from_text(combined_text)

    return {
        "success": True,
        "extracted_text": combined_text,
        "data": extracted_data
    }


@app.get("/api/health")
def health_check():
    ocr_status = "Available (EasyOCR)" if get_ocr_reader() else "Fallback (Regex Text Parsing)"
    return {
        "status": "ok",
        "service": "TTC Form Auto-Fill Local Python Engine",
        "ocr_engine": ocr_status
    }


@app.post("/api/extract")
async def extract_from_file(
    file: Optional[UploadFile] = File(None),
    payload: Optional[Base64ExtractRequest] = Body(None)
):
    try:
        if file:
            contents = await file.read()
            # Check if file is PDF
            if file.filename and file.filename.lower().endswith('.pdf') or contents.startswith(b'%PDF'):
                try:
                    from pdf2image import convert_from_bytes
                    images = convert_from_bytes(contents)
                    if images:
                        res = process_pil_image(images[0])
                        return res
                except Exception as pdf_err:
                    print(f"[Python OCR] pdf2image warning: {pdf_err}. Attempting PyMuPDF/fitz fallback...")
                    try:
                        import fitz  # PyMuPDF
                        doc = fitz.open(stream=contents, filetype="pdf")
                        extracted_pdf_text = ""
                        for page in doc:
                            extracted_pdf_text += page.get_text() + "\n"
                        extracted_data = extract_fields_from_text(extracted_pdf_text)
                        return {
                            "success": True,
                            "extracted_text": extracted_pdf_text,
                            "data": extracted_data
                        }
                    except Exception as fitz_err:
                        print(f"[Python OCR] PyMuPDF warning: {fitz_err}")

            image = Image.open(io.BytesIO(contents))
            return process_pil_image(image)

        elif payload and payload.image:
            image_data = payload.image
            if "," in image_data:
                image_data = image_data.split(",")[1]
            img_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(img_bytes))
            return process_pil_image(image, additional_text=payload.text or "")

        elif payload and payload.text:
            extracted_data = extract_fields_from_text(payload.text)
            return {
                "success": True,
                "extracted_text": payload.text,
                "data": extracted_data
            }

        else:
            raise HTTPException(status_code=400, detail="No file or image payload provided.")

    except Exception as e:
        print(f"[Python OCR Server Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    print("=========================================================")
    print(" Starting TTC Local Python OCR Engine on http://127.0.0.1:5000")
    print(" Completely Free, Offline & Independent of Gemini/OpenAI API Keys!")
    print("=========================================================")
    uvicorn.run(app, host="127.0.0.1", port=5000)
