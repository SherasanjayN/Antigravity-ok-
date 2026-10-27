import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, XCircle, ExternalLink, Clock, RefreshCw, AlertCircle, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../i18n';

export default function EmailLogsTab() {
  const { t, lang } = useLanguage();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryingId, setRetryingId] = useState(null);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getEmailLogs();
      setEmails(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch email logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  const handleRetry = async (emailId) => {
    setRetryingId(emailId);
    try {
      await api.admin.retryEmail(emailId);
      await loadEmails();
    } catch (err) {
      alert(err.message || 'Retry failed.');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {lang === 'ta' ? 'தானியங்கி மின்னஞ்சல் தணிக்கை பதிவுகள்' : 'Automated Email Dispatch & Outbox Audit'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {lang === 'ta'
              ? 'கடன் அனுமதி, ரொக்கம்/யுபிஐ தவணை ரசீதுகள் மற்றும் கடன் வழங்கல் மின்னஞ்சல் விநியோக நிலை.'
              : 'Verifiable transactional log of all sanction notices, disbursement alerts, and cash/UPI repayment receipts.'}
          </p>
        </div>

        <button onClick={loadEmails} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Delivery Logs</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading email delivery logs...
        </div>
      ) : emails.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Mail size={42} color="#047857" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>No emails dispatched yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            When loans are sanctioned, disbursed, or repayments are recorded, real confirmation emails are dispatched and tracked here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {emails.map((email) => {
            const isSent = (email.delivery_status || email.status) === 'SENT';
            const isFailed = (email.delivery_status || email.status) === 'FAILED';
            return (
              <div key={email.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        backgroundColor: isSent ? '#dcfce7' : '#fee2e2',
                        color: isSent ? '#15803d' : '#b91c1c'
                      }}>
                        {isSent ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {email.delivery_status || email.status || 'SENT'}
                      </span>
                      <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{email.subject}</strong>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      To: <strong>{email.recipient_name}</strong> &lt;{email.recipient_email || email.to}&gt;
                      {email.notification_type && ` • Type: ${email.notification_type}`}
                      {email.attempt_count > 1 && ` • Attempts: ${email.attempt_count}`}
                    </div>

                    {isFailed && email.last_error && (
                      <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '0.35rem', fontWeight: 600 }}>
                        Error: {email.last_error}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {email.sent_at ? new Date(email.sent_at).toLocaleString() : new Date(email.created_at).toLocaleString()}
                    </span>

                    {isFailed && (
                      <button
                        type="button"
                        onClick={() => handleRetry(email.id)}
                        disabled={retryingId === email.id}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <RotateCcw size={12} className={retryingId === email.id ? 'spin' : ''} />
                        <span>{retryingId === email.id ? 'Retrying...' : 'Retry Delivery'}</span>
                      </button>
                    )}

                    {email.preview_url && (
                      <a
                        href={email.preview_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <ExternalLink size={12} />
                        <span>View Ethereal Preview</span>
                      </a>
                    )}
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  color: '#334155',
                  border: '1px solid var(--border-color)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '140px',
                  overflowY: 'auto'
                }}>
                  {email.body}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
