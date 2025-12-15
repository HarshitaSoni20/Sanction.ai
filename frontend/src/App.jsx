import { useState, useRef, useEffect } from "react";

function App() {
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([
    { sender: "bot", text: "👋 Hi! I’m your personal loan assistant." },
    { sender: "bot", text: "May I know your name?" },
  ]);

  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [completed, setCompleted] = useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [salarySlipUploaded, setSalarySlipUploaded] = useState(false);
  const [sanctionFile, setSanctionFile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    loan_amount: "",
    tenure_months: "",
    monthly_salary: "",
    credit_score: "",
    pan: "",
  });

  const questions = [
    "May I know your name?",
    "How much loan amount do you need?",
    "For how many months do you want the loan?",
    "What is your monthly salary?",
    "What is your credit score?",
    "Please enter your PAN number",
  ];

  const isValidPAN = (pan) =>
    /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔁 Common backend call
  const callEvaluateLoan = async (extra = {}) => {
    const res = await fetch("http://127.0.0.1:8000/evaluate-loan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        loan_amount: Number(form.loan_amount),
        tenure_months: Number(form.tenure_months),
        monthly_salary: Number(form.monthly_salary),
        credit_score: Number(form.credit_score),
        salary_slip_uploaded: salarySlipUploaded,
        ...extra,
      }),
    });
    return res.json();
  };

  // ---------------- SEND MESSAGE ----------------
  const handleSend = async () => {
    if (!input.trim() || completed || showUpload) return;

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
          { sender: "bot", text: "❌ Invalid PAN format (ABCDE1234F)" },
        ]);
        setInput("");
        return;
      }
      updated.pan = pan;
    }

    setForm(updated);
    setInput("");

    // FINAL API CALL
    if (step === 5) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "🔍 Verifying details and checking eligibility..." },
      ]);

      const data = await callEvaluateLoan({ ...updated });

      if (data.status === "Approved") {
        setCompleted(true);
        setSanctionFile(data.sanction_letter);

        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `🎉 Congratulations ${updated.name}!` },
          { sender: "bot", text: `💰 EMI: ₹${data.emi}/month` },
          { sender: "bot", text: data.message },
        ]);
      } else if (data.reason === "Salary slip required") {
        setShowUpload(true);
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "📄 Salary slip required. Please upload below." },
        ]);
      } else {
        setCompleted(true);
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `❌ Rejected: ${data.reason}` },
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

  // ---------------- FILE UPLOAD ----------------
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://127.0.0.1:8000/upload-salary-slip", {
      method: "POST",
      body: formData,
    });

    setSalarySlipUploaded(true);
    setShowUpload(false);

    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: "✅ Salary slip uploaded successfully." },
      { sender: "bot", text: "🔁 Rechecking your eligibility..." },
    ]);

    // 🔥 SECOND BACKEND CALL
    const data = await callEvaluateLoan({ salary_slip_uploaded: true });

    if (data.status === "Approved") {
      setCompleted(true);
      setSanctionFile(data.sanction_letter);

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "🎉 Loan Approved!" },
        { sender: "bot", text: `💰 EMI: ₹${data.emi}/month` },
        { sender: "bot", text: data.message },
      ]);
    } else {
      setCompleted(true);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: `❌ ${data.reason}` },
      ]);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>EY Agentic Loan Assistant</h2>

      <div style={{ border: "1px solid #ccc", padding: 12, height: 380, overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.sender === "bot" ? "left" : "right" }}>
            <span
              style={{
                padding: "8px 12px",
                borderRadius: 12,
                background: m.sender === "bot" ? "#e0e0e0" : "#4caf50",
                color: m.sender === "bot" ? "#000" : "#fff",
                display: "inline-block",
                marginBottom: 6,
              }}
            >
              {m.text}
            </span>
          </div>
        ))}

        {showUpload && (
          <div style={{ marginTop: 10 }}>
            <input type="file" onChange={handleFileUpload} />
          </div>
        )}

        {sanctionFile && (
          <div style={{ textAlign: "center", marginTop: 15 }}>
            <a
              href={`http://127.0.0.1:8000/${sanctionFile}`}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "10px 14px",
                background: "#1976d2",
                color: "white",
                borderRadius: 6,
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              📄 Download Sanction Letter
            </a>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your answer..."
        disabled={completed || showUpload}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <button
        onClick={handleSend}
        disabled={completed || showUpload}
        style={{
          width: "100%",
          marginTop: 6,
          padding: 10,
          background: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: 4,
        }}
      >
        Send
      </button>
    </div>
  );
}

export default App;
