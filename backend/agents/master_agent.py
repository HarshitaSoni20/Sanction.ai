

def master_agent(context: dict):
    """
    Master Agent (Orchestrator)
    Controls conversation & sales pitch
    """

    intent = context.get("intent")
    amount = context.get("amount")
    tenure = context.get("tenure")
    customer_type = context.get("customer_type")

    # You can expand logic later based on customer_type
    if intent == "personal_loan":
        return (
            f"Based on your requirement of ₹{amount} for {tenure} months, "
            f"we can offer you competitive interest rates with instant approval."
        )

    return "How can I assist you today?"
