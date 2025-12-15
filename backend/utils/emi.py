def calculate_emi(principal: float, rate: float, tenure: int):
    r = rate
    n = tenure
    emi = (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1)
    return emi

