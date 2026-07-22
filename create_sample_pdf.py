# Python script to generate a standard, valid PDF document (PDF 1.4 format)
# containing a complete sample Trainee Registration Form.

import os

def generate_pdf():
    pdf_filename = os.path.join(os.getcwd(), "sample_trainee_registration_form.pdf")

    # Define printable lines for the PDF form
    text_lines = [
      "TRAINEE REGISTRATION FORM",
      "TECHNICAL TRAINING CENTER (TTC)",
      "--------------------------------------------------------------------------------",
      "PERSONAL INFORMATION",
      "Username: student_rakib",
      "Full Name [English]: Md. Rakibul Islam",
      "Full Name [Bangla]: Md. Rakibul Islam",
      "Father's Name: Md. Rafiqul Islam",
      "Father's Occupation: Business",
      "Mother's Name: Parvin Akter",
      "Mother's Occupation: Housewife",
      "Date of Birth: 15/08/1998",
      "Gender: Male",
      "NID: 19982692012345678",
      "Religion: Islam",
      "Blood Group: A+",
      "Marital Status: Single",
      "Personal With Disability (PWD): No",
      "--------------------------------------------------------------------------------",
      "CONTACT INFORMATION",
      "Contact Number: 01712345678",
      "Emergency Contact No: 01812345679",
      "Email Address: rakib.islam@gmail.com",
      "--------------------------------------------------------------------------------",
      "PERMANENT ADDRESS",
      "Permanent Division: Dhaka",
      "Permanent District: Dhaka",
      "Permanent Upazila: Savar",
      "Permanent Post Office: Savar",
      "Rural / Urban: Urban",
      "Permanent Address: House 12, Road 4, Savar, Dhaka",
      "--------------------------------------------------------------------------------",
      "PRESENT ADDRESS",
      "Present Division: Dhaka",
      "Present District: Dhaka",
      "Present Upazila: Mirpur",
      "Present Post Office: Mirpur 10",
      "Present Address: House 45, Block C, Mirpur 10, Dhaka",
      "--------------------------------------------------------------------------------",
      "EDUCATIONAL & EMPLOYMENT DETAILS",
      "Highest Educational Level: Bachelor",
      "Board/University: Dhaka University",
      "Highest Education Institute Name: Dhaka Polytechnic Institute",
      "Highest Education Passing Year: 2020",
      "TVET Certificate: Yes",
      "Ethnic Minority: No",
      "Employment Status: Employed",
      "Company Name: Tech Solutions Ltd",
      "Designation: Junior Assistant",
      "Amount of Monthly Income: 25000",
      "Course: Industrial Automation",
      "Trade: Electrical",
      "Nationality: Bangladeshi",
      "Remarks: All original documents verified",
      "--------------------------------------------------------------------------------"
    ]

    # Build PDF stream instructions
    stream_content = []
    stream_content.append("BT")
    stream_content.append("/F1 11 Tf")
    
    y = 800
    for line in text_lines:
        # Escape parenthesis
        safe_line = line.replace("(", "\\(").replace(")", "\\)")
        if "FORM" in line or "CENTER" in line:
            stream_content.append(f"/F1 14 Tf")
            stream_content.append(f"50 {y} Td ({safe_line}) Tj")
            stream_content.append(f"/F1 10 Tf")
        elif "INFORMATION" in line or "ADDRESS" in line or "DETAILS" in line:
            stream_content.append(f"/F1 11 Tf")
            stream_content.append(f"1 0 0 1 50 {y} Tm ({safe_line}) Tj")
            stream_content.append(f"/F1 9 Tf")
        else:
            stream_content.append(f"1 0 0 1 50 {y} Tm ({safe_line}) Tj")
        y -= 14
        if y < 40:
            y = 800

    stream_content.append("ET")
    stream_str = "\n".join(stream_content)
    stream_bytes = stream_str.encode("latin-1")

    # PDF Object Structure
    obj1 = b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    obj2 = b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    obj3 = b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n"
    obj4 = b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
    obj5_header = f"5 0 obj\n<< /Length {len(stream_bytes)} >>\nstream\n".encode("latin-1")
    obj5_footer = b"\nendstream\nendobj\n"

    pdf_body = b"%PDF-1.4\n" + obj1 + obj2 + obj3 + obj4 + obj5_header + stream_bytes + obj5_footer
    
    with open(pdf_filename, "wb") as f:
        f.write(pdf_body)

    print(f"Successfully generated: {pdf_filename} ({len(pdf_body)} bytes)")

if __name__ == "__main__":
    generate_pdf()
