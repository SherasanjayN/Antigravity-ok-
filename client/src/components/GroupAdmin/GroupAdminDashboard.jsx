import React, { useState, useEffect } from 'react';
import {
  Users,
  IndianRupee,
  MessageSquare,
  Megaphone,
  CheckCircle2,
  XCircle,
  Building2,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  FileText,
  CreditCard,
  AlertCircle,
  Calculator,
  Plus,
  BarChart3,
  PieChart,
  TrendingUp
} from 'lucide-react';
import { api } from '../../services/api';
import GroupChat from '../GroupChat';
import AnnouncementsFeed from '../AnnouncementsFeed';
import StatusBadge from '../StatusBadge';
import RepaymentLedgerModal from '../RepaymentLedgerModal';
import LoanCalculatorModal from '../LoanCalculatorModal';
import ValidatedVoiceField from '../VoiceInput/ValidatedVoiceField';
import { useLanguage } from '../../i18n';

export default function GroupAdminDashboard({ currentUser }) {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('loans');
  const [groupData, setGroupData] = useState(null);
  const [loans, setLoans] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [groupAnalytics, setGroupAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reject Modal
  const [rejectLoan, setRejectLoan] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Repayment Ledger Modal
  const [selectedLedgerLoanId, setSelectedLedgerLoanId] = useState(null);

  // Group Admin Loan Request Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [amount, setAmount] = useState(5000);
  const [purpose, setPurpose] = useState('SHG Enterprise & Group Admin Livelihood Expansion');
  const [frequency, setFrequency] = useState('WEEKLY');
  const [tenure, setTenure] = useState(10);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [upiEmail, setUpiEmail] = useState('');
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanFormError, setLoanFormError] = useState('');

  const handleApplyLoan = async (e) => {
    e.preventDefault();
    setLoanFormError('');

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setLoanFormError('Please enter a valid loan amount.');
      return;
    }

    if (numAmount > 10000) {
      setLoanFormError('Maximum loan limit is ₹10,000 per request as per policy.');
      return;
    }

    if (paymentMode === 'UPI') {
      if (!upiEmail.trim()) {
        setLoanFormError('Please enter your registered email ID to verify your UPI account.');
        return;
      }
      if (upiEmail.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
        setLoanFormError(`UPI Verification Failed: Entered email must match your registered email (${currentUser.email}).`);
        return;
      }
    }

    setSubmittingLoan(true);
    try {
      const res = await api.groupAdmin.applyLoan({
        amount: numAmount,
        purpose,
        repayment_frequency: frequency,
        tenure_value: tenure,
        payment_mode: paymentMode,
        upi_email: paymentMode === 'UPI' ? upiEmail.trim() : null
      });

      setActionSuccess(res.message || 'Loan request submitted directly to Super Admin for sanction.');
      setShowApplyModal(false);
      setAmount(5000);
      setUpiEmail('');
      await loadData();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setLoanFormError(err.message || 'Failed to submit loan application.');
    } finally {
      setSubmittingLoan(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [gData, lData, aData, gaData] = await Promise.all([
        api.groupAdmin.getMyGroup(),
        api.groupAdmin.getLoans(),
        api.announcements.getAll(),
        api.groupAdmin.getAnalytics().catch(() => null)
      ]);
      setGroupData(gData);
      setLoans(lData);
      setAnnouncements(aData);
      if (gaData) setGroupAnalytics(gaData);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load Group Admin workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleForwardLoan = async (loanId) => {
    setSubmitting(true);
    setActionSuccess('');
    try {
      await api.groupAdmin.forwardLoan(loanId);
      setActionSuccess('Loan request approved and forwarded to Super Admin for final sanction.');
      await loadData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to forward loan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectLoan = async () => {
    if (!rejectLoan) return;
    if (!rejectReason.trim()) {
      alert('Please enter a reason for rejection.');
      return;
    }
    setSubmitting(true);
    try {
      await api.groupAdmin.rejectLoan(rejectLoan.id, rejectReason);
      setRejectLoan(null);
      setRejectReason('');
      setActionSuccess('Loan request has been declined.');
      await loadData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to reject loan.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingReviewLoans = loans.filter(l => l.status === 'PENDING_GROUP_ADMIN');
  const forwardedLoans = loans.filter(l => l.status === 'PENDING_SUPER_ADMIN');
  const activeDisbursedLoans = loans.filter(l => l.status === 'DISBURSED' || l.status === 'APPROVED');

  let totalCollected = 0;
  let totalOutstanding = 0;
  loans.forEach(l => {
    totalCollected += (l.total_paid || 0);
    if (l.status === 'DISBURSED') {
      totalOutstanding += (l.outstanding_balance !== undefined ? l.outstanding_balance : l.amount);
    }
  });

  if (loading && !groupData) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        {t('loading')}
      </div>
    );
  }

  const { group, members } = groupData || { group: {}, members: [] };

  return (
    <div className="main-layout">
      {/* Sidebar Navigation */}
      <aside style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--border-color)',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem'
      }}>
        <div style={{ padding: '0.5rem 0.75rem 1rem 0.75rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {t('role_group_admin')} Console
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#065f46', marginTop: '0.2rem' }}>
            {group.group_name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {group.area}, {group.district}
          </div>
        </div>

        <button
          onClick={() => setActiveTab('loans')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)', border: 'none',
            background: activeTab === 'loans' ? '#ecfdf5' : 'transparent',
            color: activeTab === 'loans' ? '#065f46' : 'var(--text-main)',
            fontWeight: activeTab === 'loans' ? 700 : 500, cursor: 'pointer', textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <IndianRupee size={18} color={activeTab === 'loans' ? '#047857' : 'var(--text-muted)'} />
            <span>{lang === 'ta' ? 'குழு கடன்கள்' : 'Group Loans'}</span>
          </div>
          {pendingReviewLoans.length > 0 && (
            <span style={{
              backgroundColor: '#d97706', color: '#ffffff', fontSize: '0.72rem',
              fontWeight: 800, padding: '2px 7px', borderRadius: '10px'
            }}>
              {pendingReviewLoans.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('members')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)', border: 'none',
            background: activeTab === 'members' ? '#ecfdf5' : 'transparent',
            color: activeTab === 'members' ? '#065f46' : 'var(--text-main)',
            fontWeight: activeTab === 'members' ? 700 : 500, cursor: 'pointer', textAlign: 'left'
          }}
        >
          <Users size={18} color={activeTab === 'members' ? '#047857' : 'var(--text-muted)'} />
          <span>{lang === 'ta' ? 'உறுப்பினர்கள்' : 'Group Members'} ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)', border: 'none',
            background: activeTab === 'analytics' ? '#ecfdf5' : 'transparent',
            color: activeTab === 'analytics' ? '#065f46' : 'var(--text-main)',
            fontWeight: activeTab === 'analytics' ? 700 : 500, cursor: 'pointer', textAlign: 'left'
          }}
        >
          <BarChart3 size={18} color={activeTab === 'analytics' ? '#047857' : 'var(--text-muted)'} />
          <span>{lang === 'ta' ? 'குழு பகுப்பாய்வு & வரைபடங்கள்' : 'Group Analytics & Charts'}</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)', border: 'none',
            background: activeTab === 'calculator' ? '#ecfdf5' : 'transparent',
            color: activeTab === 'calculator' ? '#065f46' : 'var(--text-main)',
            fontWeight: activeTab === 'calculator' ? 700 : 500, cursor: 'pointer', textAlign: 'left'
          }}
        >
          <Calculator size={18} color={activeTab === 'calculator' ? '#047857' : 'var(--text-muted)'} />
          <span>{lang === 'ta' ? 'கடன் கால்குலேட்டர்' : 'Loan Calculator'}</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)', border: 'none',
            background: activeTab === 'chat' ? '#ecfdf5' : 'transparent',
            color: activeTab === 'chat' ? '#065f46' : 'var(--text-main)',
            fontWeight: activeTab === 'chat' ? 700 : 500, cursor: 'pointer', textAlign: 'left'
          }}
        >
          <MessageSquare size={18} color={activeTab === 'chat' ? '#047857' : 'var(--text-muted)'} />
          <span>{lang === 'ta' ? 'குழு அரட்டை' : 'Group Chat'}</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)', border: 'none',
            background: activeTab === 'announcements' ? '#ecfdf5' : 'transparent',
            color: activeTab === 'announcements' ? '#065f46' : 'var(--text-main)',
            fontWeight: activeTab === 'announcements' ? 700 : 500, cursor: 'pointer', textAlign: 'left'
          }}
        >
          <Megaphone size={18} color={activeTab === 'announcements' ? '#047857' : 'var(--text-muted)'} />
          <span>{t('tab_broadcast')}</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="content-area">
        {actionSuccess && (
          <div style={{
            padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac',
            color: '#166534', borderRadius: '8px', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600
          }}>
            <CheckCircle2 size={18} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* TAB 1: GROUP LOANS & REPAYMENTS */}
        {activeTab === 'loans' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                  {lang === 'ta' ? 'குழு கடன் சரிபார்ப்பு & தவணை மேலாண்மை' : 'Group Loan Review & Repayment Ledger'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {lang === 'ta'
                    ? 'உங்கள் குழு உறுப்பினர்களின் கடன் விண்ணப்பங்களை சரிபார்த்து முதன்மை நிர்வாகிக்கு பரிந்துரைக்கவும் அல்லது தவணைகளை பதிவு செய்யவும்.'
                    : 'Stage 1 preliminary assessment of loan applications and active repayment recording.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowApplyModal(true)}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}
              >
                <Plus size={16} />
                <span>{lang === 'ta' ? '+ கடன் கோரிக்கை (தலைவர்)' : '+ Request Loan Amount'}</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.875rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Awaiting My Review</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706' }}>{pendingReviewLoans.length}</span>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>With Super Admin</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb' }}>{forwardedLoans.length}</span>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Repayments Collected</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#047857' }}>₹{totalCollected}</span>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Active Group Balance</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#b45309' }}>₹{totalOutstanding}</span>
              </div>
            </div>

            {/* Loans Table */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <IndianRupee size={18} color="#047857" />
                  <span>{lang === 'ta' ? 'அனைத்து குழு கடன் விண்ணப்பங்கள்' : 'All Group Loans & Ledger'}</span>
                </div>
              </div>

              {loans.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {lang === 'ta' ? 'இந்தக் குழுவில் இன்னும் கடன் விண்ணப்பங்கள் எதுவும் இல்லை.' : 'No loan applications found for your group members.'}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                      <tr>
                        <th style={{ padding: '10px 14px' }}>Member</th>
                        <th style={{ padding: '10px 14px' }}>Account / App ID</th>
                        <th style={{ padding: '10px 14px' }}>Amount</th>
                        <th style={{ padding: '10px 14px' }}>Mode</th>
                        <th style={{ padding: '10px 14px' }}>Repaid / Balance</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center' }}>Running Loans</th>
                        <th style={{ padding: '10px 14px' }}>Status</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map(loan => (
                        <tr key={loan.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{loan.member_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{loan.member_phone}</div>
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#047857' }}>
                            {loan.loan_account_number || loan.application_id || loan.id.slice(0, 8)}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>
                            ₹{loan.amount}
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                              {loan.repayment_frequency || 'Weekly'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                              backgroundColor: loan.payment_mode === 'CASH' ? '#ecfdf5' : '#eff6ff',
                              color: loan.payment_mode === 'CASH' ? '#065f46' : '#1d4ed8'
                            }}>
                              {loan.payment_mode || 'UPI'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {loan.status === 'DISBURSED' || loan.status === 'COMPLETED' ? (
                              <div>
                                <span style={{ color: '#15803d', fontWeight: 600 }}>₹{loan.total_paid || 0}</span>
                                {' / '}
                                <span style={{ color: '#b45309', fontWeight: 700 }}>₹{loan.outstanding_balance || 0}</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>-</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px',
                              backgroundColor: (loan.user_active_loans_count || 1) >= 3 ? '#fee2e2' : '#f0fdf4',
                              color: (loan.user_active_loans_count || 1) >= 3 ? '#b91c1c' : '#15803d',
                              border: (loan.user_active_loans_count || 1) >= 3 ? '1px solid #fca5a5' : '1px solid #bbf7d0'
                            }}>
                              {loan.user_active_loans_count || 1}/3 Active
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <StatusBadge status={loan.status} type="loan" />
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {loan.status === 'PENDING_GROUP_ADMIN' && (
                                <>
                                  <button
                                    onClick={() => handleForwardLoan(loan.id)}
                                    disabled={submitting}
                                    style={{
                                      padding: '4px 8px', borderRadius: '4px', border: 'none',
                                      backgroundColor: '#047857', color: '#ffffff',
                                      fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                                    }}
                                  >
                                    Forward ➔
                                  </button>
                                  <button
                                    onClick={() => setRejectLoan(loan)}
                                    disabled={submitting}
                                    style={{
                                      padding: '4px 8px', borderRadius: '4px', border: '1px solid #ef4444',
                                      backgroundColor: '#ffffff', color: '#dc2626',
                                      fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                                    }}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {(loan.status === 'DISBURSED' || loan.status === 'COMPLETED') && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedLedgerLoanId(loan.id)}
                                  style={{
                                    padding: '4px 8px', borderRadius: '4px', border: '1px solid #047857',
                                    backgroundColor: '#ecfdf5', color: '#065f46',
                                    fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '3px'
                                  }}
                                >
                                  <FileText size={13} />
                                  <span>Ledger</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MEMBERS */}
        {activeTab === 'members' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Users size={18} color="#047857" />
                <span>{lang === 'ta' ? 'குழு உறுப்பினர்கள் பட்டியல்' : 'Active SHG Member Roster'} ({members.length})</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                  <tr>
                    <th style={{ padding: '10px 14px' }}>Member Name</th>
                    <th style={{ padding: '10px 14px' }}>Phone</th>
                    <th style={{ padding: '10px 14px' }}>Email</th>
                    <th style={{ padding: '10px 14px' }}>Area & District</th>
                    <th style={{ padding: '10px 14px' }}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{m.name}</td>
                      <td style={{ padding: '10px 14px' }}>{m.phone}</td>
                      <td style={{ padding: '10px 14px' }}>{m.email}</td>
                      <td style={{ padding: '10px 14px' }}>{m.area}, {m.district}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <StatusBadge status={m.role} type="role" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: GROUP ANALYTICS & INNOVATIVE CHARTS */}
        {activeTab === 'analytics' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {lang === 'ta' ? 'குழு நிதி மற்றும் கடன் பகுப்பாய்வு' : 'Group Financial & Loan Analytics'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {lang === 'ta'
                  ? `குழு: ${group.group_name} - உறுப்பினர்களின் கடன் திரும்ப செலுத்துதல் வீதம், தவணை நிலை மற்றும் வசூல் புள்ளிவிவரங்கள்.`
                  : `Group: ${group.group_name} - Live visual tracking of member repayment performance, loan status matrix, and collection split.`}
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
              <div className="card" style={{ borderLeft: '4px solid #047857' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>GROUP RECOVERY RATE</span>
                <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#047857' }}>
                  {groupAnalytics?.totalSanctioned > 0 ? Math.round((groupAnalytics.totalCollected / groupAnalytics.totalSanctioned) * 100) : 100}%
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>of all sanctioned funds</span>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>TOTAL COLLECTED</span>
                <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284c7' }}>
                  ₹{(groupAnalytics?.totalCollected || 0).toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weekly & Monthly dues</span>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #7c3aed' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>ACTIVE GROUP MEMBERS</span>
                <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7c3aed' }}>
                  {members.length}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified SHG borrowers</span>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #d97706' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>TOTAL LOANS LOGGED</span>
                <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#d97706' }}>
                  {loans.length}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From this SHG circle</span>
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
              {/* Chart 1: Member Repayment Performance Leaderboard & Recovery */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <TrendingUp size={18} color="#047857" />
                    <span>Member Repayment Progress & Health</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {groupAnalytics?.memberRepayments && groupAnalytics.memberRepayments.length > 0 ? (
                    groupAnalytics.memberRepayments.map(m => {
                      const rate = Math.min(100, Math.max(0, m.repaymentRate || 0));
                      return (
                        <div key={m.memberId} style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <div>
                              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{m.memberName}</strong>
                              <span style={{
                                fontSize: '0.7rem', padding: '1px 6px', borderRadius: '8px', marginLeft: '0.5rem',
                                backgroundColor: m.activeRunningLoans >= 3 ? '#fee2e2' : '#ecfdf5',
                                color: m.activeRunningLoans >= 3 ? '#b91c1c' : '#047857',
                                fontWeight: 700
                              }}>
                                {m.activeRunningLoans}/3 Loans Running
                              </span>
                            </div>
                            <span style={{
                              fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px',
                              backgroundColor: rate >= 60 ? '#dcfce7' : '#fef3c7',
                              color: rate >= 60 ? '#15803d' : '#b45309'
                            }}>
                              {rate}% Repaid
                            </span>
                          </div>

                          <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${rate}%`,
                              height: '100%',
                              background: rate >= 60 ? 'linear-gradient(90deg, #10b981 0%, #047857 100%)' : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                              borderRadius: '4px'
                            }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                            <span>Sanctioned: ₹{m.totalSanctioned.toLocaleString('en-IN')}</span>
                            <span>Paid: <strong style={{ color: '#15803d' }}>₹{m.totalPaid.toLocaleString('en-IN')}</strong></span>
                            <span>Balance: <strong style={{ color: '#b45309' }}>₹{m.activeBalance.toLocaleString('en-IN')}</strong></span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No member loans currently logged in this group.
                    </div>
                  )}
                </div>
              </div>

              {/* Chart 2: Group Loan Status Breakdown & Mode Ratio */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <PieChart size={18} color="#047857" />
                    <span>Group Loan Pipeline & Collection Channels</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Status Pills */}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      Application Status Funnel:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      <div style={{ backgroundColor: '#fef3c7', padding: '0.65rem', borderRadius: '8px', border: '1px solid #fde68a', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#92400e', display: 'block', fontWeight: 700 }}>My Review</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400e' }}>{pendingReviewLoans.length}</span>
                      </div>
                      <div style={{ backgroundColor: '#eff6ff', padding: '0.65rem', borderRadius: '8px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#1e40af', display: 'block', fontWeight: 700 }}>Super Admin</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e40af' }}>{forwardedLoans.length}</span>
                      </div>
                      <div style={{ backgroundColor: '#f0fdf4', padding: '0.65rem', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#166534', display: 'block', fontWeight: 700 }}>Disbursed/Active</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534' }}>
                          {loans.filter(l => l.status === 'DISBURSED').length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cash vs UPI in Group */}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Group Collection Method Ratio:
                    </div>
                    {(() => {
                      const c = groupAnalytics?.cashVsUpi?.cash || 0;
                      const u = groupAnalytics?.cashVsUpi?.upi || 0;
                      const sum = (c + u) || 1;
                      const cPct = Math.round((c / sum) * 100);
                      return (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                            <span>Cash: <strong>₹{c.toLocaleString('en-IN')}</strong> ({cPct}%)</span>
                            <span>UPI: <strong>₹{u.toLocaleString('en-IN')}</strong> ({100 - cPct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${cPct}%`, backgroundColor: '#10b981' }} title={`Cash: ${cPct}%`} />
                            <div style={{ width: `${100 - cPct}%`, backgroundColor: '#6366f1' }} title={`UPI: ${100 - cPct}%`} />
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} /> Cash
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1' }} /> UPI Transfer
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Frequency Ratio */}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Repayment Frequency in Group:
                    </div>
                    {(() => {
                      const w = groupAnalytics?.weeklyVsMonthly?.weekly || 0;
                      const m = groupAnalytics?.weeklyVsMonthly?.monthly || 0;
                      const tot = (w + m) || 1;
                      const wPct = Math.round((w / tot) * 100);
                      return (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                            <span>Weekly: <strong>{w}</strong> ({wPct}%)</span>
                            <span>Monthly: <strong>{m}</strong> ({100 - wPct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${wPct}%`, backgroundColor: '#047857' }} />
                            <div style={{ width: `${100 - wPct}%`, backgroundColor: '#0284c7' }} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="card">
            <LoanCalculatorModal isEmbedded={true} />
          </div>
        )}

        {/* TAB 4: CHAT */}
        {activeTab === 'chat' && group && (
          <GroupChat group={group} currentUser={currentUser} />
        )}

        {/* TAB 5: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <AnnouncementsFeed announcements={announcements} />
        )}
      </main>

      {/* GROUP ADMIN APPLY LOAN MODAL */}
      {showApplyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '14px', maxWidth: '640px',
            width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>
              {lang === 'ta' ? 'குழு தலைவர் கடன் விண்ணப்பம்' : 'Group Admin Loan Request'}
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {lang === 'ta'
                ? 'இந்த கடன் கோரிக்கை நேரடியாக முதன்மை நிர்வாகிக்கு (Super Admin) ஒப்புதலுக்காக அனுப்பப்படும்.'
                : 'This loan request will be directly submitted to the Super Admin for sanction.'}
            </p>

            {loanFormError && (
              <div style={{
                padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                color: '#b91c1c', borderRadius: '6px', fontSize: '0.88rem', marginBottom: '1rem'
              }}>
                {loanFormError}
              </div>
            )}

            <form onSubmit={handleApplyLoan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('loan_amount_label')} *
                </label>
                <ValidatedVoiceField
                  value={amount}
                  onChange={(val) => setAmount(Number(val) || val)}
                  validationRules={{
                    type: 'number',
                    min: 1000,
                    max: 10000,
                    errorMessage: lang === 'ta' ? 'கடன் தொகை ₹1,000 முதல் ₹10,000 வரை இருக்க வேண்டும்.' : 'Loan amount must be between ₹1,000 and ₹10,000.'
                  }}
                >
                  <input
                    type="number"
                    min="1000"
                    max="10000"
                    step="500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.85rem', borderRadius: '8px',
                      border: '1.5px solid var(--border-color)', fontSize: '1.1rem', fontWeight: 700, color: '#047857'
                    }}
                  />
                </ValidatedVoiceField>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('purpose_label')} *
                </label>
                <ValidatedVoiceField
                  value={purpose}
                  onChange={(val) => setPurpose(val)}
                  validationRules={{
                    type: 'text',
                    minLength: 4,
                    errorMessage: lang === 'ta' ? 'நோக்கத்தை தெளிவாகக் குறிப்பிடவும்.' : 'Please enter the loan purpose clearly.'
                  }}
                >
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                    placeholder={lang === 'ta' ? 'கடன் நோக்கம்...' : 'Loan purpose...'}
                    style={{
                      width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.85rem', borderRadius: '8px',
                      border: '1.5px solid var(--border-color)', fontSize: '0.9rem'
                    }}
                  />
                </ValidatedVoiceField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    {t('frequency_label')}
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => {
                      setFrequency(e.target.value);
                      setTenure(e.target.value === 'WEEKLY' ? 10 : 6);
                    }}
                    style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                      border: '1.5px solid var(--border-color)', fontSize: '0.9rem'
                    }}
                  >
                    <option value="WEEKLY">{t('freq_weekly')}</option>
                    <option value="MONTHLY">{t('freq_monthly')}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    {t('tenure_label')}
                  </label>
                  <select
                    value={tenure}
                    onChange={(e) => setTenure(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                      border: '1.5px solid var(--border-color)', fontSize: '0.9rem'
                    }}
                  >
                    {frequency === 'WEEKLY' ? (
                      <>
                        <option value={8}>8 Weeks</option>
                        <option value={10}>10 Weeks (Standard)</option>
                        <option value={12}>12 Weeks</option>
                      </>
                    ) : (
                      <>
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months (Standard)</option>
                        <option value={12}>12 Months</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('payment_mode_label')} *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    style={{
                      flex: 1, padding: '0.65rem', borderRadius: '8px',
                      border: paymentMode === 'UPI' ? '2px solid #047857' : '1.5px solid var(--border-color)',
                      backgroundColor: paymentMode === 'UPI' ? '#ecfdf5' : '#ffffff',
                      color: paymentMode === 'UPI' ? '#047857' : 'var(--text-main)',
                      fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {t('mode_upi')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CASH')}
                    style={{
                      flex: 1, padding: '0.65rem', borderRadius: '8px',
                      border: paymentMode === 'CASH' ? '2px solid #047857' : '1.5px solid var(--border-color)',
                      backgroundColor: paymentMode === 'CASH' ? '#ecfdf5' : '#ffffff',
                      color: paymentMode === 'CASH' ? '#047857' : 'var(--text-main)',
                      fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {t('mode_cash')}
                  </button>
                </div>
              </div>

              {paymentMode === 'UPI' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    {t('upi_email_verify')} *
                  </label>
                  <ValidatedVoiceField
                    value={upiEmail}
                    onChange={(val) => setUpiEmail(val)}
                    validationRules={{
                      type: 'email'
                    }}
                  >
                    <input
                      type="email"
                      value={upiEmail}
                      onChange={(e) => setUpiEmail(e.target.value)}
                      placeholder={currentUser.email}
                      required
                      style={{
                        width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.85rem', borderRadius: '8px',
                        border: '1.5px solid var(--border-color)', fontSize: '0.9rem'
                      }}
                    />
                  </ValidatedVoiceField>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Must match your login email: <strong>{currentUser.email}</strong>
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="btn btn-secondary"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingLoan}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Plus size={16} />
                  <span>{submittingLoan ? 'Submitting to Super Admin...' : 'Submit Loan Request to Super Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectLoan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '440px',
            width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#b91c1c', fontSize: '1.15rem' }}>
              Decline Loan Request
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Provide feedback for {rejectLoan.member_name} (₹{rejectLoan.amount}).
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Previous dues pending or document incomplete..."
              rows={3}
              required
              style={{
                width: '100%', padding: '0.65rem', borderRadius: '6px',
                border: '1.5px solid var(--border-color)', fontSize: '0.88rem', marginBottom: '1rem'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setRejectLoan(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectLoan}
                disabled={submitting}
                style={{
                  backgroundColor: '#dc2626', color: '#ffffff', border: 'none',
                  padding: '6px 14px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPAYMENT LEDGER MODAL */}
      {selectedLedgerLoanId && (
        <RepaymentLedgerModal
          loanId={selectedLedgerLoanId}
          currentUser={currentUser}
          onClose={() => setSelectedLedgerLoanId(null)}
          onPaymentSuccess={() => loadData()}
        />
      )}
    </div>
  );
}
