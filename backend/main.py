from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from math import pow

app = FastAPI()

# CORS (VERY IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class LoanRequest(BaseModel):
    name: str
    loan_amount: float
    tenure_months: int
    monthly_salary: float
    credit_score: int
    pan: str

# Response model
class LoanResponse(BaseModel):
    status: str
    reason: str
    emi: float

@app.post("/evaluate-loan", response_model=LoanResponse)
def evaluate_loan(data: LoanRequest):

    # Simple PAN validation
    if len(data.pan) != 10:
        return LoanResponse(
            status="Rejected",
            reason="Invalid PAN number",
            emi=0
        )

    # Credit score rule
    if data.credit_score < 650:
        return LoanResponse(
            status="Rejected",
            reason="Low credit score",
            emi=0
        )

    # EMI calculation
    annual_rate = 10
    r = annual_rate / (12 * 100)
    n = data.tenure_months

    emi = (
        data.loan_amount
        * r
        * pow(1 + r, n)
        / (pow(1 + r, n) - 1)
    )

    # Salary check
    if emi > data.monthly_salary * 0.4:
        return LoanResponse(
            status="Rejected",
            reason="EMI exceeds 40% of salary",
            emi=round(emi, 2),
        )

    return LoanResponse(
        status="Approved",
        reason="Loan approved successfully",
        emi=round(emi, 2),
    )
