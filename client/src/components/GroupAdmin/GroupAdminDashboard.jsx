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
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import GroupChat from '../GroupChat';
import AnnouncementsFeed from '../AnnouncementsFeed';
import StatusBadge from '../StatusBadge';
import RepaymentLedgerModal from '../RepaymentLedgerModal';
import { useLanguage } from '../../i18n';

export default function GroupAdminDashboard({ currentUser }) {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('loans');
  const [groupData, setGroupData] = useState(null);
  const [loans, setLoans] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reject Modal
  const [rejectLoan, setRejectLoan] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Repayment Ledger Modal
  const [selectedLedgerLoanId, setSelectedLedgerLoanId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gData, lData, aData] = await Promise.all([
        api.groupAdmin.getMyGroup(),
        api.groupAdmin.getLoans(),
        api.announcements.getAll()
      ]);
      setGroupData(gData);
      setLoans(lData);
      setAnnouncements(aData);
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

        {/* TAB 3: CHAT */}
        {activeTab === 'chat' && group && (
          <GroupChat group={group} currentUser={currentUser} />
        )}

        {/* TAB 4: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <AnnouncementsFeed announcements={announcements} />
        )}
      </main>

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
