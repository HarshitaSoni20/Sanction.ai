import { useState, useRef, useEffect } from "react";

// ⚠️ STEP 1: REPLACE THIS WITH YOUR RENDER BACKEND URL
// Example: "https://ey-loan-backend.onrender.com"
const BACKEND_URL = "https://YOUR-RENDER-APP-NAME.onrender.com"; 

// --- CUSTOM 3D SVG ROBOT COMPONENT ---
const ThreeDRobot = ({ className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 200"
    className={className}
    style={style}
  >
    <defs>
      <linearGradient id="bodyGrad" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="40%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>

      <radialGradient id="blueGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#2563eb" />
      </radialGradient>

      <filter id="softShadow">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.2" />
      </filter>
    </defs>

    {/* Neck */}
    <rect x="90" y="135" width="20" height="15" fill="#94a3b8" />

    {/* Body */}
    <path 
      d="M70,150 Q100,170 130,150 L130,185 Q100,205 70,185 Z" 
      fill="url(#bodyGrad)" 
      filter="url(#softShadow)"
    />
    <circle cx="100" cy="175" r="8" fill="#3b82f6" stroke="#fff" strokeWidth="2" />

    {/* Head */}
    <circle cx="100" cy="90" r="55" fill="url(#bodyGrad)" filter="url(#softShadow)" />

    {/* Face Screen */}
    <path 
      d="M60,85 Q100,55 140,85 Q140,125 100,125 Q60,125 60,85 Z" 
      fill="#0f172a" 
    />

    {/* Eyes */}
    <g className="robot-eyes">
      <circle cx="82" cy="92" r="12" fill="url(#blueGlow)" />
      <circle cx="80" cy="88" r="4" fill="#fff" opacity="0.9" />
      
      <circle cx="118" cy="92" r="12" fill="url(#blueGlow)" />
      <circle cx="116" cy="88" r="4" fill="#fff" opacity="0.9" />
    </g>

    {/* Antenna */}
    <path d="M145,55 Q160,35 165,15" stroke="#cbd5e1" strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="165" cy="15" r="5" fill="#ef4444" />

    {/* Ears */}
    <rect x="35" y="75" width="12" height="30" rx="6" fill="#e2e8f0" filter="url(#softShadow)" />
    <rect x="153" y="75" width="12" height="30" rx="6" fill="#e2e8f0" filter="url(#softShadow)" />
  </svg>
);

function App() {
  const chatEndRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "👋 Hi! I’m your Loan Assistant." },
    { sender: "bot", text: "May I know your name?" },
  ]);

  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [completed, setCompleted] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [salarySlipUploaded, setSalarySlipUploaded] = useState(false);
  const [sanctionFile, setSanctionFile] = useState(null);

  const [form, setForm] = useState({
    name: "", loan_amount: "", tenure_months: "", monthly_salary: "", credit_score: "", pan: "",
  });

  const questions = [
    "May I know your name?", "How much loan amount do you need?", "For how many months do you want the loan?",
    "What is your monthly salary?", "What is your credit score?", "Please enter your PAN number",
  ];

  const isValidPAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, started]);

  const callEvaluateLoan = async (extra = {}) => {
    try {
      // ✅ FIX: Use the BACKEND_URL variable
      const res = await fetch(`${BACKEND_URL}/evaluate-loan`, {
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
    } catch (e) {
      console.error("Backend error", e);
      return { status: "Error", reason: "Could not connect to server. Check Render URL." };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || completed || showUpload) return;
    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    const currentInput = input;
    setInput(""); 

    const updated = { ...form };
    if (step === 0) updated.name = currentInput;
    if (step === 1) updated.loan_amount = currentInput;
    if (step === 2) updated.tenure_months = currentInput;
    if (step === 3) updated.monthly_salary = currentInput;
    if (step === 4) updated.credit_score = currentInput;
    if (step === 5) {
      const pan = currentInput.toUpperCase();
      if (!isValidPAN(pan)) {
        setMessages((prev) => [...prev, { sender: "bot", text: "❌ Invalid PAN format" }]);
        return;
      }
      updated.pan = pan;
    }
    setForm(updated);

    if (step === 5) {
      setMessages((prev) => [...prev, { sender: "bot", text: "🔍 Verifying details..." }]);
      const data = await callEvaluateLoan({ ...updated });
      
      if (data.status === "Approved") {
        setCompleted(true);
        
        // ✅ FIX: Handle Base64 PDF Conversion
        if (data.sanction_letter_data) {
            try {
                // Convert Base64 string to Blob
                const byteCharacters = atob(data.sanction_letter_data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const pdfBlob = new Blob([byteArray], { type: "application/pdf" });
                
                // Create downloadable URL
                const url = URL.createObjectURL(pdfBlob);
                setSanctionFile(url);
            } catch (err) {
                console.error("PDF Conversion Error:", err);
                setMessages(prev => [...prev, { sender: "bot", text: "⚠️ Error preparing download." }]);
            }
        } else {
            // Fallback just in case
            setSanctionFile(null);
        }

        setMessages((prev) => [
          ...prev, 
          { sender: "bot", text: `🎉 Congratulations ${updated.name}!` },
          { sender: "bot", text: `💰 EMI: ₹${data.emi}/month` },
          { sender: "bot", text: data.message }
        ]);
      } else if (data.reason === "Salary slip required") {
        setShowUpload(true);
        setMessages((prev) => [...prev, { sender: "bot", text: "📄 Salary slip required. Upload below." }]);
      } else {
        setCompleted(true);
        setMessages((prev) => [...prev, { sender: "bot", text: `❌ Rejected: ${data.reason}` }]);
      }
      return;
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "bot", text: questions[step + 1] }]);
    }, 600);
    setStep(step + 1);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      // ✅ FIX: Use BACKEND_URL for uploads too
      await fetch(`${BACKEND_URL}/upload-salary-slip`, { method: "POST", body: formData });
      
      setSalarySlipUploaded(true);
      setShowUpload(false);
      setMessages((prev) => [...prev, { sender: "bot", text: "✅ Uploaded." }, { sender: "bot", text: "🔁 Rechecking..." }]);
      
      const data = await callEvaluateLoan({ salary_slip_uploaded: true });
      if (data.status === "Approved") {
        setCompleted(true);

        // ✅ FIX: Handle Base64 PDF Conversion (Again for this path)
        if (data.sanction_letter_data) {
            try {
                const byteCharacters = atob(data.sanction_letter_data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const pdfBlob = new Blob([byteArray], { type: "application/pdf" });
                const url = URL.createObjectURL(pdfBlob);
                setSanctionFile(url);
            } catch (err) {
                console.error("PDF Error", err);
            }
        }

        setMessages((prev) => [
            ...prev, 
            { sender: "bot", text: "🎉 Loan Approved!" }, 
            { sender: "bot", text: `💰 EMI: ₹${data.emi}/month` }
        ]);
      } else {
        setCompleted(true);
        setMessages((prev) => [...prev, { sender: "bot", text: `❌ ${data.reason}` }]);
      }
    } catch {
      setMessages((prev) => [...prev, { sender: "bot", text: "❌ Upload failed." }]);
    }
  };

  const Icons = {
    Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
    Send: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        :root {
            --bg-color: #020617;
            --chat-bg: rgba(17, 24, 39, 0.7);
            --bubble-user: rgba(255, 255, 255, 0.05);
            --bubble-bot: rgba(15, 23, 42, 0.6); 
            --accent: #3b82f6;
            --text: #f1f5f9;
        }
        body { margin: 0; font-family: 'Inter', sans-serif; background-color: var(--bg-color); color: var(--text); }
        
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes blink { 0%, 90%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        
        @keyframes borderRotate {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        .robot-anim { animation: float 3s ease-in-out infinite; }
        .robot-eyes circle { transform-origin: center; animation: blink 4s infinite; }

        .app-wrapper {
          display: flex; justify-content: center; align-items: center; min-height: 100vh;
          width: 100%;
          position: relative;
          background: 
            radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
            linear-gradient(to bottom, #020617, #0f172a, #1e1b4b);
        }

        /* --- LANDING CARD --- */
        .landing-card {
          width: 350px; height: 350px;
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.7);
          animation: fadeIn 0.8s ease-out;
        }

        /* --- START BUTTON (Navy Blue Shine) --- */
        .start-btn {
          margin-top: 20px; 
          padding: 12px 40px;
          color: white; 
          border-radius: 50px;
          font-weight: 600; 
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          
          /* NAVY BLUE SHINE GRADIENT BORDER */
          border: 2px solid transparent;
          background: 
            linear-gradient(#2563eb, #1e40af) padding-box,
            linear-gradient(45deg, #1e3a8a, #3b82f6, #93c5fd, #1e3a8a) border-box;
          
          background-size: 200% 200%;
          animation: borderRotate 4s ease infinite;
          box-shadow: 0 0 15px rgba(30, 58, 138, 0.6);
        }
        .start-btn:hover { transform: translateY(-2px); box-shadow: 0 0 25px rgba(59, 130, 246, 0.8); }

        /* --- CHAT BOX --- */
        .mobile-frame {
          width: 400px; 
          height: 550px; 
          background: var(--chat-bg);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          display: flex; flex-direction: column;
          overflow: hidden; backdrop-filter: blur(24px);
          box-shadow: 0 30px 80px rgba(0,0,0,0.8);
        }

        .chat-header { padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(2, 6, 23, 0.4); }
        .header-title { font-weight: 600; font-size: 1rem; color: #f1f5f9; letter-spacing: 0.5px; }
        .chat-body { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; scrollbar-width: none; }
        .message-group { display: flex; gap: 12px; animation: slideUp 0.3s ease-out; }
        .message-group.bot { align-items: flex-start; }
        .message-group.user { flex-direction: row-reverse; }

        .avatar { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .user-avatar { 
            background: linear-gradient(135deg, #ec4899, #8b5cf6); 
            border-radius: 50%; width: 36px; height: 36px; 
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; font-weight: 600; color: white;
            box-shadow: 0 2px 10px rgba(236, 72, 153, 0.3);
        }

        .bubble-container { display: flex; flex-direction: column; gap: 5px; max-width: 80%; }
        
        .bot .bubble { 
            position: relative; padding: 14px; border-radius: 4px 18px 18px 18px; 
            font-size: 0.95rem; line-height: 1.5; color: #e2e8f0;
            border: 1px solid transparent;
            background: linear-gradient(var(--bubble-bot), var(--bubble-bot)) padding-box, linear-gradient(to right, rgba(59, 130, 246, 0.4), rgba(59, 130, 246, 0.05)) border-box;
            box-shadow: -2px 2px 8px rgba(59, 130, 246, 0.05);
        }
        .user .bubble { 
            position: relative; padding: 12px 18px; border-radius: 20px; font-size: 0.95rem; color: #fff;
            border: 1px solid transparent;
            background: linear-gradient(var(--bubble-user), var(--bubble-user)) padding-box, linear-gradient(to left, rgba(236, 72, 153, 0.4), rgba(236, 72, 153, 0.05)) border-box;
            box-shadow: 2px 2px 8px rgba(236, 72, 153, 0.05);
        }

        .input-wrapper { padding: 12px 16px; background: linear-gradient(to top, rgba(2,6,23,0.95), transparent); }
        .input-pill { 
            display: flex; align-items: center; 
            border: 1.5px solid transparent; 
            border-radius: 50px; padding: 2px 4px 2px 16px; height: 45px; 
            background: linear-gradient(#0f172a, #0f172a) padding-box, linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6) border-box;
            background-size: 200% 200%; animation: borderRotate 4s ease infinite;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
        }
        .chat-input { flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 0.95rem; }
        .chat-input::placeholder { color: #94a3b8; }
        .send-btn { width: 36px; height: 36px; background: #3b82f6; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
        .send-btn:hover { background: #2563eb; }
        
        .file-upload-box { margin-top: 8px; padding: 12px; border: 1px dashed #475569; border-radius: 10px; font-size: 0.85rem; background: rgba(0,0,0,0.2); }
        .download-btn { display: inline-block; padding: 10px 16px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-size: 0.9rem; font-weight: 500; margin-top: 5px; }

        /* FOOTER BRANDING (Smaller and Compact) */
        .app-footer {
            position: absolute;
            bottom: 25px;
            width: 100%;
            text-align: center;
            font-size: 0.65rem; /* Small */
            color: #94a3b8;
            font-weight: 500;
            letter-spacing: 0.8px; /* Compact */
            opacity: 0.6;
            text-transform: uppercase;
        }
      `}</style>

      <div className="app-wrapper">
        {!started ? (
          <div className="landing-card">
            <ThreeDRobot className="robot-anim" style={{ width: '120px', height: '120px', marginBottom: '10px' }} />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{fontSize: '1.6rem', margin: '0 0 5px 0', fontWeight: 700}}>Loan Assistant</h1>
              <p style={{color: '#94a3b8', margin: 0, fontSize: '0.95rem'}}>Personal Loan Assistant</p>
            </div>
            <button className="start-btn" onClick={() => setStarted(true)}>Start Chat</button>
          </div>
        ) : (
          <div className="mobile-frame">
            <div className="chat-header">
              <div style={{cursor: 'pointer'}} onClick={() => setStarted(false)}><Icons.Back /></div>
              <div className="header-title">Loan Assistant</div>
              <div style={{width: 24}}></div>
            </div>
            <div className="chat-body">
              {messages.map((m, i) => (
                <div key={i} className={`message-group ${m.sender}`}>
                    {m.sender === 'bot' ? (
                        <div className="avatar"><ThreeDRobot style={{ width: '100%', height: '100%' }} /></div>
                    ) : (
                        <div className="avatar">
                            <div className="user-avatar">U</div>
                        </div>
                    )}
                    <div className="bubble-container">
                        <div className="bubble">
                            {m.text}
                            
                            {m.text.includes("Upload below") && showUpload && (
                                <div className="file-upload-box"><input type="file" onChange={handleFileUpload} /></div>
                            )}

                            {/* --- ✅ FIX: DOWNLOAD BUTTON LOGIC --- */}
                            {(m.text.includes("Congratulations") || m.text.includes("Loan Approved")) && sanctionFile && (
                                <div style={{marginTop: 10}}>
                                    <a 
                                        href={sanctionFile} 
                                        download="Sanction_Letter.pdf"
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="download-btn"
                                    >
                                        Download Letter
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="input-wrapper">
                <div className="input-pill">
                    <input className="chat-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSend()} placeholder="Type here..." disabled={completed || showUpload} />
                    <button className="send-btn" onClick={handleSend} disabled={completed || showUpload}><Icons.Send /></button>
                </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;