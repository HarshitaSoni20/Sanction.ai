import { useState } from "react";

function App() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! I can help you with a Job Loan." },
    { sender: "bot", text: "What is your name?" },
  ]);

  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [approved, setApproved] = useState(false);

  const [form, setForm] = useState({
    name: "",
    loan_amount: "",
    tenure_months: "",
    monthly_salary: "",
    credit_score: "",
    pan: "",
  });

  const questions = [
    "What is your name?",
    "Required loan amount?",
    "Loan tenure (months)?",
    "Your monthly salary?",
    "Your credit score?",
    "Enter your PAN number?",
  ];

  const isValidPAN = (pan) => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  };

  const handleSend = async () => {
    if (!input) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    const updated = { ...form };

    if (step === 0) updated.name = input;
    if (step === 1) updated.loan_amount = input;
    if (step === 2) updated.tenure_months = input;
    if (step === 3) updated.monthly_salary = input;
    if (step === 4) updated.credit_score = input;

    if (step === 5) {
      const pan = input.toUpperCase();
      if (!isValidPAN(pan)) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Invalid PAN format. Example: ABCDE1234F" },
        ]);
        setInput("");
        return;
      }
      updated.pan = pan;
    }

    setForm(updated);
    setInput("");

    // FINAL STEP → BACKEND CALL
    if (step === 5) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Checking your loan eligibility..." },
      ]);

      try {
        const res = await fetch("http://127.0.0.1:8000/evaluate-loan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: updated.name,
            loan_amount: Number(updated.loan_amount),
            tenure_months: Number(updated.tenure_months),
            monthly_salary: Number(updated.monthly_salary),
            credit_score: Number(updated.credit_score),
            pan: updated.pan,
          }),
        });

        const data = await res.json();

        if (data.status === "Approved") setApproved(true);

        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `Status: ${data.status}` },
          { sender: "bot", text: `Reason: ${data.reason}` },
          { sender: "bot", text: `Monthly EMI: ₹${data.emi}` },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Server error. Please try again." },
        ]);
      }
      return;
    }

    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: questions[step + 1] },
    ]);
    setStep(step + 1);
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>EY Job Loan Chatbot</h2>

      <div
        style={{
          border: "1px solid #ccc",
          padding: 10,
          height: 320,
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{ textAlign: m.sender === "bot" ? "left" : "right" }}
          >
            <p>
              <b>{m.sender === "bot" ? "Bot" : "You"}:</b> {m.text}
            </p>
          </div>
        ))}

        {approved && (
          <div style={{ textAlign: "center", marginTop: 15 }}>
            <a
              href="http://127.0.0.1:8000/download-sanction"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "8px 12px",
                background: "#4caf50",
                color: "white",
                textDecoration: "none",
                borderRadius: 4,
                fontWeight: "bold",
              }}
            >
              Download Sanction Letter
            </a>
          </div>
        )}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type here..."
        style={{ width: "100%", padding: 8, marginTop: 10 }}
      />

      <button
        onClick={handleSend}
        style={{ width: "100%", marginTop: 5 }}
      >
        Send
      </button>
    </div>
  );
}

export default App;
