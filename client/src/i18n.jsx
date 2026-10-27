import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Branding
    app_title: 'Magalir Connect AI',
    app_full_title: 'Magalir Connect AI: A Smart Loan and Group Management System for Rural Women’s Self-Help Groups with Tamil',
    app_tamil_title: 'மகளிர் கனெக்ட் AI',
    portal_sub: 'A Smart Loan & Group Management System for Rural Women’s SHGs',
    
    // Auth & Navigation
    signin: 'Sign In',
    signup: 'Register Member',
    logout: 'Sign Out',
    login_title: 'Welcome Back',
    login_subtitle: 'Access your Self-Help Group account & financial records',
    register_title: 'New Member Onboarding',
    register_subtitle: 'Join your local Self-Help Group community',
    email_label: 'Email Address',
    password_label: 'Password',
    full_name_label: 'Full Name (as per Aadhaar)',
    phone_label: 'Phone Number (10 digits)',
    area_label: 'Area / Village / Ward',
    district_label: 'District',
    notifications: 'Notifications',
    mark_all_read: 'Mark all as read',
    no_notifications: 'No new notifications',

    // Role Badges
    role_super_admin: 'SUPER ADMIN',
    role_group_admin: 'GROUP ADMIN',
    role_user: 'SHG MEMBER',

    // Super Admin Dashboard Tabs
    tab_overview: 'Master Overview',
    tab_pending_users: 'Pending Registrations',
    tab_loans: 'Loan Workflow',
    tab_groups: 'Groups & Chatrooms',
    tab_users: 'Members Directory',
    tab_broadcast: 'Broadcast Announcements',
    tab_email_logs: 'Email Dispatch Audit',

    // Metrics
    metric_total_members: 'Total Members',
    metric_active_groups: 'Active Groups',
    metric_sanctioned_funds: 'Sanctioned Funds',
    metric_disbursed_funds: 'Disbursed Funds',
    metric_collected_funds: 'Total Repayments Collected',
    metric_outstanding: 'Total Outstanding Balance',
    metric_overdue: 'Overdue Loans',
    metric_action_required: 'Action Required',

    // 4-Stage Loan Pipeline
    pipeline_title: '4-Stage Loan Approval & Disbursal Pipeline',
    stage_1: 'Stage 1: Group Admin Review',
    stage_1_sub: 'Applications submitted by members awaiting Group Admin check',
    stage_2: 'Stage 2: Super Admin Final Sanction',
    stage_2_sub: 'Recommended by Group Admin, ready for official sanction & email dispatch',
    stage_3: 'Stage 3: Sanctioned (Awaiting Disbursal)',
    stage_3_sub: 'Officially approved loans ready for separate fund disbursement',
    stage_4: 'Stage 4: Disbursed & Repayment Active',
    stage_4_sub: 'Funds credited to member; repayment schedule actively running',

    // Loan Application
    apply_loan_title: 'Apply for Magalir Kuzhu Loan',
    loan_amount_label: 'Requested Principal Amount (₹)',
    loan_amount_hint: 'Maximum limit per application: ₹10,000 as per SHG policy',
    purpose_label: 'Purpose of Loan',
    frequency_label: 'Repayment Frequency',
    freq_weekly: 'Weekly Repayments',
    freq_monthly: 'Monthly Repayments',
    tenure_label: 'Tenure Duration',
    first_due_label: 'Preferred First Due Date',
    payment_mode_label: 'Disbursal & Verification Mode',
    mode_upi: 'UPI Transfer (Direct to VPA / Bank)',
    mode_cash: 'Cash Disbursal via Group Admin',
    upi_email_verify: 'Verify Registered Email (for UPI disbursal confirmation)',
    notes_label: 'Additional Notes / Comments',
    submit_application: 'Submit Loan Application',
    calculating: 'Calculating terms...',

    // Active Loan Rule
    active_loan_title: 'Previous Loan is Currently Active',
    active_loan_msg: 'Your previous loan is still active. Please complete the repayment of your existing loan before applying for another loan. You can track your remaining balance and next repayment date from the My Loans section.',
    loan_acc_no: 'Loan Account Number',
    sanctioned_amount: 'Sanctioned Amount',
    total_repaid: 'Total Repaid So Far',
    remaining_balance: 'Remaining Balance',
    next_due_date: 'Next Due Date',
    view_ledger: 'View Repayment Ledger',
    fully_repaid: 'Fully Repaid 🎉',

    // Calculator
    calc_title: 'Interactive Live Loan Calculator',
    calc_subtitle: 'Calculate reducing-balance weekly or monthly EMI with detailed schedule preview',
    interest_rate: 'Annual Interest Rate (%)',
    estimated_emi: 'Calculated Instalment (EMI)',
    total_interest: 'Total Interest Payable',
    total_repayment: 'Total Repayment Amount',
    schedule_preview: 'Amortization Schedule Preview',
    inst_no: 'Instalment #',
    due_date: 'Due Date',
    opening_bal: 'Opening Bal',
    inst_amount: 'Instalment',
    principal_portion: 'Principal',
    interest_portion: 'Interest',
    closing_bal: 'Closing Bal',
    status_label: 'Status',

    // Disbursal Modal
    disburse_modal_title: 'Authorize Loan Disbursement',
    disburse_modal_sub: 'Separate disbursement action available only to authorized Super Admins',
    disburse_amount: 'Disbursement Amount (₹)',
    disburse_method: 'Disbursement Method',
    txn_ref: 'Transaction Reference / UTR Number',
    confirm_disburse: 'Confirm & Disburse Funds',

    // Repayment Recording
    record_repayment_title: 'Record Member Repayment',
    record_repayment_sub: 'Record weekly or monthly repayments against active loan schedule',
    amount_received: 'Amount Received (₹)',
    payment_method: 'Payment Method',
    method_cash: 'CASH',
    method_upi: 'UPI (Recorded)',
    payment_date: 'Payment Date',
    confirm_payment: 'Save Repayment & Dispatch Receipt',
    receipt_no: 'Receipt Number',

    // Common
    cancel: 'Cancel',
    close: 'Close',
    actions: 'Actions',
    loading: 'Loading data...',
    success: 'Operation completed successfully!',
    error: 'An error occurred',
    sanction_btn: 'Sanction Loan',
    disburse_btn: 'Disburse Funds',
    forward_btn: 'Forward to Super Admin',
    reject_btn: 'Reject Application',
    reason_prompt: 'Please enter the reason for rejection:'
  },
  ta: {
    // Branding
    app_title: 'மகளிர் கனெக்ட் AI: கிராமப்புற மகளிர் சுய உதவிக் குழுக்களுக்கான ஸ்மார்ட் கடன் மற்றும் குழு மேலாண்மை அமைப்பு',
    app_full_title: 'மகளிர் கனெக்ட் AI: கிராமப்புற மகளிர் சுய உதவிக் குழுக்களுக்கான ஸ்மார்ட் கடன் மற்றும் குழு மேலாண்மை அமைப்பு (தமிழ் வழிகாட்டலுடன்)',
    app_tamil_title: 'மகளிர் கனெக்ட் AI',
    portal_sub: 'கிராமப்புற மகளிர் சுய உதவிக் குழுக்களுக்கான ஸ்மார்ட் கடன் மற்றும் குழு மேலாண்மை அமைப்பு',
    
    // Auth & Navigation
    signin: 'உள்நுழைக',
    signup: 'புதிய உறுப்பினர் பதிவு',
    logout: 'வெளியேறு',
    login_title: 'மீண்டும் வருக',
    login_subtitle: 'உங்கள் சுய உதவிக் குழு கணக்கு மற்றும் நிதிப் பதிவுகளை அணுகவும்',
    register_title: 'புதிய உறுப்பினர் சேர்ப்பு',
    register_subtitle: 'உங்கள் பகுதி மகளிர் சுய உதவிக் குழுவில் இணையுங்கள்',
    email_label: 'மின்னஞ்சல் முகவரி',
    password_label: 'கடவுச்சொல்',
    full_name_label: 'முழுப் பெயர் (ஆதார் படி)',
    phone_label: 'கைபேசி எண் (10 இலக்கங்கள்)',
    area_label: 'பகுதி / கிராமம் / வார்டு',
    district_label: 'மாவட்டம்',
    notifications: 'அறிவிப்புகள்',
    mark_all_read: 'அனைத்தையும் படித்ததாகக் குறி',
    no_notifications: 'புதிய அறிவிப்புகள் இல்லை',

    // Role Badges
    role_super_admin: 'முதன்மை நிர்வாகி',
    role_group_admin: 'குழு நிர்வாகி',
    role_user: 'குழு உறுப்பினர்',

    // Super Admin Dashboard Tabs
    tab_overview: 'முதன்மை மேலோட்டம்',
    tab_pending_users: 'நிலுவையில் உள்ள பதிவுகள்',
    tab_loans: 'கடன் ஒப்புதல் செயல்முறை',
    tab_groups: 'குழுக்கள் மற்றும் அரட்டை',
    tab_users: 'உறுப்பினர்கள் பட்டியல்',
    tab_broadcast: 'அறிவிப்பு ஒளிபரப்பு',
    tab_email_logs: 'மின்னஞ்சல் தணிக்கை',

    // Metrics
    metric_total_members: 'மொத்த உறுப்பினர்கள்',
    metric_active_groups: 'செயலில் உள்ள குழுக்கள்',
    metric_sanctioned_funds: 'அனுமதிக்கப்பட்ட நிதி',
    metric_disbursed_funds: 'வழங்கப்பட்ட நிதி',
    metric_collected_funds: 'வசூலிக்கப்பட்ட மொத்த தொகை',
    metric_outstanding: 'மீதமுள்ள நிலுவைத் தொகை',
    metric_overdue: 'தாமதமான கடன்கள்',
    metric_action_required: 'நடவடிக்கை தேவை',

    // 4-Stage Loan Pipeline
    pipeline_title: '4-நிலை கடன் ஒப்புதல் மற்றும் வழங்கல் செயல்முறை',
    stage_1: 'நிலை 1: குழு நிர்வாகி சரிபார்ப்பு',
    stage_1_sub: 'உறுப்பினர்கள் விண்ணப்பித்த கடன்கள் குழு நிர்வாகி ஆய்வில்',
    stage_2: 'நிலை 2: முதன்மை நிர்வாகி ஒப்புதல்',
    stage_2_sub: 'குழு நிர்வாகி பரிந்துரைத்த கடன்கள் இறுதி அனுமதிக்காக',
    stage_3: 'நிலை 3: அனுமதிக்கப்பட்டது (வழங்கப்பட வேண்டியவை)',
    stage_3_sub: 'அனுமதிக்கப்பட்டு நிதி வழங்கலுக்கு தயாராக உள்ள கடன்கள்',
    stage_4: 'நிலை 4: வழங்கப்பட்டது & செயலில்',
    stage_4_sub: 'பணம் வழங்கப்பட்டு தவணைத் திருப்பிச் செலுத்துதல் செயலில் உள்ளது',

    // Loan Application
    apply_loan_title: 'மகளிர் குழு கடனுக்கு விண்ணப்பிக்கவும்',
    loan_amount_label: 'கோரப்படும் கடன் தொகை (₹)',
    loan_amount_hint: 'அதிகபட்ச கடன் வரம்பு: ₹10,000 (மகளிர் குழு கொள்கைப்படி)',
    purpose_label: 'கடனின் நோக்கம்',
    frequency_label: 'திருப்பிச் செலுத்தும் இடைவெளி',
    freq_weekly: 'வாராந்திர தவணை',
    freq_monthly: 'மாதாந்திர தவணை',
    tenure_label: 'கடன் காலம்',
    first_due_label: 'முதல் தவணை செலுத்த விரும்பும் தேதி',
    payment_mode_label: 'வழங்கல் & சரிபார்ப்பு முறை',
    mode_upi: 'யுபிஐ (UPI பரிமாற்றம்)',
    mode_cash: 'ரொக்கம் (குழு நிர்வாகி மூலம்)',
    upi_email_verify: 'பதிவுசெய்த மின்னஞ்சலை சரிபார்க்கவும் (UPI உறுதிப்படுத்தலுக்கு)',
    notes_label: 'கூடுதல் குறிப்புகள்',
    submit_application: 'கடன் விண்ணப்பத்தை சமர்ப்பிக்கவும்',
    calculating: 'கணக்கிடப்படுகிறது...',

    // Active Loan Rule
    active_loan_title: 'முந்தைய கடன் இன்னும் செயலில் உள்ளது',
    active_loan_msg: 'உங்கள் முந்தைய கடன் இன்னும் செயலில் உள்ளது. புதிய கடனுக்கு விண்ணப்பிக்கும் முன் முந்தைய கடனை முழுமையாக திருப்பிச் செலுத்துங்கள். மீதமுள்ள நிலுவைத் தொகையை நீங்கள் எனது கடன்கள் பிரிவில் பார்க்கலாம்.',
    loan_acc_no: 'கடன் கணக்கு எண்',
    sanctioned_amount: 'அனுமதிக்கப்பட்ட தொகை',
    total_repaid: 'இதுவரை செலுத்திய தொகை',
    remaining_balance: 'மீதமுள்ள நிலுவைத் தொகை',
    next_due_date: 'அடுத்த தவணை தேதி',
    view_ledger: 'கணக்கு ஏட்டைப் பார்க்க',
    fully_repaid: 'முழுமையாக செலுத்தப்பட்டது 🎉',

    // Calculator
    calc_title: 'நேரடி கடன் கால்குலேட்டர்',
    calc_subtitle: 'வாராந்திர அல்லது மாதாந்திர தவணைத் தொகையை துல்லியமாக கணக்கிடுங்கள்',
    interest_rate: 'ஆண்டு வட்டி விகிதம் (%)',
    estimated_emi: 'மதிப்பிடப்பட்ட தவணைத் தொகை (EMI)',
    total_interest: 'மொத்த வட்டித் தொகை',
    total_repayment: 'மொத்த திருப்பிச் செலுத்தும் தொகை',
    schedule_preview: 'தவணை அட்டவணை முன்னோட்டம்',
    inst_no: 'தவணை #',
    due_date: 'செலுத்த வேண்டிய தேதி',
    opening_bal: 'ஆரம்ப இருப்பு',
    inst_amount: 'தவணைத் தொகை',
    principal_portion: 'அசல்',
    interest_portion: 'வட்டி',
    closing_bal: 'இறுதி இருப்பு',
    status_label: 'நிலை',

    // Disbursal Modal
    disburse_modal_title: 'கடன் தொகையை வழங்க அனுமதித்தல்',
    disburse_modal_sub: 'முதன்மை நிர்வாகியால் மட்டுமே நிதி வழங்கலை உறுதிப்படுத்த முடியும்',
    disburse_amount: 'வழங்கப்படும் தொகை (₹)',
    disburse_method: 'வழங்கும் முறை',
    txn_ref: 'பரிவர்த்தனை குறிப்பு எண் (UTR)',
    confirm_disburse: 'உறுதிசெய்து நிதியை வழங்குக',

    // Repayment Recording
    record_repayment_title: 'உறுப்பினர் தவணை பதிவு',
    record_repayment_sub: 'வாராந்திர அல்லது மாதாந்திர தவணைகளை கடன் அட்டவணையில் பதிவு செய்க',
    amount_received: 'பெறப்பட்ட தொகை (₹)',
    payment_method: 'செலுத்தும் முறை',
    method_cash: 'ரொக்கம்',
    method_upi: 'யுபிஐ (பதிவு செய்யப்பட்டது)',
    payment_date: 'செலுத்திய தேதி',
    confirm_payment: 'பதிவு செய்து ரசீது அனுப்புக',
    receipt_no: 'ரசீது எண்',

    // Common
    cancel: 'ரத்து செய்',
    close: 'மூடுக',
    actions: 'நடவடிக்கைகள்',
    loading: 'தரவு ஏற்றப்படுகிறது...',
    success: 'வெற்றிகரமாக முடிந்தது!',
    error: 'பிழை ஏற்பட்டது',
    sanction_btn: 'கடன் அனுமதி',
    disburse_btn: 'நிதி வழங்கு',
    forward_btn: 'முதன்மை நிர்வாகிக்கு பரிந்துரை',
    reject_btn: 'நிராகரி',
    reason_prompt: 'நிராகரிப்பதற்கான காரணத்தை உள்ளிடவும்:'
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('mk_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('mk_lang', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'ta' : 'en'));
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
