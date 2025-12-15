def verify_pan(pan: str):
    # Dummy PAN rule
    return len(pan) == 10 and pan[:5].isalpha() and pan[5:9].isdigit()