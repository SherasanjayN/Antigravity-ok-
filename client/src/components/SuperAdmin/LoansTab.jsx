import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Mail,
  AlertCircle,
  Eye,
  History,
  Send,
  FileText,
  CreditCard
} from 'lucide-react';
import { api } from '../../services/api';
import StatusBadge from '../StatusBadge';
import RepaymentLedgerModal from '../RepaymentLedgerModal';
import { useLanguage } from '../../i18n';

export default function LoansTab({ onActionComplete }) {
  const { t, lang } = useLanguage();
  const [loans, setLoans] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sanction Modal
  const [sanctionModalLoan, setSanctionModalLoan] = useState(null);
  const [sanctionSuccessInfo, setSanctionSuccessInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Disbursal Modal (Separate Step 4)
  const [disburseModalLoan, setDisburseModalLoan] = useState(null);
  const [disburseMethod, setDisburseMethod] = useState('BANK_TRANSFER');
  const [disburseRef, setDisburseRef] = useState('');
  const [disburseNotes, setDisburseNotes] = useState('');

  // Reject Modal
  const [rejectLoan, setRejectLoan] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Ledger Modal
  const [ledgerLoanId, setLedgerLoanId] = useState(null);

  // Timeline view modal
  const [viewTimelineLoan, setViewTimelineLoan] = useState(null);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getLoans();
      setLoans(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch loan requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // STEP 3: Sanction Loan
  const handleSanction = async () => {
    if (!sanctionModalLoan) return;
    setSubmitting(true);
    try {
      const res = await api.admin.sanctionLoan(sanctionModalLoan.id);
      setSanctionSuccessInfo(res);
      setSanctionModalLoan(null);
      await fetchLoans();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      alert(err.message || 'Failed to sanction loan.');
    } finally {
      setSubmitting(false);
    }
  };

  // STEP 4: Disburse Loan
  const handleDisburse = async (e) => {
    e.preventDefault();
    if (!disburseModalLoan) return;
    setSubmitting(true);
    try {
      const res = await api.admin.disburseLoan(disburseModalLoan.id, {
        payment_method: disburseMethod,
        transaction_reference: disburseRef,
        notes: disburseNotes
      });
      setSanctionSuccessInfo({
        message: res.message,
        emailResult: res.emailResult
      });
      setDisburseModalLoan(null);
      setDisburseRef('');
      setDisburseNotes('');
      await fetchLoans();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      alert(err.message || 'Failed to disburse loan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reject Loan
  const handleReject = async () => {
    if (!rejectLoan) return;
    if (!rejectReason.trim()) {
      alert('Please enter a reason for rejection.');
      return;
    }
    setSubmitting(true);
    try {
      await api.admin.rejectLoan(rejectLoan.id, rejectReason);
      setRejectLoan(null);
      setRejectReason('');
      await fetchLoans();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      alert(err.message || 'Failed to decline loan.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLoans = loans.filter((l) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return l.status === 'DISBURSED' || l.status === 'APPROVED';
    if (filter === 'REJECTED') return l.status === 'REJECTED_SUPER_ADMIN' || l.status === 'REJECTED_GROUP_ADMIN' || l.status === 'REJECTED';
    return l.status === filter;
  });

  const countPendingSuper = loans.filter(l => l.status === 'PENDING_SUPER_ADMIN').length;
  const countSanctioned = loans.filter(l => l.status === 'SANCTIONED').length;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {lang === 'ta' ? 'கடன் ஒப்புதல் & வழங்கல் செயல்முறை மையம்' : 'Loan Approval & Disbursal Pipeline'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {lang === 'ta'
              ? '4-நிலை கடன் செயல்முறை: குழு ஆய்வு ➔ இறுதி அனுமதி ➔ தனி நிதி வழங்கல் ➔ தவணை கணக்கு ஏடு.'
              : 'Multi-tier workflow: Group Review ➔ Super Admin Sanction ➔ Independent Fund Disbursal ➔ Live Repayment Tracking.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {countPendingSuper > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
              padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem'
            }}>
              <Clock size={15} />
              <span>{countPendingSuper} awaiting Sanction</span>
            </div>
          )}

          {countSanctioned > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe',
              padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem'
            }}>
              <Send size={15} />
              <span>{countSanctioned} ready for Disbursal</span>
            </div>
          )}
        </div>
      </div>

      {sanctionSuccessInfo && (
        <div style={{
          padding: '1.25rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac',
          borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: '#166534'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem' }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <span>{sanctionSuccessInfo.message}</span>
          </div>
          {sanctionSuccessInfo.emailResult && (
            <div style={{ fontSize: '0.85rem', color: '#15803d', marginTop: '0.5rem' }}>
              <div><strong>Recipient:</strong> {sanctionSuccessInfo.emailResult.to}</div>
              <div><strong>Subject:</strong> {sanctionSuccessInfo.emailResult.subject}</div>
              {sanctionSuccessInfo.emailResult.preview_url && (
                <div style={{ marginTop: '0.35rem' }}>
                  <a
                    href={sanctionSuccessInfo.emailResult.preview_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#047857', textDecoration: 'underline', fontWeight: 700 }}
                  >
                    ↗ View Dispatched Email Preview (Ethereal Web Viewer)
                  </a>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setSanctionSuccessInfo(null)}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '0.75rem', fontSize: '0.775rem' }}
          >
            Dismiss Notice
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1.25rem', paddingBottom: '0.25rem' }}>
        {[
          { key: 'ALL', label: 'All Applications' },
          { key: 'PENDING_SUPER_ADMIN', label: 'Awaiting Sanction' },
          { key: 'SANCTIONED', label: 'Sanctioned (Ready to Disburse)' },
          { key: 'ACTIVE', label: 'Disbursed & Active' },
          { key: 'COMPLETED', label: 'Fully Repaid' },
          { key: 'PENDING_GROUP_ADMIN', label: 'In Group Review' },
          { key: 'REJECTED', label: 'Declined' }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.82rem',
              fontWeight: 600, border: 'none', cursor: 'pointer',
              backgroundColor: filter === tab.key ? '#047857' : '#f1f5f9',
              color: filter === tab.key ? '#ffffff' : '#475569',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loans Table */}
      <div className="card">
        {filteredLoans.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No loan requests match the selected filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ padding: '10px 14px' }}>Member / Group</th>
                  <th style={{ padding: '10px 14px' }}>Loan Account / App ID</th>
                  <th style={{ padding: '10px 14px' }}>Amount & Terms</th>
                  <th style={{ padding: '10px 14px' }}>Mode</th>
                  <th style={{ padding: '10px 14px' }}>Repaid / Balance</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Running Loans</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map(loan => (
                  <tr key={loan.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{loan.member_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>{loan.group_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{loan.member_email}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#047857' }}>
                      {loan.loan_account_number || loan.application_id || loan.id.slice(0, 8)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>₹{loan.amount}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {loan.repayment_frequency || 'Weekly'} • {loan.tenure_value || 10} {loan.tenure_unit || 'weeks'}
                      </div>
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
                        {/* STEP 3: SANCTION BUTTON */}
                        {loan.status === 'PENDING_SUPER_ADMIN' && (
                          <>
                            <button
                              onClick={() => setSanctionModalLoan(loan)}
                              style={{
                                padding: '4px 9px', borderRadius: '4px', border: 'none',
                                backgroundColor: '#047857', color: '#ffffff',
                                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                              }}
                            >
                              {t('sanction_btn')}
                            </button>
                            <button
                              onClick={() => setRejectLoan(loan)}
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

                        {/* STEP 4: DISBURSE BUTTON */}
                        {loan.status === 'SANCTIONED' && (
                          <button
                            onClick={() => {
                              setDisburseModalLoan(loan);
                              setDisburseRef(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
                            }}
                            style={{
                              padding: '4px 9px', borderRadius: '4px', border: 'none',
                              backgroundColor: '#0284c7', color: '#ffffff',
                              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '3px'
                            }}
                          >
                            <Send size={12} />
                            <span>{t('disburse_btn')}</span>
                          </button>
                        )}

                        {/* VIEW LEDGER FOR DISBURSED / COMPLETED LOANS */}
                        {(loan.status === 'DISBURSED' || loan.status === 'COMPLETED') && (
                          <button
                            type="button"
                            onClick={() => setLedgerLoanId(loan.id)}
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

                        <button
                          onClick={() => setViewTimelineLoan(loan)}
                          style={{
                            padding: '4px 7px', borderRadius: '4px', border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff', color: '#475569',
                            fontSize: '0.75rem', cursor: 'pointer'
                          }}
                          title="View Workflow Audit Timeline"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SANCTION CONFIRMATION MODAL */}
      {sanctionModalLoan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px',
            width: '100%', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#047857', fontSize: '1.2rem', fontWeight: 800 }}>
              Sanction Loan Application
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Confirm final sanction of <strong>₹{sanctionModalLoan.amount}</strong> for <strong>{sanctionModalLoan.member_name}</strong>.
            </p>

            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div><strong>Group:</strong> {sanctionModalLoan.group_name}</div>
              <div><strong>Repayment Frequency:</strong> {sanctionModalLoan.repayment_frequency || 'Weekly'}</div>
              <div><strong>Member Email:</strong> {sanctionModalLoan.member_email}</div>
              <div style={{ marginTop: '0.5rem', color: '#166534', fontWeight: 600 }}>
                ✉️ Triggers automated official sanction email to member's verified address.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSanctionModalLoan(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSanction}
                disabled={submitting}
                className="btn btn-primary btn-sm"
              >
                {submitting ? 'Sanctioning...' : 'Confirm Sanction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISBURSAL MODAL (STEP 4) */}
      {disburseModalLoan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px',
            width: '100%', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0284c7', fontSize: '1.2rem', fontWeight: 800 }}>
              {t('disburse_modal_title')}
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('disburse_modal_sub')}
            </p>

            <form onSubmit={handleDisburse} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {t('disburse_amount')}
                </label>
                <input
                  type="text"
                  disabled
                  value={`₹${disburseModalLoan.sanctioned_amount || disburseModalLoan.amount}`}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, backgroundColor: '#f8fafc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {t('disburse_method')} *
                </label>
                <select
                  value={disburseMethod}
                  onChange={(e) => setDisburseMethod(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="BANK_TRANSFER">Direct Bank Transfer / NEFT</option>
                  <option value="UPI">UPI Direct to Member VPA</option>
                  <option value="CASH">Cash Disbursal via Group Admin</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {t('txn_ref')} *
                </label>
                <input
                  type="text"
                  value={disburseRef}
                  onChange={(e) => setDisburseRef(e.target.value)}
                  required
                  placeholder="e.g. UTR-9840213"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setDisburseModalLoan(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#0284c7', color: '#ffffff', border: 'none',
                    padding: '6px 16px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {submitting ? 'Disbursing...' : t('confirm_disburse')}
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
              Provide rejection feedback for {rejectLoan.member_name} (₹{rejectLoan.amount}).
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Credit score or eligibility requirements not met..."
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
                onClick={handleReject}
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

      {/* TIMELINE MODAL */}
      {viewTimelineLoan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '520px',
            width: '100%', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 800 }}>
              Loan Audit Timeline
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {viewTimelineLoan.loan_account_number || viewTimelineLoan.application_id} • {viewTimelineLoan.member_name} (₹{viewTimelineLoan.amount})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
              {(viewTimelineLoan.timeline || []).map((step, idx) => (
                <div key={idx} style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#047857' }}>{step.by_name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(step.at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#334155' }}>{step.note}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setViewTimelineLoan(null)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPAYMENT LEDGER MODAL */}
      {ledgerLoanId && (
        <RepaymentLedgerModal
          loanId={ledgerLoanId}
          currentUser={{ role: 'SUPER_ADMIN', name: 'Super Admin' }}
          onClose={() => setLedgerLoanId(null)}
          onPaymentSuccess={() => fetchLoans()}
        />
      )}
    </div>
  );
}
