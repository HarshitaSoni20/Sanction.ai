

from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

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
os.makedirs("backend/sanctions", exist_ok=True)
os.makedirs("backend/uploads", exist_ok=True)

# Serve sanction letters
app.mount(
    "/sanctions",
    StaticFiles(directory="backend/sanctions"),
    name="sanctions"
)

# -------------------- MODELS --------------------
class LoanRequest(BaseModel):
    name: str
    pan: str
    loan_amount: int
    tenure_months: int
    monthly_salary: int
    credit_score: int
    salary_slip_uploaded: bool = False


# -------------------- SALARY SLIP UPLOAD --------------------
@app.post("/upload-salary-slip")
async def upload_salary_slip(file: UploadFile = File(...)):
    file_path = os.path.join("backend/uploads", file.filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    return {
        "status": "Uploaded",
        "filename": file.filename
    }


# -------------------- MAIN LOAN FLOW --------------------
@app.post("/evaluate-loan")
@app.post("/evaluate-loan")
def evaluate_loan(data: LoanRequest):

    # 1️⃣ MASTER AGENT
    sales_context = master_agent({
        "intent": "personal_loan",
        "amount": data.loan_amount,
        "tenure": data.tenure_months,
        "customer_type": "existing"
    })

    # 2️⃣ PAN VERIFICATION
    if not verify_pan(data.pan):
        return {
            "status": "Rejected",
            "reason": "PAN verification failed"
        }

    # 3️⃣ UNDERWRITING
    decision = underwrite(
        loan_amount=data.loan_amount,
        salary=data.monthly_salary,
        credit_score=data.credit_score,
        salary_slip_uploaded=data.salary_slip_uploaded
    )

    # ⏸ Salary slip required
    if decision["status"] == "Pending":
        return decision

    # ❌ Rejected
    if decision["status"] == "Rejected":
        return decision

    # ✅ Approved → Generate sanction letter
    filename = generate_sanction(data.name, data.loan_amount)

    return {
        "status": "Approved",
        "emi": decision["emi"],
        "message": sales_context,
        "sanction_letter": f"sanctions/{filename}"
    }
