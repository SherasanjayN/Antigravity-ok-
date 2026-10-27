import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  IndianRupee,
  MessageSquare,
  Megaphone,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  ShieldCheck,
  MapPin,
  Send,
  History,
  Calculator,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import GroupChat from '../GroupChat';
import AnnouncementsFeed from '../AnnouncementsFeed';
import StatusBadge from '../StatusBadge';
import LoanCalculatorModal from '../LoanCalculatorModal';
import RepaymentLedgerModal from '../RepaymentLedgerModal';
import ValidatedVoiceField from '../VoiceInput/ValidatedVoiceField';
import { useLanguage } from '../../i18n';

export default function MemberDashboard({ currentUser }) {
  const { t, lang } = useLanguage();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview | loans | calculator | chat | announcements

  // Apply Loan Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [amount, setAmount] = useState(5000);
  const [purpose, setPurpose] = useState('Small Business Inventory & Tailoring Materials');
  const [frequency, setFrequency] = useState('WEEKLY');
  const [tenure, setTenure] = useState(10);
  const [paymentMode, setPaymentMode] = useState('UPI'); // UPI | CASH
  const [upiEmail, setUpiEmail] = useState('');
  const [firstDueDate, setFirstDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanFormError, setLoanFormError] = useState('');
  const [loanSuccessMsg, setLoanSuccessMsg] = useState('');

  // Selected Loan for Repayment Ledger Modal
  const [ledgerLoanId, setLedgerLoanId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.member.getDashboard();
      setDashboardData(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load member dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyLoan = async (e) => {
    e.preventDefault();
    setLoanFormError('');
    setLoanSuccessMsg('');

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
      const res = await api.member.applyLoan({
        amount: numAmount,
        purpose,
        repayment_frequency: frequency,
        tenure_value: tenure,
        payment_mode: paymentMode,
        upi_email: paymentMode === 'UPI' ? upiEmail.trim() : null,
        preferred_first_due_date: firstDueDate
      });

      setLoanSuccessMsg(res.message);
      setShowApplyModal(false);
      setAmount(5000);
      setUpiEmail('');
      await loadData();
      setActiveTab('loans');
    } catch (err) {
      setLoanFormError(err.message || 'Failed to submit loan application.');
    } finally {
      setSubmittingLoan(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        {t('loading')}
      </div>
    );
  }

  const { group, groupAdmin, fellowMembers, loans = [], activeLoan, announcements = [] } = dashboardData || {};
  const hasActiveLoan = !!activeLoan;

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
            {lang === 'ta' ? 'எனது சுய உதவிக் குழு' : 'My Self-Help Group'}
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#065f46', marginTop: '0.2rem' }}>
            {group ? group.group_name : (lang === 'ta' ? 'குழு ஒதுக்கீடு நிலுவையில் உள்ளது' : 'Pending Allocation')}
          </div>
          {group && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {group.area}, {group.district}
            </div>
          )}
        </div>

        <button
          onClick={() => setActiveTab('overview')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)', border: 'none',
            background: activeTab === 'overview' ? '#ecfdf5' : 'transparent',
            color: activeTab === 'overview' ? '#065f46' : 'var(--text-main)',
            fontWeight: activeTab === 'overview' ? 700 : 500, cursor: 'pointer', textAlign: 'left'
          }}
        >
          <Building2 size={18} color={activeTab === 'overview' ? '#047857' : 'var(--text-muted)'} />
          <span>{lang === 'ta' ? 'குழு மேலோட்டம்' : 'Group Overview'}</span>
        </button>

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
            <span>{lang === 'ta' ? 'எனது கடன்கள்' : 'My Loans'} ({loans.length})</span>
          </div>
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
          <span>{t('tab_loans')} / {t('calc_title')}</span>
        </button>

        {group && (
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
        )}

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

      {/* Main Content */}
      <main className="content-area">
        {loanSuccessMsg && (
          <div style={{
            padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac',
            color: '#166534', borderRadius: '8px', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600
          }}>
            <CheckCircle2 size={18} />
            <span>{loanSuccessMsg}</span>
          </div>
        )}

        {/* ACTIVE LOAN GENTLE WARNING CARD (Mandatory Business Rule) */}
        {hasActiveLoan && (
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderLeft: '5px solid #d97706',
            borderRadius: '10px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            boxShadow: '0 2px 4px rgba(217, 119, 6, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e', marginBottom: '0.5rem' }}>
              <AlertCircle size={20} />
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                {t('active_loan_title')}
              </h4>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#78350f', lineHeight: 1.5 }}>
              {t('active_loan_msg')}
            </p>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '0.85rem 1.25rem',
              border: '1px solid #fef3c7',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.75rem',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#78350f', display: 'block' }}>{t('loan_acc_no')}</span>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#047857' }}>
                  {activeLoan.loan_account_number || activeLoan.id}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#78350f', display: 'block' }}>{t('sanctioned_amount')}</span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>₹{activeLoan.sanctioned_amount || activeLoan.amount}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#78350f', display: 'block' }}>{t('remaining_balance')}</span>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#b45309' }}>₹{activeLoan.outstanding_balance}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#78350f', display: 'block' }}>{t('status_label')}</span>
                <StatusBadge status={activeLoan.status} type="loan" />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setLedgerLoanId(activeLoan.id)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #047857',
                    backgroundColor: '#ecfdf5',
                    color: '#065f46',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <FileText size={14} />
                  <span>{t('view_ledger')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                  {lang === 'ta' ? 'உறுப்பினர் மேலோட்டம்' : 'Member Dashboard'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
                  {lang === 'ta' ? `வணக்கம், ${currentUser.name}! உங்கள் மகளிர் குழு நிதி சேவைகள்.` : `Welcome back, ${currentUser.name}! Manage your SHG loan and repayments.`}
                </p>
              </div>

              {group && (
                <button
                  onClick={() => {
                    if (hasActiveLoan) return;
                    setShowApplyModal(true);
                    setLoanFormError('');
                  }}
                  disabled={hasActiveLoan}
                  className="btn btn-primary"
                  style={{
                    opacity: hasActiveLoan ? 0.55 : 1,
                    cursor: hasActiveLoan ? 'not-allowed' : 'pointer'
                  }}
                  title={hasActiveLoan ? t('active_loan_msg') : t('apply_loan_title')}
                >
                  <Plus size={16} />
                  <span>{t('apply_loan_title')}</span>
                </button>
              )}
            </div>

            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
              {/* Group Info Card */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Building2 size={18} color="#047857" />
                    <span>{lang === 'ta' ? 'குழு விவரங்கள்' : 'My Group Details'}</span>
                  </div>
                </div>

                {group ? (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46', marginBottom: '0.5rem' }}>
                      {group.group_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                      <MapPin size={15} />
                      <span>{group.area}, {group.district}</span>
                    </div>

                    {groupAdmin && (
                      <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {lang === 'ta' ? 'குழு நிர்வாகி (தலைவி)' : 'Group Admin (Leader)'}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.2rem' }}>
                          {groupAdmin.name}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Phone size={13} /> {groupAdmin.phone}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Mail size={13} /> {groupAdmin.email}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {lang === 'ta' ? 'உங்கள் பதிவு முதன்மை நிர்வாகி ஒப்புதலுக்குப் பிறகு குழு ஒதுக்கப்படும்.' : 'Your account is approved. Super Admin will allocate your SHG group shortly.'}
                  </div>
                )}
              </div>

              {/* Quick Actions & Recent Loan */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <IndianRupee size={18} color="#047857" />
                    <span>{lang === 'ta' ? 'கடன் மேலோட்டம்' : 'Loan Overview'}</span>
                  </div>
                </div>

                {loans.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <p style={{ margin: '0 0 1rem 0' }}>{lang === 'ta' ? 'நீங்கள் இதுவரை எந்தக் கடனுக்கும் விண்ணப்பிக்கவில்லை.' : 'You have not submitted any loan applications yet.'}</p>
                    {group && !hasActiveLoan && (
                      <button
                        onClick={() => setShowApplyModal(true)}
                        className="btn btn-primary btn-sm"
                      >
                        <Plus size={14} /> {t('apply_loan_title')}
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    {loans.slice(0, 2).map(loan => (
                      <div
                        key={loan.id}
                        style={{
                          padding: '1rem', border: '1px solid var(--border-color)',
                          borderRadius: '8px', marginBottom: '0.75rem', backgroundColor: '#f8fafc'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#047857' }}>
                              ₹{loan.amount}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                              ({loan.repayment_frequency || 'Weekly'})
                            </span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {loan.loan_account_number || loan.application_id || loan.id}
                            </div>
                          </div>
                          <StatusBadge status={loan.status} type="loan" />
                        </div>

                        {/* Progress Bar if disbursed */}
                        {loan.status === 'DISBURSED' && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                              <span>{t('total_repaid')}: ₹{loan.total_paid || 0}</span>
                              <span style={{ fontWeight: 700, color: '#b45309' }}>Balance: ₹{loan.outstanding_balance}</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${Math.min(100, Math.round(((loan.total_paid || 0) / (loan.amount || 1)) * 100))}%`,
                                height: '100%', backgroundColor: '#047857'
                              }} />
                            </div>
                          </div>
                        )}

                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => setLedgerLoanId(loan.id)}
                            style={{
                              fontSize: '0.78rem', padding: '3px 10px', borderRadius: '4px',
                              border: '1px solid #047857', backgroundColor: '#ffffff',
                              color: '#047857', cursor: 'pointer', fontWeight: 600
                            }}
                          >
                            {t('view_ledger')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY LOANS */}
        {activeTab === 'loans' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{lang === 'ta' ? 'எனது கடன் விண்ணப்பங்கள்' : 'My Loan Applications'}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {lang === 'ta' ? 'உங்கள் அனைத்து கடன் விண்ணப்பங்களின் முழு வரலாறு மற்றும் தவணை விவரங்கள்.' : 'Complete tracking of your loan requests, approvals, and repayment receipts.'}
                </p>
              </div>

              {group && (
                <button
                  onClick={() => {
                    if (hasActiveLoan) return;
                    setShowApplyModal(true);
                  }}
                  disabled={hasActiveLoan}
                  className="btn btn-primary"
                  style={{ opacity: hasActiveLoan ? 0.5 : 1, cursor: hasActiveLoan ? 'not-allowed' : 'pointer' }}
                >
                  <Plus size={16} />
                  <span>{t('apply_loan_title')}</span>
                </button>
              )}
            </div>

            {loans.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                {lang === 'ta' ? 'நீங்கள் இன்னும் எந்தக் கடனுக்கும் விண்ணப்பிக்கவில்லை.' : 'No loan applications found.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loans.map(loan => (
                  <div key={loan.id} className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#047857' }}>
                            ₹{loan.amount}
                          </span>
                          <StatusBadge status={loan.status} type="loan" />
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {t('loan_acc_no')}: <strong style={{ color: '#1e293b' }}>{loan.loan_account_number || loan.application_id || loan.id}</strong>
                          {' • '}{loan.repayment_frequency || 'Weekly'} ({loan.tenure_value || 10} {loan.tenure_unit || 'weeks'})
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
                          <strong>{t('purpose_label')}:</strong> {loan.purpose}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setLedgerLoanId(loan.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                        >
                          <FileText size={14} />
                          <span>{t('view_ledger')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Timeline */}
                    {loan.timeline && loan.timeline.length > 0 && (
                      <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          Approval & Workflow Audit:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {loan.timeline.map((step, idx) => (
                            <div key={idx} style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <CheckCircle2 size={13} color="#059669" />
                              <span><strong>{step.by_name}:</strong> {step.note}</span>
                              <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                ({new Date(step.at).toLocaleDateString()})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="card">
            <LoanCalculatorModal isEmbedded={true} />
          </div>
        )}

        {/* TAB 4: GROUP CHAT */}
        {activeTab === 'chat' && group && (
          <GroupChat group={group} currentUser={currentUser} />
        )}

        {/* TAB 5: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <AnnouncementsFeed announcements={announcements} />
        )}
      </main>

      {/* APPLY LOAN MODAL */}
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
              {t('apply_loan_title')}
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('loan_amount_hint')}
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
                    errorMessage: lang === 'ta' ? 'கடன் நோக்கத்தை தெளிவாகக் கூறவும் (குறைந்தது 4 எழுத்துக்கள்).' : 'Please state the purpose clearly (min 4 letters).'
                  }}
                >
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                    placeholder="e.g. Tailoring equipment and silk saree stock"
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
                      type: 'email',
                      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      errorMessage: lang === 'ta' ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter or speak a valid email address.'
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
                >
                  {submittingLoan ? t('calculating') : t('submit_application')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPAYMENT LEDGER MODAL */}
      {ledgerLoanId && (
        <RepaymentLedgerModal
          loanId={ledgerLoanId}
          currentUser={currentUser}
          onClose={() => setLedgerLoanId(null)}
          onPaymentSuccess={() => loadData()}
        />
      )}
    </div>
  );
}
