import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Lock, Mail, LogIn, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { api, setToken } from '../../services/api';
import { useLanguage } from '../../i18n';

export default function LoginForm({ onLoginSuccess, onSwitchToRegister, onPendingUser }) {
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const quickLogins = [
    {
      roleName: lang === 'ta' ? 'முதன்மை நிர்வாகி' : 'Super Admin',
      email: 'sherasanjayn@gmail.com',
      pass: 'Admin@12345',
      badge: '#047857'
    },
    {
      roleName: lang === 'ta' ? 'குழு தலைவர் / நிர்வாகி' : 'Group Admin (Kavitha)',
      email: 'kavitha.m@example.com',
      pass: 'Kavitha@123',
      badge: '#0284c7'
    },
    {
      roleName: lang === 'ta' ? 'குழு உறுப்பினர்' : 'Member (Lakshmi)',
      email: 'lakshmi.r@example.com',
      pass: 'Lakshmi@123',
      badge: '#7c3aed'
    }
  ];

  const handleQuickFill = (item) => {
    setEmail(item.email);
    setPassword(item.pass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError(lang === 'ta' ? 'மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.' : 'Please provide your registered email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.auth.login({
        email: email.trim(),
        password
      });

      if (res.status === 'PENDING') {
        onPendingUser(res.user);
        return;
      }

      if (res.status === 'REJECTED') {
        setError(res.error || (lang === 'ta' ? 'உங்கள் பதிவு கோரிக்கை நிராகரிக்கப்பட்டுள்ளது.' : 'Your registration request has been declined.'));
        return;
      }

      if (res.token && res.user) {
        setToken(res.token);
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || (lang === 'ta' ? 'உள்நுழைவு தோல்வியடைந்தது. விவரங்களை சரிபார்க்கவும்.' : 'Authentication failed. Please verify your credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>
      <div className="card" style={{ padding: '2rem 1.75rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            margin: '0 auto 0.75rem auto',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #047857 0%, #0d9488 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)'
          }}>
            <Lock size={24} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
            {t('login_title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            {t('login_subtitle')}
          </p>
        </div>

// Demo test accounts section removed

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label className="form-label">{t('email_label')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sherasanjayn@gmail.com"
              className="form-input"
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('password_label')}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                autoComplete="off"
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', marginTop: '0.75rem', fontSize: '0.95rem' }}
          >
            <LogIn size={18} />
            <span>{submitting ? (lang === 'ta' ? 'சரிபார்க்கிறது...' : 'Authenticating...') : t('signin')}</span>
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          {lang === 'ta' ? 'புதிய சுய உதவிக் குழு உறுப்பினரா?' : 'New self-help group member?'}{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-700)',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {t('signup')}
          </button>
        </div>
      </div>
    </div>
  );
}
