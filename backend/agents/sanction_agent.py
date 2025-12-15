from fpdf import FPDF
import os

def generate_sanction(name, amount):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=12)

    pdf.cell(0, 10, "SANCTION LETTER", ln=True)
    pdf.ln(5)

    pdf.multi_cell(0, 8,
        f"Dear {name},\n\n"
        f"We are pleased to inform you that your personal loan "
        f"of Rs. {amount} has been approved.\n\n"
        f"Regards,\nEY NBFC AI System"
    )

    filename = f"sanction_{name.lower()}.pdf"
    path = os.path.join("backend/sanctions", filename)
    pdf.output(path)

    return filename
