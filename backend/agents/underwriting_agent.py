from backend.utils.emi import calculate_emi


def underwrite(
    loan_amount: int,
    salary: int,
    credit_score: int,
    salary_slip_uploaded: bool
):
    """
    Underwriting rules:
    - EMI should not exceed 50% of salary
    - Credit score must be >= 650
    - High loan requires salary slip
    """

    # Credit score check
    if credit_score < 650:
        return {
            "status": "Rejected",
            "reason": "Low credit score"
        }

    # Calculate EMI (example: 12% annual = 1% monthly)
    emi = calculate_emi(
        loan_amount,
        0.01,           # monthly interest
        36              # tenure (months)
    )

    # EMI affordability
    if emi > 0.5 * salary:
        return {
            "status": "Rejected",
            "reason": "EMI exceeds 50% salary"
        }

    # Salary slip required for high loans
    if loan_amount > 300000 and not salary_slip_uploaded:
        return {
            "status": "Pending",
            "reason": "Salary slip required"
        }

    return {
        "status": "Approved",
        "emi": round(emi, 2)
    }
