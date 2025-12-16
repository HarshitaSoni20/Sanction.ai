# -------------------- MAIN LOAN FLOW --------------------
@app.post("/evaluate-loan")
async def evaluate_loan(data: LoanRequest):
    try:
        print(f"Processing loan for: {data.name}, PAN: {data.pan}") # Debug Log

        # 1. Master Agent
        print("Calling Master Agent...")
        sales_context = master_agent({
            "intent": "personal_loan",
            "amount": data.loan_amount,
            "tenure": data.tenure_months,
            "customer_type": "existing"
        })

        # 2. PAN Verification
        print("Verifying PAN...")
        if not verify_pan(data.pan):
            return {"status": "Rejected", "reason": "PAN verification failed"}

        # 3. Underwriting
        print("Underwriting...")
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
        print("Generating Sanction Letter...")
        filename = generate_sanction(data.name, data.loan_amount)
        
        # PATH CHECK: We look in all possible places
        possible_paths = [
            f"/tmp/{filename}",             # Best for Vercel
            f"backend/sanctions/{filename}", # Local dev
            f"sanctions/{filename}",
            filename
        ]
        
        pdf_base64 = None
        for path in possible_paths:
            if os.path.exists(path):
                print(f"Found PDF at: {path}")
                pdf_base64 = get_pdf_base64(path)
                break
        
        if not pdf_base64:
            print("ERROR: PDF was generated but file not found.")
            # We still return approved, but maybe without the file
        
        return {
            "status": "Approved",
            "emi": decision["emi"],
            "message": sales_context,
            "sanction_letter_data": pdf_base64, 
            "filename": filename
        }

    except Exception as e:
        # 🚨 THIS IS THE IMPORTANT FIX 🚨
        print(f"SERVER ERROR: {str(e)}")
        return {
            "status": "Error", 
            "reason": f"Internal Server Error: {str(e)}"
        }