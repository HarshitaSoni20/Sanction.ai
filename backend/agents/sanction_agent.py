from fpdf import FPDF
import os

def generate_sanction(name, amount):
    # 1. Define folder path (matches your screenshot structure)
    # We save inside "backend/sanctions"
    directory = os.path.join("backend", "sanctions")
    
    # 2. Safety Check: Create folder if missing
    if not os.path.exists(directory):
        os.makedirs(directory)

    # 3. Generate PDF Content
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=12)

    pdf.cell(0, 10, "SANCTION LETTER", ln=True, align='C')
    pdf.ln(10)

    pdf.multi_cell(0, 8,
        f"Dear {name},\n\n"
        f"We are pleased to inform you that your personal loan "
        f"of Rs. {amount} has been approved.\n\n"
        f"Regards,\nEY NBFC AI System"
    )

    # 4. Create Safe Filename (replace spaces with underscores)
    safe_name = name.lower().replace(" ", "_")
    filename = f"sanction_{safe_name}.pdf"
    
    # 5. Save the file
    full_path = os.path.join(directory, filename)
    pdf.output(full_path)

    # 6. Return ONLY the filename (Frontend adds the URL path)
    return filename
