import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  IndianRupee,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Megaphone,
  Send,
  PieChart,
  BarChart3,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import AnnouncementsFeed from '../AnnouncementsFeed';
import { useLanguage } from '../../i18n';

export default function OverviewTab({ onNavigate }) {
  const { t, lang } = useLanguage();
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.admin.getOverview(),
      api.admin.getAnalytics(),
      api.announcements.getAll()
    ])
      .then(([ov, an, ancs]) => {
        setData(ov);
        setAnalytics(an);
        setAnnouncements(ancs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        {t('loading')}
      </div>
    );
  }

  const {
    totalMembers = 0,
    approvedMembers = 0,
    pendingMembers = 0,
    activeGroups = 0,
    totalSanctionedAmount = 0,
    totalDisbursedAmount = 0,
    totalCollectedAmount = 0,
    totalOutstandingBalance = 0,
    overdueCount = 0,
    pendingLoanApprovals = 0,
    awaitingDisbursement = 0
  } = data;

  const weeklyCount = analytics?.weeklyVsMonthly?.weekly || 0;
  const monthlyCount = analytics?.weeklyVsMonthly?.monthly || 0;
  const totalLoanCount = (weeklyCount + monthlyCount) || 1;
  const weeklyPct = Math.round((weeklyCount / totalLoanCount) * 100);

  const cashTotal = analytics?.cashVsUpi?.cash || 0;
  const upiTotal = analytics?.cashVsUpi?.upi || 0;
  const totalCollectionSum = (cashTotal + upiTotal) || 1;
  const cashPct = Math.round((cashTotal / totalCollectionSum) * 100);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
          {lang === 'ta' ? 'முதன்மை நிர்வாகி மேலோட்டம்' : 'Super Admin Master Dashboard'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
          {lang === 'ta'
            ? 'சுய உதவிக் குழுக்கள், உறுப்பினர் சேர்க்கை மற்றும் 4-நிலை கடன் ஒப்புதல் மற்றும் வசூல் பகுப்பாய்வு.'
            : 'Real-time financial oversight of SHGs, 4-stage loan approvals, disbursements, and repayment collection.'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #047857' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('metric_total_members')}
            </span>
            <Users size={20} color="#047857" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
            {totalMembers}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {approvedMembers} Approved • {pendingMembers} Pending
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('metric_active_groups')}
            </span>
            <Building2 size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
            {activeGroups}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Dedicated chatrooms active
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('metric_sanctioned_funds')}
            </span>
            <IndianRupee size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#047857' }}>
            ₹{totalSanctionedAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Disbursed: ₹{totalDisbursedAmount.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #d97706' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('metric_outstanding')}
            </span>
            <Clock size={20} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#d97706' }}>
            ₹{totalOutstandingBalance.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Collected: ₹{totalCollectedAmount.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        {/* 4-Stage Loan Workflow Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IndianRupee size={18} color="#047857" />
              <span>{t('pipeline_title')}</span>
            </div>
            <button onClick={() => onNavigate('loans')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
              <span>View All</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.85rem 1rem', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>
                  {t('stage_1')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
                  {t('stage_1_sub')}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.85rem 1rem', backgroundColor: '#ede9fe', borderRadius: '8px', border: '1px solid #ddd6fe'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#5b21b6', fontSize: '0.9rem' }}>
                  {t('stage_2')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6d28d9' }}>
                  {t('stage_2_sub')}
                </div>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#5b21b6' }}>
                {pendingLoanApprovals}
              </span>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.85rem 1rem', backgroundColor: '#e0f2fe', borderRadius: '8px', border: '1px solid #bae6fd'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.9rem' }}>
                  {t('stage_3')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0284c7' }}>
                  {t('stage_3_sub')}
                </div>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0369a1' }}>
                {awaitingDisbursement}
              </span>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.85rem 1rem', backgroundColor: '#dcfce7', borderRadius: '8px', border: '1px solid #bbf7d0'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>
                  {t('stage_4')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                  {t('stage_4_sub')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Analytics Charts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <BarChart3 size={18} color="#047857" />
              <span>Financial Distribution Analytics</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Weekly vs Monthly Loans */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600 }}>Repayment Frequency Ratio</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  Weekly: {weeklyCount} ({weeklyPct}%) • Monthly: {monthlyCount}
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${weeklyPct}%`, backgroundColor: '#047857' }} title={`Weekly: ${weeklyPct}%`} />
                <div style={{ width: `${100 - weeklyPct}%`, backgroundColor: '#0284c7' }} title={`Monthly: ${100 - weeklyPct}%`} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#047857' }} /> Weekly Loans
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }} /> Monthly Loans
                </span>
              </div>
            </div>

            {/* Cash vs UPI Collection Ratio */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600 }}>Payment Method Collections</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  Cash: ₹{cashTotal} ({cashPct}%) • UPI: ₹{upiTotal}
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${cashPct}%`, backgroundColor: '#10b981' }} title={`Cash: ${cashPct}%`} />
                <div style={{ width: `${100 - cashPct}%`, backgroundColor: '#6366f1' }} title={`UPI: ${100 - cashPct}%`} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} /> Cash Repayments
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1' }} /> UPI Repayments
                </span>
              </div>
            </div>

            {/* Overdue Alert */}
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '8px',
              backgroundColor: overdueCount > 0 ? '#fef2f2' : '#f0fdf4',
              border: overdueCount > 0 ? '1px solid #fecaca' : '1px solid #bbf7d0',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              color: overdueCount > 0 ? '#b91c1c' : '#15803d', fontSize: '0.85rem', fontWeight: 600
            }}>
              <AlertCircle size={16} />
              <span>
                {overdueCount > 0
                  ? `${overdueCount} loan instalments are currently overdue.`
                  : 'Zero overdue instalments. All active repayment schedules are healthy.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Announcements Preview */}
      <div>
        <AnnouncementsFeed announcements={announcements} />
      </div>
    </div>
  );
}
