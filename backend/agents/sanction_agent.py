# backend/agents/sanction_agent.py
from fpdf import FPDF
import os

def generate_sanction(name, amount):
    filename = f"sanction_{name.lower()}.pdf"
    path = os.path.join("/tmp", filename)  # 👈 VERY IMPORTANT

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=12)

    pdf.cell(0, 10, "SANCTION LETTER", ln=True)
    pdf.ln(5)

    pdf.multi_cell(
        0, 8,
        f"Dear {name},\n\n"
        f"We are pleased to inform you that your personal loan of "
        f"Rs. {amount} has been approved.\n\n"
        f"Regards,\nEY NBFC AI System"
    )

    pdf.output(path)
    return filename
