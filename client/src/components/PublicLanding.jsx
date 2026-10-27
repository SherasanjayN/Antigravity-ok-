import React, { useState } from 'react';
import { Users, ShieldCheck, Calculator, ArrowRight, CheckCircle2, TrendingUp, Sparkles, HeartHandshake } from 'lucide-react';
import LoginForm from './Auth/LoginForm';
import RegisterForm from './Auth/RegisterForm';
import LoanCalculatorModal from './LoanCalculatorModal';
import { useLanguage } from '../i18n';

export default function PublicLanding({ onLoginSuccess, onRegisterSuccess, onPendingUser }) {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register' | 'calculator'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(180deg, #ecfdf5 0%, #f8fafc 100%)',
        borderBottom: '1px solid #d1fae5',
        padding: '3rem 1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '20px',
            backgroundColor: '#d1fae5',
            color: '#065f46',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1rem'
          }}>
            <Sparkles size={16} />
            <span>{lang === 'ta' ? 'தமிழ்நாடு மகளிர் சுய உதவிக் குழு மேலாண்மை அமைப்பு' : 'Tamil Nadu Women Self-Help Group Empowerment Portal'}</span>
          </div>

          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#064e3b',
            margin: '0 0 1rem 0',
            lineHeight: 1.2,
            letterSpacing: '-0.02em'
          }}>
            {t('app_tamil_title')} • {t('app_title')}
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: '#334155',
            margin: '0 auto 2rem auto',
            maxWidth: '720px',
            lineHeight: 1.6
          }}>
            {lang === 'ta'
              ? 'சுய உதவிக் குழு உறுப்பினர்களுக்கான வெளிப்படையான 3-நிலை கடன் ஒப்புதல், வாராந்திர/மாதாந்திர தவணைக் கணக்கு ஏடு, தானியங்கி மின்னஞ்சல் ரசீதுகள் மற்றும் நேரடி குழு அரட்டை தளம்.'
              : 'A transparent digital financial platform for Self-Help Groups (SHGs). Empowering rural women with multi-tier loan approvals, reducing-balance EMI calculators, automated email receipts, and real-time community engagement.'}
          </p>

          {/* Key Value Points */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            textAlign: 'left'
          }}>
            <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857', fontWeight: 700, marginBottom: '0.35rem' }}>
                <ShieldCheck size={20} />
                <span>{lang === 'ta' ? '3-நிலை ஒப்புதல்' : '3-Tier Approval'}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                {lang === 'ta' ? 'உறுப்பினர் ➔ குழு நிர்வாகி ➔ முதன்மை நிர்வாகி இறுதி அனுமதி & தனி வழங்கல்.' : 'Member ➔ Group Admin review ➔ Super Admin final sanction & independent disbursement.'}
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857', fontWeight: 700, marginBottom: '0.35rem' }}>
                <Calculator size={20} />
                <span>{lang === 'ta' ? 'குறைந்துவரும் வட்டி EMI' : 'Reducing-Balance EMI'}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                {lang === 'ta' ? 'வாராந்திர மற்றும் மாதாந்திர தவணைகளுக்கு துல்லியமான கணக்கீடு.' : 'Transparent weekly and monthly reducing-balance formulas with full amortization preview.'}
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857', fontWeight: 700, marginBottom: '0.35rem' }}>
                <HeartHandshake size={20} />
                <span>{lang === 'ta' ? 'ரொக்கம் & யுபிஐ ரசீதுகள்' : 'Cash & UPI Receipts'}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                {lang === 'ta' ? 'ஒவ்வொரு தவணைக்கும் உடனடி மின்னஞ்சல் ரசீது மற்றும் கணக்கு ஏடு புதுப்பித்தல்.' : 'Instant automated email receipts for all payments with complete ledger audit trail.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Container */}
      <section style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem', width: '100%' }}>
        {/* Navigation Tabs for Public Visitors */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '2rem'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            style={{
              padding: '0.75rem 1.75rem',
              borderRadius: '30px',
              border: activeTab === 'login' ? '2px solid #047857' : '1.5px solid #cbd5e1',
              backgroundColor: activeTab === 'login' ? '#047857' : '#ffffff',
              color: activeTab === 'login' ? '#ffffff' : '#334155',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            {t('signin')}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('register')}
            style={{
              padding: '0.75rem 1.75rem',
              borderRadius: '30px',
              border: activeTab === 'register' ? '2px solid #047857' : '1.5px solid #cbd5e1',
              backgroundColor: activeTab === 'register' ? '#047857' : '#ffffff',
              color: activeTab === 'register' ? '#ffffff' : '#334155',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            {t('signup')}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            style={{
              padding: '0.75rem 1.75rem',
              borderRadius: '30px',
              border: activeTab === 'calculator' ? '2px solid #047857' : '1.5px solid #cbd5e1',
              backgroundColor: activeTab === 'calculator' ? '#ecfdf5' : '#ffffff',
              color: '#065f46',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Calculator size={18} />
            <span>{t('tab_loans')} / {t('calc_title')}</span>
          </button>
        </div>

        {/* View Content */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          padding: '2rem'
        }}>
          {activeTab === 'login' && (
            <div style={{ maxWidth: '440px', margin: '0 auto' }}>
              <LoginForm
                onLoginSuccess={onLoginSuccess}
                onSwitchToRegister={() => setActiveTab('register')}
                onPendingUser={onPendingUser}
              />
            </div>
          )}

          {activeTab === 'register' && (
            <div style={{ maxWidth: '520px', margin: '0 auto' }}>
              <RegisterForm
                onRegisterSuccess={onRegisterSuccess}
                onSwitchToLogin={() => setActiveTab('login')}
              />
            </div>
          )}

          {activeTab === 'calculator' && (
            <div>
              <LoanCalculatorModal isEmbedded={true} />
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#64748b'
      }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#334155' }}>
          மகளிர் குழு • Magalir Kuzhu Management System
        </p>
        <p style={{ margin: 0 }}>
          Dedicated to financial inclusion, mutual assistance, and community empowerment in Tamil Nadu.
        </p>
      </footer>
    </div>
  );
}
