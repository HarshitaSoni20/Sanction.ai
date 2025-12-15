
import os
import base64
from fastapi import FastAPI, UploadFile, File
# We remove StaticFiles because we aren't serving files from a folder anymore
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import your agents
from backend.agents.master_agent import master_agent
from backend.agents.verification_agent import verify_pan
from backend.agents.underwriting_agent import underwrite
from backend.agents.sanction_agent import generate_sanction

app = FastAPI(title="EY Agentic Loan AI")

# -------------------- CORS --------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- DIRECTORIES --------------------
# On Vercel, only /tmp is writable. We will use it for temporary processing.
UPLOAD_DIR = "/tmp" 
os.makedirs(UPLOAD_DIR, exist_ok=True)

# -------------------- MODELS --------------------
class LoanRequest(BaseModel):
    name: str
    pan: str
    loan_amount: int
    tenure_months: int
    monthly_salary: int
    credit_score: int
    salary_slip_uploaded: bool = False

# -------------------- HELPER: FILE TO BASE64 --------------------
def get_pdf_base64(filepath):
    """Reads a file and returns it as a base64 string"""
    if not os.path.exists(filepath):
        return None
    with open(filepath, "rb") as f:
        encoded_string = base64.b64encode(f.read()).decode('utf-8')
    return encoded_string

# -------------------- SALARY SLIP UPLOAD --------------------
@app.post("/upload-salary-slip")
async def upload_salary_slip(file: UploadFile = File(...)):
    # Save to /tmp on Vercel
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    return {
        "status": "Uploaded",
        "filename": file.filename
    }

# -------------------- MAIN LOAN FLOW --------------------
@app.post("/evaluate-loan")
def evaluate_loan(data: LoanRequest):
    # 1. Master Agent
    sales_context = master_agent({
        "intent": "personal_loan",
        "amount": data.loan_amount,
        "tenure": data.tenure_months,
        "customer_type": "existing"
    })

    # 2. PAN Verification
    if not verify_pan(data.pan):
        return {"status": "Rejected", "reason": "PAN verification failed"}

    # 3. Underwriting
    decision = underwrite(
        loan_amount=data.loan_amount,
        salary=data.monthly_salary,
        credit_score=data.credit_score,
        salary_slip_uploaded=data.salary_slip_uploaded
    )

    if decision["status"] == "Pending":
        return decision
    
    if decision["status"] == "Rejected":
        return decision

    # ✅ Approved -> Generate Sanction
    # IMPORTANT: Ensure your generate_sanction function saves to /tmp if possible, 
    # or just reads from wherever it saved.
    
    # Assuming generate_sanction returns the FILENAME (e.g. "Sanction_Harshita.pdf")
    # And assuming it saved it in "backend/sanctions" or similar.
    # We need to find that file. 
    filename = generate_sanction(data.name, data.loan_amount)
    
    # Try to find the file. Check your generate_sanction code to see where it saves!
    # If it saves to "backend/sanctions/", we look there.
    # Note: On Vercel, simple file writes might end up in the root or fail if folders don't exist.
    # ideally, update generate_sanction to use /tmp, but let's try to read it from relative path first.
    
    # PATH CHECK: Adjust this based on where your agent saves files
    possible_paths = [
        f"backend/sanctions/{filename}",
        f"sanctions/{filename}",
        f"/tmp/{filename}",
        filename
    ]
    
    pdf_base64 = None
    for path in possible_paths:
        if os.path.exists(path):
            pdf_base64 = get_pdf_base64(path)
            break
            
    return {
        "status": "Approved",
        "emi": decision["emi"],
        "message": sales_context,
        # We send the ACTUAL FILE DATA, not a link
        "sanction_letter_data": pdf_base64, 
        "filename": filename
    }