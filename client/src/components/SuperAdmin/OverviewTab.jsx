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
              <span>Financial & Loan Ratio Overview</span>
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
              <div style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${weeklyPct}%`, backgroundColor: '#047857', transition: 'width 0.4s ease' }} title={`Weekly: ${weeklyPct}%`} />
                <div style={{ width: `${100 - weeklyPct}%`, backgroundColor: '#0284c7', transition: 'width 0.4s ease' }} title={`Monthly: ${100 - weeklyPct}%`} />
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
                  Cash: ₹{cashTotal.toLocaleString('en-IN')} ({cashPct}%) • UPI: ₹{upiTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${cashPct}%`, backgroundColor: '#10b981', transition: 'width 0.4s ease' }} title={`Cash: ${cashPct}%`} />
                <div style={{ width: `${100 - cashPct}%`, backgroundColor: '#6366f1', transition: 'width 0.4s ease' }} title={`UPI: ${100 - cashPct}%`} />
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

      {/* INNOVATIVE SUPER ADMIN CHARTS SECTION */}
      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        {/* Chart 1: Group Performance & Recovery Comparison Matrix */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Building2 size={18} color="#047857" />
              <span>Group Financial Recovery Matrix (All Groups)</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {analytics?.groupBreakdown && analytics.groupBreakdown.length > 0 ? (
              analytics.groupBreakdown.map((grp) => {
                const recoveryRate = Math.min(100, Math.max(0, grp.recoveryRate || 0));
                return (
                  <div key={grp.id} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{grp.group_name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({grp.area})</span>
                      </div>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px',
                        backgroundColor: recoveryRate >= 50 ? '#dcfce7' : '#fef3c7',
                        color: recoveryRate >= 50 ? '#15803d' : '#92400e'
                      }}>
                        {recoveryRate}% Recovered
                      </span>
                    </div>

                    {/* Multi-layered visual progress bar */}
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${recoveryRate}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #10b981 0%, #047857 100%)',
                          borderRadius: '4px',
                          transition: 'width 0.5s ease'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#475569', marginTop: '0.35rem' }}>
                      <span>Sanctioned: ₹{grp.sanctioned.toLocaleString('en-IN')}</span>
                      <span>Repaid: <strong style={{ color: '#15803d' }}>₹{grp.repaid.toLocaleString('en-IN')}</strong></span>
                      <span>Balance: <strong style={{ color: '#b45309' }}>₹{grp.balance.toLocaleString('en-IN')}</strong></span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No group loan data registered yet.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Loan Purpose Distribution & Repayment Trends */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <PieChart size={18} color="#047857" />
              <span>Loan Purpose Distribution & Livelihood Trends</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Visual Purpose Distribution Pills & Bars */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Primary Loan Enterprise Allocation:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {analytics?.purposeBreakdown && analytics.purposeBreakdown.length > 0 ? (
                  analytics.purposeBreakdown.map((p, idx) => {
                    const colors = ['#047857', '#0284c7', '#7c3aed', '#d97706', '#ec4899'];
                    const color = colors[idx % colors.length];
                    const totalPurposes = analytics.purposeBreakdown.reduce((sum, item) => sum + item.count, 0) || 1;
                    const pct = Math.round((p.count / totalPurposes) * 100);
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{p.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{p.count} applications ({pct}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Tailoring, Dairy, Handicrafts & Micro-Enterprise</div>
                )}
              </div>
            </div>

            {/* Repayment Timeline Sparkline / Chart */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                Monthly Collection Growth Trend:
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '90px',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                {analytics?.repaymentTrends && analytics.repaymentTrends.length > 0 ? (
                  analytics.repaymentTrends.map((t, idx) => {
                    const maxAmt = Math.max(...analytics.repaymentTrends.map(x => x.amount), 1000);
                    const barHeight = Math.max(15, Math.round((t.amount / maxAmt) * 65));
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#047857' }}>₹{t.amount}</span>
                        <div
                          style={{
                            width: '24px',
                            height: `${barHeight}px`,
                            background: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
                            borderRadius: '4px 4px 0 0'
                          }}
                        />
                        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{t.month}</span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ width: '100%', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Repayments tracked in real-time as Group Admins record collections.
                  </div>
                )}
              </div>
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
