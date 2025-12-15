from crewai import Task

def sales_task(agent, data):
    return Task(
        description=f"""
        Customer wants loan of {data['loan_amount']} for {data['tenure']} months.
        Calculate EMI and summarize requirement.
        """,
        agent=agent
    )

def verification_task(agent, data):
    return Task(
        description=f"""
        Verify PAN: {data['pan']}
        Check if PAN format is valid and income is sufficient.
        """,
        agent=agent
    )

def underwriting_task(agent, data):
    return Task(
        description=f"""
        Credit score: {data['credit_score']}
        EMI: {data['emi']}
        Salary: {data['salary']}
        Decide approve or reject.
        """,
        agent=agent
    )
