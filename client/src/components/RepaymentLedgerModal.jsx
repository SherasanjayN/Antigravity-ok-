import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, FileText, ArrowDownLeft, AlertCircle, Printer, RefreshCw } from 'lucide-react';
import { useLanguage } from '../i18n';
import { api } from '../services/api';

export default function RepaymentLedgerModal({ loanId, currentUser, onClose, onPaymentSuccess }) {
  const { t, lang } = useLanguage();
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'transactions' | 'record'

  // Repayment form state
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [txnRef, setTxnRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const data = await api.repayments.getLedger(loanId);
      setLedgerData(data);
      if (data.loan && data.loan.installment_amount && !amount) {
        setAmount(String(Math.min(data.loan.installment_amount, data.loan.outstanding_balance || data.loan.installment_amount)));
      }
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loanId) {
      fetchLedger();
    }
  }, [loanId]);

  const canRecordRepayment = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'GROUP_ADMIN';

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid positive payment amount.' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      const res = await api.repayments.record({
        loan_id: loanId,
        amount: Number(amount),
        payment_method: paymentMethod,
        transaction_reference: txnRef,
        payment_date: paymentDate,
        notes
      });

      setMessage({ type: 'success', text: res.message });
      setSelectedReceipt(res.receipt);
      setAmount('');
      setTxnRef('');
      setNotes('');
      await fetchLedger();
      if (onPaymentSuccess) onPaymentSuccess(res);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to record repayment.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#047857' }} />
          <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  const loan = ledgerData?.loan;
  const member = ledgerData?.member;
  const schedule = ledgerData?.schedule || [];
  const repayments = ledgerData?.repayments || [];

  const isCompleted = loan?.status === 'COMPLETED' || (loan?.outstanding_balance !== undefined && loan.outstanding_balance <= 0);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem', backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff', borderRadius: '14px', maxWidth: '820px',
        width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '1.75rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {t('view_ledger')}
              </h3>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: isCompleted ? '#dcfce7' : '#dbeafe',
                color: isCompleted ? '#15803d' : '#1d4ed8'
              }}>
                {isCompleted ? t('fully_repaid') : (loan?.status || 'ACTIVE')}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('loan_acc_no')}: <strong style={{ color: '#047857' }}>{loan?.loan_account_number || loan?.id}</strong>
              {member && ` • ${member.name} (${member.email})`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Financial KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('sanctioned_amount')}</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>₹{loan?.sanctioned_amount || loan?.amount}</span>
          </div>
          <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block' }}>{t('total_repaid')}</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#15803d' }}>₹{loan?.total_paid || 0}</span>
          </div>
          <div style={{ backgroundColor: '#fffbeb', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <span style={{ fontSize: '0.75rem', color: '#92400e', display: 'block' }}>{t('remaining_balance')}</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#b45309' }}>₹{loan?.outstanding_balance || 0}</span>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('next_due_date')}</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>
              {isCompleted ? t('fully_repaid') : (loan?.next_due_date || 'N/A')}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #f1f5f9', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            style={{
              padding: '0.65rem 1.25rem',
              border: 'none',
              borderBottom: activeTab === 'schedule' ? '3px solid #047857' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'schedule' ? '#047857' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('schedule_preview')} ({schedule.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            style={{
              padding: '0.65rem 1.25rem',
              border: 'none',
              borderBottom: activeTab === 'transactions' ? '3px solid #047857' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'transactions' ? '#047857' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {lang === 'ta' ? 'ரசீதுகள் & பதிவுகள்' : 'Payment Receipts'} ({repayments.length})
          </button>

          {canRecordRepayment && !isCompleted && (
            <button
              type="button"
              onClick={() => setActiveTab('record')}
              style={{
                padding: '0.65rem 1.25rem',
                border: 'none',
                borderBottom: activeTab === 'record' ? '3px solid #047857' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'record' ? '#047857' : '#059669',
                fontWeight: 700,
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              + {t('record_repayment_title')}
            </button>
          )}
        </div>

        {/* TAB 1: SCHEDULE */}
        {activeTab === 'schedule' && (
          <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '8px 12px' }}>{t('inst_no')}</th>
                  <th style={{ padding: '8px 12px' }}>{t('due_date')}</th>
                  <th style={{ padding: '8px 12px' }}>{t('inst_amount')}</th>
                  <th style={{ padding: '8px 12px' }}>{t('principal_portion')}</th>
                  <th style={{ padding: '8px 12px' }}>{t('interest_portion')}</th>
                  <th style={{ padding: '8px 12px' }}>Paid</th>
                  <th style={{ padding: '8px 12px' }}>{t('status_label')}</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(row => {
                  const paidTotal = (row.principal_paid || 0) + (row.interest_paid || 0);
                  const isPaid = row.status === 'PAID';
                  return (
                    <tr key={row.installment_number} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isPaid ? '#f0fdf4' : 'transparent' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>#{row.installment_number}</td>
                      <td style={{ padding: '8px 12px' }}>{row.due_date}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>₹{row.scheduled_amount}</td>
                      <td style={{ padding: '8px 12px' }}>₹{row.principal_due}</td>
                      <td style={{ padding: '8px 12px', color: '#b45309' }}>₹{row.interest_due}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: paidTotal > 0 ? '#15803d' : '#64748b' }}>
                        ₹{paidTotal}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                          backgroundColor: isPaid ? '#dcfce7' : row.status === 'PARTIALLY_PAID' ? '#fef3c7' : '#f1f5f9',
                          color: isPaid ? '#15803d' : row.status === 'PARTIALLY_PAID' ? '#92400e' : '#475569'
                        }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: TRANSACTIONS & RECEIPTS */}
        {activeTab === 'transactions' && (
          <div>
            {repayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                {lang === 'ta' ? 'இதுவரை தவணை பதிவுகள் இல்லை.' : 'No repayments recorded yet for this loan.'}
              </div>
            ) : (
              <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: '8px 12px' }}>{t('receipt_no')}</th>
                      <th style={{ padding: '8px 12px' }}>Date</th>
                      <th style={{ padding: '8px 12px' }}>Amount</th>
                      <th style={{ padding: '8px 12px' }}>Method</th>
                      <th style={{ padding: '8px 12px' }}>Balance Left</th>
                      <th style={{ padding: '8px 12px' }}>Recorded By</th>
                      <th style={{ padding: '8px 12px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repayments.map(rcp => (
                      <tr key={rcp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#047857' }}>{rcp.receipt_number}</td>
                        <td style={{ padding: '8px 12px' }}>{rcp.payment_date}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700 }}>₹{rcp.amount}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                            backgroundColor: rcp.payment_method === 'CASH' ? '#ecfdf5' : '#eff6ff',
                            color: rcp.payment_method === 'CASH' ? '#065f46' : '#1d4ed8'
                          }}>
                            {rcp.payment_method}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#b45309', fontWeight: 600 }}>₹{rcp.remaining_balance}</td>
                        <td style={{ padding: '8px 12px' }}>{rcp.recorded_by}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(rcp)}
                            style={{
                              fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px',
                              border: '1px solid #047857', backgroundColor: '#ffffff',
                              color: '#047857', cursor: 'pointer', fontWeight: 600
                            }}
                          >
                            View Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RECORD REPAYMENT FORM */}
        {activeTab === 'record' && canRecordRepayment && (
          <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {message && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.88rem',
                backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: message.type === 'success' ? '#15803d' : '#b91c1c',
                border: message.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca'
              }}>
                {message.text}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('amount_received')} *
                </label>
                <input
                  type="number"
                  min="1"
                  max={loan?.outstanding_balance || 10000}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  required
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                    border: '1.5px solid var(--border-color)', fontSize: '1.1rem', fontWeight: 700, color: '#047857'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Max payable: ₹{loan?.outstanding_balance}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('payment_method')} *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    style={{
                      flex: 1, padding: '0.65rem', borderRadius: '8px',
                      border: paymentMethod === 'CASH' ? '2px solid #047857' : '1.5px solid var(--border-color)',
                      backgroundColor: paymentMethod === 'CASH' ? '#ecfdf5' : '#ffffff',
                      color: paymentMethod === 'CASH' ? '#047857' : 'var(--text-main)',
                      fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {t('method_cash')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    style={{
                      flex: 1, padding: '0.65rem', borderRadius: '8px',
                      border: paymentMethod === 'UPI' ? '2px solid #047857' : '1.5px solid var(--border-color)',
                      backgroundColor: paymentMethod === 'UPI' ? '#ecfdf5' : '#ffffff',
                      color: paymentMethod === 'UPI' ? '#047857' : 'var(--text-main)',
                      fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {t('method_upi')}
                  </button>
                </div>
              </div>

              {paymentMethod === 'UPI' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    {t('txn_ref')}
                  </label>
                  <input
                    type="text"
                    value={txnRef}
                    onChange={(e) => setTxnRef(e.target.value)}
                    placeholder="e.g. UPI-9840-3921"
                    style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                      border: '1.5px solid var(--border-color)', fontSize: '0.9rem'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('payment_date')}
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                    border: '1.5px solid var(--border-color)', fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                {t('notes_label')} (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid in cash during SHG weekly circle meeting"
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                  border: '1.5px solid var(--border-color)', fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
                  backgroundColor: '#047857', color: '#ffffff', fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Recording...' : t('confirm_payment')}
              </button>
            </div>
          </form>
        )}

        {/* RECEIPT MODAL PREVIEW */}
        {selectedReceipt && (
          <div style={{
            marginTop: '1.5rem', padding: '1.25rem', border: '2px dashed #047857',
            borderRadius: '10px', backgroundColor: '#f0fdf4'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, color: '#065f46', fontSize: '1rem', fontWeight: 700 }}>
                🧾 Official Repayment Receipt ({selectedReceipt.receipt_number})
              </h4>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#047857' }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.6 }}>
              <div><strong>Member Name:</strong> {selectedReceipt.member_name}</div>
              <div><strong>Loan Account Number:</strong> {selectedReceipt.loan_account_number}</div>
              <div><strong>Amount Received:</strong> ₹{selectedReceipt.amount} ({selectedReceipt.payment_method})</div>
              <div><strong>Payment Date:</strong> {selectedReceipt.payment_date}</div>
              <div><strong>Total Paid So Far:</strong> ₹{selectedReceipt.total_paid}</div>
              <div><strong>Remaining Balance:</strong> ₹{selectedReceipt.remaining_balance}</div>
              <div><strong>Next Due Date:</strong> {selectedReceipt.remaining_balance <= 0 ? 'Fully Repaid 🎉' : selectedReceipt.next_due_date}</div>
              <div><strong>Recorded By:</strong> {selectedReceipt.recorded_by}</div>
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  fontSize: '0.8rem', padding: '4px 12px', borderRadius: '4px',
                  backgroundColor: '#047857', color: '#ffffff', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Printer size={14} /> Print Receipt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
