from crewai import Agent

sales_agent = Agent(
    role="Sales Agent",
    goal="Understand loan requirements and calculate EMI",
    backstory="Expert loan advisor who understands customer needs",
    verbose=True
)

verification_agent = Agent(
    role="Verification Agent",
    goal="Verify PAN and income details",
    backstory="KYC expert responsible for identity and income verification",
    verbose=True
)

underwriting_agent = Agent(
    role="Underwriting Agent",
    goal="Decide loan approval based on credit score and affordability",
    backstory="Risk analyst ensuring safe lending decisions",
    verbose=True
)
