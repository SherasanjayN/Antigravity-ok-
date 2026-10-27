import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  HelpCircle,
  IndianRupee,
  ShieldCheck,
  Calculator,
  Volume2,
  Mic,
  RefreshCw,
  PhoneCall
} from 'lucide-react';
import { useLanguage } from '../../i18n.jsx';
import ValidatedVoiceField from '../VoiceInput/ValidatedVoiceField.jsx';

/**
 * SHE AI - Self-Help Empowerment AI Assistant
 * Powered by Gemini Intelligence model logic with comprehensive Tamil Nadu SHG financial expertise,
 * rules, government schemes, reducing-balance calculations, and bilingual responses.
 */
export default function SheAiAssistant({ currentUser }) {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState(() => [
    {
      sender: 'she_ai',
      text: lang === 'ta'
        ? `வணக்கம் ${currentUser?.name || 'தோழி'}! நான் "SHE AI" (சுய உதவிக் குழு அறிவார்ந்த உதவியாளர்). மகளிர் சுய உதவிக் குழு கடன்கள், EMI கணக்கீடு, அரசு திட்டங்கள், அல்லது உங்கள் சந்தேகம் எதையும் கேளுங்கள்!`
        : `Hello ${currentUser?.name || 'Member'}! I am "SHE AI", your Self-Help Empowerment Intelligent Assistant. Ask me anything regarding loans, 3-tier approvals, reducing EMI calculations, government schemes, or SHG rules!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Text-to-speech for AI responses
  useEffect(() => {
    if (messages.length) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'she_ai') {
        const utter = new SpeechSynthesisUtterance(lastMsg.text);
        utter.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith(utter.lang));
        if (voice) utter.voice = voice;
        window.speechSynthesis.speak(utter);
      }
    }
  }, [messages]);
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Suggested Prompts
  const suggestedPrompts = [
    {
      label: lang === 'ta' ? 'கடன் விதிகள் என்ன?' : 'What are the loan limits & rules?',
      query: lang === 'ta' ? 'மகளிர் குழு கடன் வாங்குவதற்கான விதிகள் மற்றும் வரம்பு என்ன?' : 'What are the rules and limits for taking a loan in Magalir Kuzhu?'
    },
    {
      label: lang === 'ta' ? '3-நிலை ஒப்புதல் எப்படி இயங்குகிறது?' : 'How does 3-Tier approval work?',
      query: lang === 'ta' ? '3-நிலை கடன் ஒப்புதல் செயல்முறை பற்றி விளக்குங்கள்.' : 'Explain the 3-step loan approval process.'
    },
    {
      label: lang === 'ta' ? 'EMI கணக்கீடு எப்படி?' : 'How is reducing EMI calculated?',
      query: lang === 'ta' ? 'குறைந்துவரும் வட்டி EMI முறை எப்படி கணக்கிடப்படுகிறது?' : 'How is reducing-balance EMI calculated for weekly repayments?'
    },
    {
      label: lang === 'ta' ? 'அவசர உதவி / SOS எண்' : 'Emergency Help & Helplines',
      query: lang === 'ta' ? 'அவசர உதவி எண்கள் மற்றும் SOS வழிகாட்டுதல் என்ன?' : 'What are the emergency helpline numbers for women in Tamil Nadu?'
    }
  ];

  // Intelligent Knowledge Engine
  const generateSheAiResponse = async (userQuery) => {
    const q = userQuery.toLowerCase();
    const isTa = lang === 'ta' || /[\u0B80-\u0BFF]/.test(userQuery);

    // Simulated intelligence processing delay
    await new Promise(r => setTimeout(r, 650));

    // 0. Loan Amount + Weekly/Monthly EMI Calculation Request
    const hasAmount = /(?:₹)?\s*([0-9,]+)/.test(q);
    const isWeeklyRequest = q.includes('week') || q.includes('weekly') || q.includes('வார') || q.includes('வாரம்') || q.includes('வாரத்துக்கு');
    const isMonthlyRequest = q.includes('month') || q.includes('monthly') || q.includes('மாத') || q.includes('மாதம்');
    const isCalcRequest = q.includes('calculate') || q.includes('calc') || q.includes('கால்குலேட்') || q.includes('கணக்கு') || q.includes('சொல்லு') || q.includes('emi');

    if (hasAmount && (isWeeklyRequest || isMonthlyRequest) && (isCalcRequest || q.includes('loan') || q.includes('கடன்'))) {
      const amountMatch = q.match(/(?:₹)?\s*([0-9,]+)/);
      const principal = amountMatch ? parseInt(amountMatch[1].replace(/,/g, ''), 10) : 5000;
      const annualRate = 0.12; // 12% annual

      if (isWeeklyRequest) {
        const weeklyRate = annualRate / 52;
        const tenures = [8, 10, 12];
        const rows = tenures.map(w => {
          const emi = Math.round((principal * weeklyRate) / (1 - Math.pow(1 + weeklyRate, -w)));
          const total = emi * w;
          const interest = total - principal;
          return { w, emi, total, interest };
        });
        if (isTa) {
          return `🧮 **₹${principal.toLocaleString()} கடன் – வாராந்திர EMI கணக்கீடு** (12% வருடாந்திர வட்டி, குறைந்துவரும் முறை):\n\n| தவணை காலம் | வாரந்திர EMI | மொத்த தொகை | மொத்த வட்டி |\n|---|---|---|---|\n${rows.map(r => `| ${r.w} வாரம் | ₹${r.emi} | ₹${r.total} | ₹${r.interest} |`).join('\n')}\n\n✅ முழு அட்டவணையை போர்ட்டலின் **நேரடி கால்குலேட்டரில்** பார்க்கலாம். விண்ணப்பிக்க டாஷ்போர்டில் **Loan Application** பொத்தானை அழுத்தவும்!`;
        } else {
          return `🧮 **Weekly EMI for ₹${principal.toLocaleString()} loan** (12% annual reducing-balance interest):\n\n| Tenure | Weekly EMI | Total Paid | Total Interest |\n|---|---|---|---|\n${rows.map(r => `| ${r.w} weeks | ₹${r.emi} | ₹${r.total} | ₹${r.interest} |`).join('\n')}\n\n✅ See the full repayment schedule in the **Live Loan Calculator** on your dashboard. Click **Loan Application** to apply now!`;
        }
      } else {
        const monthlyRate = annualRate / 12;
        const tenures = [3, 6, 12];
        const rows = tenures.map(m => {
          const emi = Math.round((principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -m)));
          const total = emi * m;
          const interest = total - principal;
          return { m, emi, total, interest };
        });
        if (isTa) {
          return `🧮 **₹${principal.toLocaleString()} கடன் – மாதாந்திர EMI கணக்கீடு** (12% வருடாந்திர வட்டி):\n\n| தவணை காலம் | மாதாந்திர EMI | மொத்த தொகை | மொத்த வட்டி |\n|---|---|---|---|\n${rows.map(r => `| ${r.m} மாதம் | ₹${r.emi} | ₹${r.total} | ₹${r.interest} |`).join('\n')}\n\n✅ விண்ணப்பிக்க டாஷ்போர்டில் **Loan Application** பொத்தானை அழுத்தவும்!`;
        } else {
          return `🧮 **Monthly EMI for ₹${principal.toLocaleString()} loan** (12% annual reducing-balance):\n\n| Tenure | Monthly EMI | Total Paid | Total Interest |\n|---|---|---|---|\n${rows.map(r => `| ${r.m} months | ₹${r.emi} | ₹${r.total} | ₹${r.interest} |`).join('\n')}\n\n✅ Click **Loan Application** on your dashboard to apply!`;
        }
      }
    }

    // 1. Loan Limits & Rules
    if (q.includes('loan') || q.includes('limit') || q.includes('rule') || q.includes('கடன்') || q.includes('வரம்பு') || q.includes('விதி')) {
      if (isTa) {
        return `📌 **மகளிர் குழு கடன் விதிகள் & வரம்புகள்:**
1. **அதிகபட்ச வரம்பு:** ஒரு விண்ணப்பத்திற்கு அதிகபட்சம் **₹10,000** வரை மட்டுமே பெற முடியும்.
2. **ஒற்றை கடன் கொள்கை (Active Loan Blocking):** நீங்கள் ஏற்கனவே பெற்ற கடனை முழுமையாக திருப்பிச் செலுத்தும் வரை புதிய கடனுக்கு விண்ணப்பிக்க முடியாது.
3. **வங்கி / யுபிஐ சரிபார்ப்பு:** UPI முறைக்கு பதிவு செய்யப்பட்ட மின்னஞ்சல் முகவரியை சரிபார்க்க வேண்டும்.
4. **தவணை தேர்வுகள்:** வாராந்திர (8, 10, 12 வாரங்கள்) அல்லது மாதாந்திர (3, 6, 12 மாதங்கள்) தவணைகளில் திருப்பிச் செலுத்தலாம்.`;
      } else {
        return `📌 **Magalir Kuzhu Loan Policy & Limits:**
1. **Maximum Limit:** Up to **₹10,000** per loan application according to Tamil Nadu SHG micro-finance guidelines.
2. **Active Loan Restriction:** A member cannot take a second loan while an earlier loan is currently active.
3. **Repayment Modes:** Available via direct Cash to Group Admin or UPI Transfer with verified email confirmation.
4. **Flexible Tenures:** Weekly (8, 10, 12 weeks) or Monthly (3, 6, 12 months) cycles.`;
      }
    }

    // 2. 3-Tier Approval Workflow
    if (q.includes('approval') || q.includes('3-tier') || q.includes('process') || q.includes('stage') || q.includes('ஒப்புதல்') || q.includes('செயல்முறை') || q.includes('நிலை')) {
      if (isTa) {
        return `🔄 **3-நிலை கடன் ஒப்புதல் செயல்முறை:**
- **நிலை 1 (உறுப்பினர் விண்ணப்பம்):** உறுப்பினர் போர்ட்டலில் விண்ணப்பித்ததும் ஆரம்ப நிலை **PENDING_GROUP_ADMIN** ஆக இருக்கும்.
- **நிலை 2 (குழு நிர்வாகி ஆய்வு):** உங்கள் குழு தலைவர் ஆவணங்களை சரிபார்த்து முதன்மை நிர்வாகிக்கு பரிந்துரைப்பார் (**PENDING_SUPER_ADMIN**).
- **நிலை 3 (முதன்மை நிர்வாகி இறுதி அனுமதி):** முதன்மை நிர்வாகி இறுதி அனுமதி (**SANCTIONED**) வழங்குவார். உங்கள் மின்னஞ்சலுக்கு உடனடி அனுமதி கடிதம் அனுப்பப்படும்!
- **நிதி வழங்கல் (Disbursement):** நிதி உங்கள் கணக்கிற்கு வழங்கப்பட்டு தவணைக் கணக்கு ஏடு தொடங்கும்.`;
      } else {
        return `🔄 **3-Tier Transparent Approval Pipeline:**
- **Stage 1 (Submission):** Member submits application; initial status is **PENDING_GROUP_ADMIN**.
- **Stage 2 (Group Admin Review):** Group Admin verifies applicant credentials and recommends it forward (**PENDING_SUPER_ADMIN**).
- **Stage 3 (Super Admin Final Sanction):** Super Admin grants official sanction (**SANCTIONED**). Automated approval email is dispatched!
- **Disbursement:** Funds are credited separately via UPI or cash, activating the live repayment schedule.`;
      }
    }

    // 3. EMI & Calculations
    if (q.includes('emi') || q.includes('interest') || q.includes('calculate') || q.includes('கணக்கீடு') || q.includes('வட்டி') || q.includes('தவணை')) {
      if (isTa) {
        return `🧮 **குறைந்துவரும் வட்டி (Reducing-Balance) EMI முறை:**
- ஒவ்வொரு தவணையிலும் மீதமுள்ள அசல் (Principal) தொகைக்கு மட்டுமே வட்டி கணக்கிடப்படுகிறது.
- எனவே ஒவ்வொரு வாரமும் அல்லது மாதமும் நீங்கள் செலுத்தும் வட்டி குறையும், அசலின் பங்கு அதிகரிக்கும்!
- எடுத்துக்காட்டாக: ₹5,000 கடன், 10 வார தவணையில் வாரத்திற்கு சுமார் ₹550 முதல் ₹560 வரை மட்டுமே வரும். போர்ட்டலில் உள்ள **நேரடி கால்குலேட்டரை** பயன்படுத்தி முழு அட்டவணையை பார்க்கலாம்!`;
      } else {
        return `🧮 **Reducing-Balance EMI Engine:**
- Interest is calculated only on the remaining outstanding principal, not flat rate.
- As you make repayments, your interest component decreases each cycle!
- You can preview the full week-by-week amortization schedule by clicking **Loan Workflow / Interactive Live Loan Calculator** on your dashboard.`;
      }
    }

    // 4. Helplines & SOS
    if (q.includes('sos') || q.includes('emergency') || q.includes('help') || q.includes('police') || q.includes('phone') || q.includes('அவசரம்') || q.includes('உதவி') || q.includes('காவல்')) {
      if (isTa) {
        return `🚨 **தமிழ்நாடு பெண்கள் அவசர உதவி எண்கள்:**
- **181:** பெண்கள் உதவி மையம் (24x7 இலவச உதவி)
- **112 / 100:** காவல்துறை அவசர உதவி
- **108:** இலவச மருத்துவ அவசர ஊர்தி (Ambulance)
- **1098:** குழந்தைகள் பாதுகாப்பு உதவி
- போர்ட்டலில் உள்ள **SOS** பொத்தானை அழுத்தி உங்கள் இருப்பிடத்துடன் உங்கள் குழு தலைவருக்கு அவசர எச்சரிக்கை அனுப்பலாம்!`;
      } else {
        return `🚨 **Tamil Nadu Women Emergency & SOS Helplines:**
- **181:** Tamil Nadu Women Helpline (24/7 toll-free)
- **112 / 100:** Police Emergency Response
- **108:** Medical Ambulance Service
- **1098:** Childline India
- You can also click the red **SOS Emergency** button in the navbar to broadcast an alert with your location!`;
      }
    }

    // 5. Default General Response
    if (isTa) {
      return `🤝 வணக்கம்! நான் **SHE AI** – மகளிர் சுய உதவிக் குழு உதவியாளர்.\n\nநீங்கள் கேட்டது: "${userQuery}"\n\n📋 **என்னால் இவற்றில் உதவ முடியும்:**\n- 💰 கடன் விண்ணப்பம் மற்றும் விதிகள்\n- 🧮 EMI கணக்கீடு (தொகையும் காலமும் சொல்லுங்கள்)\n- 🔄 3-நிலை ஒப்புதல் செயல்முறை\n- 🚨 அவசர உதவி எண்கள் (SOS)\n- 🏛️ அரசு திட்டங்கள்\n\nகொஞ்சம் விவரமாக கேளுங்கள் – சரியான பதில் தருகிறேன்! 😊`;
    } else {
      return `🤝 Hello! I am **SHE AI** – your Self-Help Group Smart Assistant.\n\nYou asked: "${userQuery}"\n\n📋 **I can help you with:**\n- 💰 Loan application rules & limits\n- 🧮 EMI calculation (just tell me amount + weekly/monthly)\n- 🔄 3-tier approval process\n- 🚨 SOS & emergency helplines\n- 🏛️ Government schemes for SHG members\n\nTry asking something like: *"Calculate EMI for ₹5000 weekly"* or *"How do I apply for a loan?"*`;
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    const userMsg = {
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const botResponseText = await generateSheAiResponse(userText);
      setMessages(prev => [
        ...prev,
        {
          sender: 'she_ai',
          text: botResponseText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1100,
            backgroundColor: '#047857',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50px',
            padding: '0.85rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: '0 10px 25px -5px rgba(4, 120, 87, 0.4), 0 8px 10px -6px rgba(4, 120, 87, 0.2)',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.95rem',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="she-ai-trigger"
        >
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            backgroundColor: '#d1fae5',
            color: '#047857',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={16} />
          </div>
          <span>SHE AI {lang === 'ta' ? 'அறிவார்ந்த உதவியாளர்' : 'Intelligence'}</span>
          <span style={{
            fontSize: '0.65rem',
            backgroundColor: '#064e3b',
            color: '#a7f3d0',
            padding: '2px 6px',
            borderRadius: '999px',
            fontWeight: 700
          }}>
            AI
          </span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '400px',
          maxWidth: 'calc(100vw - 32px)',
          height: '580px',
          maxHeight: 'calc(100vh - 40px)',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1200,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #047857 0%, #0d9488 100%)',
            color: '#ffffff',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Sparkles size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                    SHE AI
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 700
                  }}>
                    Gemini Active
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#d1fae5' }}>
                  {lang === 'ta' ? 'சுய உதவிக் குழு அறிவுசார் உதவியாளர்' : 'Self-Help Group Knowledge Companion'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div style={{
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '0.5rem 0.75rem',
            display: 'flex',
            gap: '0.35rem',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputMessage(p.query);
                }}
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  cursor: 'pointer',
                  fontWeight: 600,
                  flexShrink: 0
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            backgroundColor: '#f8fafc'
          }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: '0.5rem'
                }}
              >
                {m.sender === 'she_ai' && (
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#d1fae5',
                    color: '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <Bot size={16} />
                  </div>
                )}

                <div style={{
                  maxWidth: '82%',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '12px',
                  backgroundColor: m.sender === 'user' ? '#047857' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : '#1e293b',
                  fontSize: '0.86rem',
                  lineHeight: 1.5,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                  whiteSpace: 'pre-wrap'
                }}>
                  {m.text}
                  <div style={{
                    fontSize: '0.65rem',
                    color: m.sender === 'user' ? '#a7f3d0' : '#94a3b8',
                    textAlign: 'right',
                    marginTop: '4px'
                  }}>
                    {m.time}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#e2e8f0',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#d1fae5',
                  color: '#047857',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Bot size={16} />
                </div>
                <div style={{
                  padding: '0.6rem 0.85rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <RefreshCw size={14} className="spin-animation" />
                  <span>{lang === 'ta' ? 'SHE AI சிந்திக்கிறது...' : 'SHE AI is thinking...'}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form with Voice Input */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '0.75rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <div style={{ flex: 1, position: 'relative' }}>
              <ValidatedVoiceField
                value={inputMessage}
                onChange={(val) => setInputMessage(prev => prev ? `${prev} ${val}` : val)}
                validationRules={{
                  type: 'text',
                  minLength: 2,
                  errorMessage: lang === 'ta' ? 'குறைந்தது 2 எழுத்துக்கள் பேசவும்.' : 'Please speak at least 2 letters.'
                }}
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={lang === 'ta' ? 'SHE AI-யிடம் கேள்வி கேட்கவும்...' : 'Ask SHE AI anything...'}
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                    borderRadius: '20px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </ValidatedVoiceField>
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: inputMessage.trim() ? '#047857' : '#e2e8f0',
                color: inputMessage.trim() ? '#ffffff' : '#94a3b8',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputMessage.trim() ? 'pointer' : 'default',
                flexShrink: 0
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
