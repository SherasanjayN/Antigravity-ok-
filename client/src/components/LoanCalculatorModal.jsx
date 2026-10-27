import React, { useState, useEffect } from 'react';
import { Calculator, Calendar, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { useLanguage } from '../i18n';
import { api } from '../services/api';

export default function LoanCalculatorModal({ onClose, onSelectLoanTerms = null, isEmbedded = false }) {
  const { t, lang } = useLanguage();
  const [principal, setPrincipal] = useState(5000);
  const [annualRate, setAnnualRate] = useState(12);
  const [frequency, setFrequency] = useState('WEEKLY');
  const [tenure, setTenure] = useState(10);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Recalculate whenever inputs change
  useEffect(() => {
    let isMounted = true;
    async function calculate() {
      if (principal <= 0) return;
      try {
        setLoading(true);
        const res = await api.calculator({
          principal: Number(principal),
          annual_interest_rate: Number(annualRate),
          repayment_frequency: frequency,
          tenure_value: Number(tenure),
          start_date: startDate
        });
        if (isMounted) {
          setScheduleData(res);
        }
      } catch (err) {
        console.error('Calculation error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    calculate();
    return () => { isMounted = false; };
  }, [principal, annualRate, frequency, tenure, startDate]);

  const emi = scheduleData?.calc?.emi || 0;
  const totalInterest = scheduleData?.calc?.totalInterest || 0;
  const totalRepayment = scheduleData?.calc?.totalRepayment || 0;
  const schedule = scheduleData?.schedule || [];

  const handleApplyTheseTerms = () => {
    if (onSelectLoanTerms) {
      onSelectLoanTerms({
        amount: principal,
        annual_interest_rate: annualRate,
        repayment_frequency: frequency,
        tenure_value: tenure,
        preferred_first_due_date: startDate,
        calculated_emi: emi,
        total_interest: totalInterest,
        total_repayment: totalRepayment
      });
    }
    if (onClose) onClose();
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
        border: '1px solid #a7f3d0',
        borderRadius: '10px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          backgroundColor: '#047857',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Calculator size={22} />
        </div>
        <div>
          <h4 style={{ margin: 0, color: '#065f46', fontSize: '1rem', fontWeight: 600 }}>
            {t('calc_title')}
          </h4>
          <p style={{ margin: '2px 0 0 0', color: '#047857', fontSize: '0.85rem' }}>
            {t('calc_subtitle')}
          </p>
        </div>
      </div>

      {/* Inputs Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {/* Principal Amount */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            {t('loan_amount_label')}
          </label>
          <input
            type="number"
            min="1000"
            max="10000"
            step="500"
            value={principal}
            onChange={(e) => setPrincipal(Math.min(10000, Math.max(0, Number(e.target.value))))}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: '1.5px solid var(--border-color)',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#065f46'
            }}
          />
          {/* Quick presets */}
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
            {[2000, 5000, 8000, 10000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setPrincipal(val)}
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: principal === val ? '1px solid #047857' : '1px solid #e5e7eb',
                  backgroundColor: principal === val ? '#ecfdf5' : '#f9fafb',
                  color: principal === val ? '#065f46' : '#4b5563',
                  cursor: 'pointer',
                  fontWeight: principal === val ? 700 : 500
                }}
              >
                ₹{val}
              </button>
            ))}
          </div>
        </div>

        {/* Repayment Frequency */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            {t('frequency_label')}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => { setFrequency('WEEKLY'); setTenure(10); }}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '8px',
                border: frequency === 'WEEKLY' ? '2px solid #059669' : '1.5px solid var(--border-color)',
                backgroundColor: frequency === 'WEEKLY' ? '#ecfdf5' : '#ffffff',
                color: frequency === 'WEEKLY' ? '#065f46' : 'var(--text-main)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t('freq_weekly')}
            </button>
            <button
              type="button"
              onClick={() => { setFrequency('MONTHLY'); setTenure(6); }}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '8px',
                border: frequency === 'MONTHLY' ? '2px solid #059669' : '1.5px solid var(--border-color)',
                backgroundColor: frequency === 'MONTHLY' ? '#ecfdf5' : '#ffffff',
                color: frequency === 'MONTHLY' ? '#065f46' : 'var(--text-main)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t('freq_monthly')}
            </button>
          </div>
        </div>

        {/* Tenure Duration */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            {t('tenure_label')} ({frequency === 'WEEKLY' ? (lang === 'ta' ? 'வாரங்கள்' : 'Weeks') : (lang === 'ta' ? 'மாதங்கள்' : 'Months')})
          </label>
          <select
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: '1.5px solid var(--border-color)',
              fontSize: '0.95rem',
              color: 'var(--text-main)',
              backgroundColor: '#ffffff'
            }}
          >
            {frequency === 'WEEKLY' ? (
              <>
                <option value={8}>8 {lang === 'ta' ? 'வாரங்கள்' : 'Weeks'}</option>
                <option value={10}>10 {lang === 'ta' ? 'வாரங்கள் (வழக்கமானது)' : 'Weeks (Standard)'}</option>
                <option value={12}>12 {lang === 'ta' ? 'வாரங்கள்' : 'Weeks'}</option>
                <option value={16}>16 {lang === 'ta' ? 'வாரங்கள்' : 'Weeks'}</option>
                <option value={20}>20 {lang === 'ta' ? 'வாரங்கள்' : 'Weeks'}</option>
              </>
            ) : (
              <>
                <option value={3}>3 {lang === 'ta' ? 'மாதங்கள்' : 'Months'}</option>
                <option value={6}>6 {lang === 'ta' ? 'மாதங்கள் (வழக்கமானது)' : 'Months (Standard)'}</option>
                <option value={9}>9 {lang === 'ta' ? 'மாதங்கள்' : 'Months'}</option>
                <option value={12}>12 {lang === 'ta' ? 'மாதங்கள் (1 ஆண்டு)' : 'Months (1 Year)'}</option>
              </>
            )}
          </select>
        </div>

        {/* Annual Interest Rate & First Date */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            {t('interest_rate')} (Reducing Balance)
          </label>
          <input
            type="number"
            min="0"
            max="24"
            step="1"
            value={annualRate}
            onChange={(e) => setAnnualRate(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: '1.5px solid var(--border-color)',
              fontSize: '0.95rem'
            }}
          />
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.875rem'
      }}>
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {t('estimated_emi')}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#047857', marginTop: '0.25rem' }}>
            ₹{emi}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.15rem' }}>
            per {frequency === 'WEEKLY' ? (lang === 'ta' ? 'வாரம்' : 'week') : (lang === 'ta' ? 'மாதம்' : 'month')}
          </div>
        </div>

        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {t('total_interest')}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#d97706', marginTop: '0.25rem' }}>
            ₹{totalInterest}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            {annualRate}% p.a.
          </div>
        </div>

        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {t('total_repayment')}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginTop: '0.25rem' }}>
            ₹{totalRepayment}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            over {tenure} instalments
          </div>
        </div>
      </div>

      {/* Schedule Table Preview */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {t('schedule_preview')} ({schedule.length} {lang === 'ta' ? 'தவணைகள்' : 'instalments'})
          </h4>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Start: {schedule[0]?.due_date} ➔ End: {schedule[schedule.length - 1]?.due_date}
          </span>
        </div>

        <div style={{
          maxHeight: '220px',
          overflowY: 'auto',
          border: '1px solid var(--border-color)',
          borderRadius: '8px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>{t('inst_no')}</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>{t('due_date')}</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>{t('opening_bal')}</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>{t('inst_amount')}</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>{t('principal_portion')}</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>{t('interest_portion')}</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>{t('closing_bal')}</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr key={row.installment_number} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>#{row.installment_number}</td>
                  <td style={{ padding: '8px 12px' }}>{row.due_date}</td>
                  <td style={{ padding: '8px 12px' }}>₹{row.opening_balance}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#047857' }}>₹{row.scheduled_amount}</td>
                  <td style={{ padding: '8px 12px' }}>₹{row.principal_due}</td>
                  <td style={{ padding: '8px 12px', color: '#b45309' }}>₹{row.interest_due}</td>
                  <td style={{ padding: '8px 12px' }}>₹{row.closing_balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Footer if used to pick terms */}
      {onSelectLoanTerms && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: '#ffffff',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {t('cancel')}
            </button>
          )}
          <button
            type="button"
            onClick={handleApplyTheseTerms}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#047857',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>{lang === 'ta' ? 'இந்த விதிமுறைகளைத் தேர்ந்தெடு' : 'Use These Loan Terms'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        maxWidth: '780px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.75rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {t('calc_title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}
