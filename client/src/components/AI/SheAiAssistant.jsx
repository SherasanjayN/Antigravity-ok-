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
  VolumeX,
  Square,
  Mic,
  RefreshCw,
  PhoneCall
} from 'lucide-react';
import { useLanguage } from '../../i18n';
import ValidatedVoiceField from '../VoiceInput/ValidatedVoiceField';
import { api } from '../../services/api';

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
        ? `வணக்கம் ${currentUser?.name || 'தோழி'}! நான் "SHE AI" (மகளிர் சுய உதவிக் குழு உதவியாளர்). கடன்கள், தலைவர் கடன் விண்ணப்பம், தவணை கணக்கீடு, அரசு திட்டங்கள், அல்லது உங்கள் சந்தேகம் எதையும் கேளுங்கள்!`
        : `Hello ${currentUser?.name || 'Member'}! I am "SHE AI", your Self-Help Group Assistant. Ask me anything regarding loans, group admin loan requests, EMI calculations, deleting chat messages, government schemes, or SHG rules!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [isSpeaking, setIsSpeaking] = useState(false);

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Text-to-speech for AI responses (only speaks when chat is open)
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      return;
    }

    if (messages.length && 'speechSynthesis' in window) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'she_ai') {
        window.speechSynthesis.cancel();
        // Strip markdown stars/formatting for cleaner speech
        const cleanText = lastMsg.text.replace(/[*#_`|]/g, ' ').replace(/\s+/g, ' ').trim();
        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
        utter.rate = 0.95;

        utter.onstart = () => setIsSpeaking(true);
        utter.onend = () => setIsSpeaking(false);
        utter.onerror = () => setIsSpeaking(false);

        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith(utter.lang) || (lang === 'ta' && v.lang.includes('ta')));
        if (voice) utter.voice = voice;
        window.speechSynthesis.speak(utter);
      }
    }
  }, [messages, lang, isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Suggested Prompts
  const suggestedPrompts = [
    {
      label: lang === 'ta' ? '🌸 எனக்கு கடன் தகுதி உள்ளதா?' : '🌸 Am I eligible for a loan?',
      query: lang === 'ta' ? 'எனக்கு இன்னொரு loan கிடைக்குமா? என் கடன் தகுதி மற்றும் repayment score என்ன?' : 'Am I eligible for another loan? What is my repayment score?'
    },
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

    // 🌸 SMART LOAN ELIGIBILITY & REPAYMENT SCORE QUERY HANDLER (DATA-DRIVEN)
    // Supports English, Tamil, and Tanglish
    const isEligibilityQuery = (
      // English
      q.includes('eligible') || q.includes('eligibility') ||
      q.includes('can i get') || q.includes('can i apply') ||
      q.includes('another loan') || q.includes('next loan') ||
      q.includes('4th loan') || q.includes('fourth loan') ||
      q.includes('5th loan') || q.includes('fifth loan') ||
      q.includes('why can\'t i get') || q.includes('why cannot i get') ||
      q.includes('repayment score') || q.includes('my score') ||
      q.includes('improve my score') || q.includes('improve score') ||
      q.includes('when can i apply') ||
      // Tamil script
      q.includes('தகுதி') || q.includes('இன்னொரு லோன்') || q.includes('இன்னொரு கடன்') ||
      q.includes('கிடைக்குமா') || q.includes('4வது லோன்') || q.includes('4வது கடன்') ||
      q.includes('நான்காவது கடன்') || q.includes('ஏன் லோன் கிடைக்கவில்லை') ||
      q.includes('ஏன் கடன் கிடைக்கவில்லை') || q.includes('ரெபேமென்ட் ஸ்கோர்') ||
      q.includes('ஸ்கோர் எவ்வளவு') || q.includes('ஸ்கோரை அதிகரிக்க') ||
      q.includes('எப்போது கடன் வாங்கலாம்') ||
      // Tanglish
      q.includes('kidaikkuma') || q.includes('kedaikuma') ||
      q.includes('next loan') || q.includes('4th loan edukka') ||
      q.includes('loan eligibility enna') || q.includes('repayment score evlo') ||
      q.includes('score improve panna') || q.includes('enna pannanum')
    );

    if (isEligibilityQuery && currentUser?.id) {
      try {
        const eligibility = await api.member.getEligibility(currentUser.id);
        const {
          eligible,
          loanNumber,
          completedLoans,
          repaymentScore,
          remainingBalance,
          statusCode
        } = eligibility;

        // Specific sub-intent: How to improve score
        if (q.includes('improve') || q.includes('அதிகரிக்க') || q.includes('enna pannanum')) {
          if (isTa) {
            return `🌸 **உங்கள் தவணை ஒழுங்கு ஸ்கோரை (Repayment Score) அதிகரிக்க வழிகள்:**

1. **சரியான நேரத்தில் தவணை செலுத்துங்கள்:** ஒவ்வொரு தவணையையும் உரிய நாளுக்கு முன்னரே செலுத்துங்கள் (தாமதமாகும் ஒவ்வொரு நாளுக்கும் ₹50 அபராதம் மற்றும் -1 ஸ்கோர் குறையும்).
2. **முழு தவணைத் தொகையை செலுத்துங்கள்:** பகுதி தொகையாக (Partial payment) செலுத்தாமல் முழு தவணையையும் செலுத்துங்கள்.
3. **முந்தைய கடன்களை முழுதும் முடிப்பது:** முந்தைய கடன்களை ₹0 நிலுவையுடன் முடிக்கும் போது ஸ்கோர் உயரும்.
4. **தற்போதைய ஸ்கோர்:** உங்கள் தற்போதைய ஸ்கோர் **${repaymentScore}/100** (${eligibility.ratingCategory || ''}).
${completedLoans === 3 ? '💡 4-வது கடன் பெற குறைந்தபட்சம் **95/100** ஸ்கோர் தேவை!' : ''}`;
          } else {
            return `🌸 **How to Improve Your SHE AI Repayment Score:**

1. **Pay On-Time:** Pay your weekly or monthly installments on or before the due date. (Each overdue day causes a ₹50 penalty and -1 score reduction).
2. **Pay Exact Full Installments:** Avoid partial payments; clearing the full installment protects your score.
3. **Complete & Settle Loans:** Successfully closing loans with ₹0 remaining balance rewards your score.
4. **Current Performance:** Your live score is **${repaymentScore}/100** (${eligibility.ratingCategory || ''}).
${completedLoans === 3 ? '💡 A minimum repayment score of **95/100** is required to unlock Loan #4!' : ''}`;
          }
        }

        // Case 1: Active Loan exists with outstanding balance
        if (statusCode === 'ACTIVE_LOAN_EXISTS' || remainingBalance > 0) {
          if (isTa) {
            return `🌸 ${eligibility.reasonTa || eligibility.reason}`;
          } else {
            return `🌸 Your repayment score is ${repaymentScore}/100, but your current loan still has ₹${remainingBalance.toLocaleString('en-IN')} outstanding. Please complete the current loan before applying for another loan.`;
          }
        }

        // Case 2: 5th loan attempt under standard policy
        if (statusCode === 'MAX_LOANS_REACHED' || completedLoans >= 4) {
          if (isTa) {
            return `🌸 **5-வது கடன் கொள்கை அறிவிப்பு:**\n\nநிலையான கடன் கொள்கையின்படி, நீங்கள் ஏற்கனவே அதிகபட்சமாக 4 கடன்களை வெற்றிகரமாக முடித்துள்ளீர்கள். எனவே தானாக மற்றொரு கடன் வழங்கப்படாது. உங்களுக்கு சிறப்புத் தேவை இருப்பின், உங்கள் குழு தலைவர் அல்லது முதன்மை நிர்வாகியை (Super Admin Manual Review) தொடர்பு கொள்ளவும்.`;
          } else {
            return `🌸 Under the standard loan policy, you have completed 4 loans, so another loan is not automatically available. Please contact your Group Admin or authorized Super Admin if a policy-based review is required.`;
          }
        }

        // Case 3: 4th Loan Eligible
        if (loanNumber === 4 && eligible) {
          if (isTa) {
            return `🌸 **ஆம், நீங்கள் 4-வது கடனுக்கு (Loan #4) தகுதியுடையவர்!** 🎉\n\n- ⭐ **தவணை ஒழுங்கு ஸ்கோர்:** ${repaymentScore}/100 (தேவை: 95+)\n- 🏆 **முடிக்கப்பட்ட கடன்கள்:** ${completedLoans}\n- 💰 **தற்போதைய நிலுவை:** ₹0\n\nநீங்கள் இப்போது உங்கள் **My Loans** பகுதிக்குச் சென்று கடன் விண்ணப்பிக்கலாம்!`;
          } else {
            return `🌸 Yes, you are currently eligible for Loan #4.\nYour repayment score is ${repaymentScore}/100, you have completed 3 previous loans, and your current outstanding balance is ₹0.`;
          }
        }

        // Case 4: 4th Loan Not Eligible (score < 95)
        if (loanNumber === 4 && !eligible) {
          if (isTa) {
            return `🌸 நீங்கள் தற்போது அடுத்த கடனுக்கு தகுதியடையவில்லை.\nஉங்கள் தவணை ஒழுங்கு ஸ்கோர் **${repaymentScore}/100** ஆக உள்ளது, ஆனால் 4-வது கடன் பெற குறைந்தபட்சம் **95** ஸ்கோர் தேவை. முந்தைய நிலுவைகளை ஒழுங்காக செலுத்துவதன் மூலம் ஸ்கோரை உயர்த்தலாம்.`;
          } else {
            return `🌸 You are not currently eligible for another loan.\nYour repayment score is ${repaymentScore}/100, while a minimum score of 95 is required for the 4th loan.`;
          }
        }

        // Case 5: Loans 1, 2, 3 eligible
        if (eligible) {
          if (isTa) {
            return `🌸 ஆம், நீங்கள் **Loan #${loanNumber}**-க்கு தகுதியுடையவர்! உங்கள் தவணை ஒழுங்கு ஸ்கோர் ${repaymentScore}/100, முடிக்கப்பட்ட கடன்கள்: ${completedLoans}, தற்போதைய நிலுவை: ₹0.`;
          } else {
            return `🌸 Yes, you are currently eligible for Loan #${loanNumber}.\nYour repayment score is ${repaymentScore}/100, you have completed ${completedLoans} previous loan(s), and your current outstanding balance is ₹0.`;
          }
        }

        // Default backend response fallback
        return isTa
          ? `🌸 ${eligibility.reasonTa || eligibility.reason}`
          : `🌸 ${eligibility.reason}`;
      } catch (err) {
        console.warn('SHE AI failed to query loan eligibility:', err);
      }
    }

    // 0. Loan Amount + Weekly/Monthly EMI Calculation Request
    // Check digits or Tamil keywords
    let extractedAmount = null;
    const digitMatch = q.match(/(?:₹)?\s*([0-9,]{3,7})/);
    if (digitMatch) {
      extractedAmount = parseInt(digitMatch[1].replace(/,/g, ''), 10);
    } else if (q.includes('5000') || q.includes('5,000') || q.includes('ஐயாயிரம்')) {
      extractedAmount = 5000;
    } else if (q.includes('10000') || q.includes('10,000') || q.includes('பத்தாயிரம்')) {
      extractedAmount = 10000;
    } else if (q.includes('2000') || q.includes('2,000') || q.includes('இரண்டாயிரம்')) {
      extractedAmount = 2000;
    }

    const isWeeklyRequest = q.includes('week') || q.includes('weekly') || q.includes('வார') || q.includes('வாரம்') || q.includes('வாரத்துக்கு');
    const isMonthlyRequest = q.includes('month') || q.includes('monthly') || q.includes('மாத') || q.includes('மாதம்');
    const isCalcRequest = q.includes('calculate') || q.includes('calc') || q.includes('கால்குலேட்') || q.includes('கணக்கு') || q.includes('சொல்லு') || q.includes('emi') || q.includes('வேணும்') || q.includes('வேண்டும்') || q.includes('loan') || q.includes('கடன்') || q.includes('தவணை');

    if (extractedAmount && (isWeeklyRequest || isMonthlyRequest || isCalcRequest)) {
      const principal = extractedAmount;
      const annualRate = 0.12; // 12% annual
      const forceWeekly = !isMonthlyRequest; // Default to weekly for SHG microloans

      if (isWeeklyRequest || forceWeekly) {
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

    // 1. How to Apply for a Loan (Specific guidance requested by user)
    if (
      q.includes('எப்படி') && (q.includes('லோன்') || q.includes('கடன்') || q.includes('அப்ளை')) ||
      q.includes('how to apply') || q.includes('apply for loan') || q.includes('apply loan') ||
      q.includes('விண்ணப்பிப்பது எப்படி') || q.includes('விண்ணப்பிக்க வேண்டும்')
    ) {
      if (isTa) {
        return `📝 **மகளிர் குழுவில் கடன் விண்ணப்பிக்கும் எளிய வழிமுறைகள்:**

1. **டாஷ்போர்டில் "Loan Application" கிளிக் செய்யவும்:** உங்கள் முகப்பு பக்கத்தில் உள்ள **"கடன் விண்ணப்பம்"** அல்லது **"My Loans"** பகுதிக்குச் சென்று **+ Apply Loan** பொத்தானை அழுத்தவும்.
2. **தொகை & தவணை முறை தேர்வு:** ₹1,000 முதல் ₹10,000 வரை தேவைப்படும் தொகையைத் தேர்ந்தெடுத்து, **வாராந்திர (Weekly)** அல்லது **மாதாந்திர (Monthly)** தவணையை தேர்வு செய்யவும்.
3. **வழங்கல் முறை (Payment Mode):** 
   - **Cash (ரொக்கம்):** குழு தலைவரிடம் நேரடியாகப் பெற.
   - **UPI:** உங்கள் பதிவு செய்யப்பட்ட மின்னஞ்சல் முகவரியுடன் உடனடி பணப்பரிவர்த்தனைக்கு.
4. **3-நிலை அனுமதி:**
   - உங்கள் விண்ணப்பம் முதலில் உங்கள் **குழு தலைவரிடம் (Group Admin)** செல்லும்.
   - குழு தலைவர் சரிபார்த்து **முதன்மை நிர்வாகிக்கு (Super Admin)** பரிந்துரைப்பார்.
   - முதன்மை நிர்வாகி ஒப்புதல் வழங்கியதும் உங்களுக்கு மின்னஞ்சல் மற்றும் ரசீதுடன் கடன் கணக்கு எண் உருவாக்கப்படும்!

💡 *குறிப்பு: நீங்கள் ஏற்கனவே வாங்கிய கடனை முழுமையாக செலுத்திய பின்னரே அடுத்த கடனுக்கு விண்ணப்பிக்க முடியும்.*`;
      } else {
        return `📝 **How to Apply for a Loan in Magalir Kuzhu Portal:**

1. **Click "Apply Loan":** Go to your **My Loans** tab or click the **Apply Loan** button on your dashboard.
2. **Select Amount & Frequency:** Enter loan amount (up to ₹10,000) and choose **Weekly** (8, 10, or 12 weeks) or **Monthly** (3, 6, or 12 months) frequency.
3. **Choose Disbursement Mode:** Select **Cash** (direct from Group Admin) or **UPI** (using your registered verified email).
4. **3-Tier Approval Flow:**
   - **Stage 1:** Application submitted to your **Group Admin** for initial review.
   - **Stage 2:** Forwarded to **Super Admin** for final sanction.
   - **Stage 3:** Official Sanction Letter with Loan Account Number is emailed to you and funds are disbursed!

💡 *Note: Only members without an active ongoing loan can submit a new loan request.*`;
      }
    }

    // 2. Loan Limits & Rules
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

    // Repayment Score & Privacy Inquiry
    if (q.includes('score') || q.includes('ஸ்கோர்') || q.includes('மதிப்பெண்') || q.includes('credit score') || q.includes('penalty')) {
      if (isTa) {
        return `📊 **தவணை ஒழுங்கு ஸ்கோர் & அபராதம் (Repayment Score & Policy):**

1. **ஸ்கோர் விவரம்:** ஒவ்வொரு உறுப்பினரின் ஆரம்ப ஸ்கோர் **100/100**. தவணையை உரிய தேதியில் செலுத்தினால் ஸ்கோர் குறையாது!
2. **தாமதக் கட்டணம் & ஸ்கோர் இழப்பு:** தவணை தவறிய ஒவ்வொரு நாளுக்கும் **₹50 தினசரி அபராதம்** மற்றும் **-1 ஸ்கோர்** குறைக்கப்படும்.
3. **பாதுகாப்பு & தனிஉரிமை:** உங்கள் தனிப்பட்ட ஸ்கோரை நீங்கள் மற்றும் சூப்பர் அட்மின் மட்டுமே பார்க்க முடியும். பிற உறுப்பினர்களின் தனிப்பட்ட ஸ்கோரை AI அல்லது பிறர் பார்க்க இயலாது.
4. **ஸ்கோர் மீட்க:** நிலுவைத் தொகையை முழுமையாக செலுத்துவதன் மூலம் கூடுதல் அபராதத்தைத் தவிர்க்கலாம். ஸ்கோர் எப்போதும் 0-க்குக் கீழ் குறையாது!`;
      } else {
        return `📊 **Repayment Score & Overdue Penalty Rules:**

1. **Initial Score:** Every member starts with a perfect **100/100** repayment score. On-time repayments preserve your score.
2. **Overdue Penalty & Score Impact:** For each overdue day, a daily penalty of **₹50/day** applies and your score reduces by **1 point/day**.
3. **Strict Privacy:** Your repayment score is private and only visible to you and the Super Admin. SHE AI strictly protects member privacy and never discloses any member's score to others.
4. **Floor Limit:** Scores never go below 0 (zero). Paying overdue installments immediately stops future daily penalties!`;
      }
    }

    // 5. Repayment Tracking & Ledger Inquiries
    if (q.includes('repay') || q.includes('ledger') || q.includes('ரசீது') || q.includes('தவணை செலுத்துவது') || q.includes('கட்டிய தொகை') || q.includes('மீதி') || q.includes('balance') || q.includes('due')) {
      if (isTa) {
        return `💳 **தவணை செலுத்துதல் மற்றும் கணக்கு ஏடு (Repayment & Ledger):**

1. **தவணை அட்டவணையைப் பார்க்க:** உங்கள் **"My Loans"** பகுதிக்குச் சென்று, உங்கள் கடனுக்கு அருகில் உள்ள **"Ledger"** பொத்தானை அழுத்தவும்.
2. **அசல் மற்றும் வட்டி விவரம்:** ஒவ்வொரு தவணையிலும் நீங்கள் செலுத்திய அசல், வட்டி மற்றும் மீதமுள்ள இருப்பு தொகை தெளிவாக பட்டியலிடப்பட்டிருக்கும்.
3. **செலுத்தும் முறை:**
   - **குழு தலைவரிடம் ரொக்கம் (Cash):** குழு தலைவரிடம் பணம் செலுத்தியதும் உடனடியாக உங்கள் கணக்கில் பதிவு செய்யப்பட்டு ரசீது உருவாக்கப்படும்.
   - **UPI முறை:** வங்கி / யுபிஐ மூலம் நேரடியாக செலுத்தி ரசீது எண்ணைப் பெறலாம்.
4. **தானியங்கி ரசீது:** பணம் செலுத்தப்பட்ட உடனேயே அதிகாரப்பூர்வ ரசீது எண் (MK-RCP-...) உருவாக்கப்பட்டு மின்னஞ்சல் அனுப்பப்படும்!`;
      } else {
        return `💳 **Loan Repayments & Live Ledger Tracking:**

1. **View Full Ledger:** Go to your **My Loans** tab and click the green **Ledger** button next to your disbursed loan.
2. **Principal & Interest Breakdown:** Every installment displays principal paid, interest paid, and remaining balance under reducing-balance terms.
3. **Payment Modes:** Pay via Cash directly to your Group Admin or online via UPI.
4. **Official Receipts:** Upon payment recording, an official receipt number (MK-RCP-...) is generated and dispatched to your email!`;
      }
    }

    // 6. Tamil Nadu Government Schemes for SHGs
    if (q.includes('scheme') || q.includes('திட்டம்') || q.includes('அரசு') || q.includes('மானியம்') || q.includes('subsidy') || q.includes('வங்கி')) {
      if (isTa) {
        return `🏛️ **தமிழ்நாடு மகளிர் சுய உதவிக் குழு அரசு நலத்திட்டங்கள்:**

1. **வாழ்ந்து காட்டுவோம் திட்டம் (TNSRLM):** கிராமப்புற பெண்களின் தொழில் முனைவு மற்றும் குறைந்த வட்டி கடன் உதவி.
2. **முதலமைச்சரின் சிறுதொழில் கடன் மானியம்:** சுய தொழில் தொடங்கும் மகளிருக்கு 25% முதல் 35% வரை மானியம்.
3. **கலைஞர் மகளிர் உரிமைத் திட்டம்:** தகுதிவாய்ந்த குடும்பத் தலைவிகளுக்கு மாதம் ₹1,000 உரிமைத் தொகை.
4. **வங்கி இணைப்பு கடன் (Bank Linkage):** தொடர் சேமிப்பு மற்றும் தவணை சரியாக செலுத்தும் குழுக்களுக்கு ₹5 லட்சம் முதல் ₹20 லட்சம் வரை குறைந்த வட்டியில் வங்கிக் கடன்!`;
      } else {
        return `🏛️ **Tamil Nadu Government Support & SHG Schemes:**

1. **TNSRLM (Pudhu Vaazhvu):** Tamil Nadu State Rural Livelihoods Mission offering financial inclusion & skill grants.
2. **Micro-Enterprise Subsidies:** 25% to 35% capital subsidy for women-led cottage industries and dairy farming.
3. **Kalaignar Magalir Urimai Thittam:** Direct monthly empowerment benefit of ₹1,000 for eligible women heads of households.
4. **Bank Credit Linkage:** Groups with consistent savings & repayment records qualify for formal bank loans from ₹5 Lakhs up to ₹20 Lakhs!`;
      }
    }

    // 7. Group Admin Loan Request Direct to Super Admin
    if (q.includes('group admin') || q.includes('தலைவர் கடன்') || q.includes('தலைவர் லோன்') || q.includes('admin loan') || (q.includes('தலைவர்') && q.includes('கடன்'))) {
      if (isTa) {
        return `👑 **குழு தலைவர் கடன் விண்ணப்பம் (Direct Super Admin Loan):**
- குழு தலைவர்களும் (Group Admin) தொழில் மற்றும் வாழ்வாதார தேவைகளுக்காக கடன் கோரலாம்.
- குழு தலைவர் டாஷ்போர்டில் உள்ள **"+ Request Loan Amount"** பொத்தானை அழுத்தி விண்ணப்பிக்கலாம்.
- இந்த விண்ணப்பம் நேரடியாக **முதன்மை நிர்வாகிக்கு (Super Admin)** ஒப்புதலுக்காகவும் நிதி வழங்கலுக்காகவும் செல்லும்!`;
      } else {
        return `👑 **Group Admin Loan Request Flow:**
- Group Admins can also request loans for business development or self-help enterprises.
- Click the **"+ Request Loan Amount"** button on the Group Admin Dashboard.
- The request bypasses group review and is routed **directly to the Super Admin** for sanction and disbursement!`;
      }
    }

    // 8. Group Chat & Delete Message
    if (q.includes('chat') || q.includes('delete') || q.includes('நீக்க') || q.includes('அரட்டை') || q.includes('மெசேஜ்') || q.includes('குழு அரட்டை') || q.includes('பேசுவது')) {
      if (isTa) {
        return `💬 **குழு அரட்டை மற்றும் செய்தி நீக்குதல் (Live Chat & Message Deletion):**

1. **குரல் உள்ளீடு (Voice-to-Text):** மெசேஜ் பாக்ஸில் உள்ள மைக் பொத்தானை அழுத்தி பேசி நேரடியாக டைப் செய்யலாம்!
2. **செய்தியை நீக்குவது எப்படி? (Delete Message):**
   - நீங்கள் அனுப்பிய செய்திக்கு அருகில் உள்ள **Trash (குப்பைத்தொட்டி)** ஐகானை கிளிக் செய்து நீக்கலாம்.
   - முதன்மை நிர்வாகி (Super Admin) மற்றும் குழு தலைவர் (Group Admin) எந்த தகவலையும் நீக்க முடியும்.
3. **பாதுகாப்பான உரையாடல்:** கூட்டங்கள், சேமிப்பு விவரங்கள் மற்றும் ஆலோசனைகளை நேரலையாக பகிரலாம்!`;
      } else {
        return `💬 **Real-Time Group Chat & Message Deletion:**

1. **Voice-to-Text Microphone:** Press the mic symbol inside the message input field to speak, and your words will type automatically!
2. **Deleting Messages:**
   - Click the red/grey **Trash icon** next to any message you sent to delete it.
   - Admins can delete any inappropriate or redundant messages in the group.
3. **Instant Community Collaboration:** Share meeting alerts, savings reminders, and queries securely in real-time!`;
      }
    }

    // 8. Default General Response
    if (isTa) {
      return `🤝 வணக்கம்! நான் **SHE AI** – மகளிர் சுய உதவிக் குழு உதவியாளர்.\n\nநீங்கள் கேட்டது: "${userQuery}"\n\n📋 **என்னால் உதவக்கூடிய முக்கிய தலைப்புகள்:**\n- 📝 கடன் விண்ணப்பிப்பது எப்படி? (வழிகாட்டுதல்)\n- 🧮 EMI கணக்கீடு (எ.கா: ₹5000 கடன் 10 வாரம்)\n- 💳 தவணை செலுத்துதல் மற்றும் லெட்ஜர் ரசீதுகள்\n- 🔄 3-நிலை கடன் ஒப்புதல் செயல்முறை\n- 🏛️ தமிழ்நாடு மகளிர் நலத்திட்டங்கள் & மானியங்கள்\n- 🚨 அவசர உதவி எண்கள் (181, 112, 108)\n\nகேள்வியை கேளுங்கள் – சரியான பதில் தருகிறேன்! 😊`;
    } else {
      return `🤝 Hello! I am **SHE AI** – your Self-Help Group Smart Assistant.\n\nYou asked: "${userQuery}"\n\n📋 **Topics I am trained on:**\n- 📝 How to apply for a loan (Step-by-step)\n- 🧮 Reducing-balance EMI calculation (e.g. ₹5,000 weekly/monthly)\n- 💳 Repayment schedules & official receipts\n- 🔄 3-tier approval pipeline\n- 🏛️ Tamil Nadu SHG Government schemes & subsidies\n- 🚨 SOS & Emergency helplines (181, 112, 108)\n\nFeel free to ask any specific question! 😊`;
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
      {/* Floating Trigger Button - Small Unique Symbol */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 1100,
            background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #0d9488 100%)',
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.85)',
            borderRadius: '50%',
            width: '46px',
            height: '46px',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px -3px rgba(4, 120, 87, 0.5), 0 4px 8px -2px rgba(13, 148, 136, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.22s ease'
          }}
          className="she-ai-trigger"
          title={lang === 'ta' ? 'SHE AI உதவியாளரைத் திறக்கவும்' : 'Open SHE AI Assistant'}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.12) translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(4, 120, 87, 0.65)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 20px -3px rgba(4, 120, 87, 0.5), 0 4px 8px -2px rgba(13, 148, 136, 0.3)';
          }}
        >
          {/* Unique Micro Symbol */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1
          }}>
            <Sparkles size={13} color="#a7f3d0" style={{ marginBottom: '1px' }} />
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              fontWeight: 900,
              fontSize: '0.74rem',
              letterSpacing: '0.01em',
              color: '#ffffff'
            }}>
              <span>SHE</span>
              <span style={{
                fontSize: '0.48rem',
                color: '#6ee7b7',
                fontWeight: 800,
                marginLeft: '1px'
              }}>
                ai
              </span>
            </div>
          </div>

          {/* Active Status Pulse Dot */}
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            border: '2px solid #ffffff',
            boxShadow: '0 0 6px #10b981'
          }} />
        </button>
      )}

      {/* Floating Chat Modal - Positioned at Top Right */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: '75px',
          right: '24px',
          width: '420px',
          maxWidth: 'calc(100vw - 32px)',
          height: '590px',
          maxHeight: 'calc(100vh - 90px)',
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
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'baseline',
                    fontWeight: 900,
                    fontSize: '1.2rem',
                    letterSpacing: '-0.01em',
                    color: '#ffffff'
                  }}>
                    <span>SHE</span>
                    <sup style={{
                      fontSize: '0.7rem',
                      color: '#a7f3d0',
                      fontWeight: 800,
                      marginLeft: '2px',
                      top: '-0.45em'
                    }}>
                      Ai
                    </sup>
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 700
                  }}>
                    Active
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#d1fae5' }}>
                  {lang === 'ta' ? 'மகளிர் சுய உதவிக் குழு வழிகாட்டி' : 'Self-Help Group Knowledge Guide'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {/* Stop Speaking / Mute Button */}
              <button
                type="button"
                onClick={stopSpeaking}
                style={{
                  background: isSpeaking ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
                  border: isSpeaking ? '1px solid #ffffff' : 'none',
                  color: '#ffffff',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease'
                }}
                title={lang === 'ta' ? 'பேசுவதை உடனடியாக நிறுத்து' : 'Stop speaking voice'}
              >
                <Square size={11} fill="#ffffff" />
                <span>{lang === 'ta' ? 'Stop (நிறுத்து)' : 'Stop Voice'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setIsOpen(false);
                }}
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
                title={lang === 'ta' ? 'அரட்டையை மூடு மற்றும் பேச்சை நிறுத்து' : 'Close and stop talking'}
              >
                <X size={18} />
              </button>
            </div>
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
