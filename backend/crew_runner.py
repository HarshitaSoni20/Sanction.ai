from crewai import Crew
from agents import sales_agent, verification_agent, underwriting_agent
from tasks import sales_task, verification_task, underwriting_task

def run_crew(data):
    crew = Crew(
        agents=[sales_agent, verification_agent, underwriting_agent],
        tasks=[
            sales_task(sales_agent, data),
            verification_task(verification_agent, data),
            underwriting_task(underwriting_agent, data),
        ],
        verbose=True
    )

    result = crew.kickoff()
    return result
