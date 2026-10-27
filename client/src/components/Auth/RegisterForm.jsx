import React, { useState } from 'react';
import { UserPlus, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../i18n';
import ValidatedVoiceField from '../VoiceInput/ValidatedVoiceField';

export default function RegisterForm({ onRegisterSuccess, onSwitchToLogin }) {
  const { t, lang } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    area: '',
    district: '',
    password: '',
    confirmPassword: ''
  });

  const [clientErrors, setClientErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const errs = {};

    const lettersOnly = formData.name.replace(/[^a-zA-Z\u0B80-\u0BFF]/g, '');
    if (!formData.name.trim() || lettersOnly.length < 3) {
      errs.name = lang === 'ta' ? 'பெயர் குறைந்தது 3 எழுத்துக்களைக் கொண்டிருக்க வேண்டும்.' : 'Name must contain at least 3 letters.';
    }

    if (!/^\d{10}$/.test(formData.phone.trim())) {
      errs.phone = lang === 'ta' ? 'கைபேசி எண் சரியாக 10 இலக்கங்களாக இருக்க வேண்டும்.' : 'Phone number must be exactly 10 digits.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      errs.email = lang === 'ta' ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter a valid email address.';
    }

    if (!formData.area.trim()) {
      errs.area = lang === 'ta' ? 'பகுதி / கிராமம் கட்டாயமாகும்.' : 'Area / Locality is required.';
    }
    if (!formData.district.trim()) {
      errs.district = lang === 'ta' ? 'மாவட்டம் கட்டாயமாகும்.' : 'District is required.';
    }

    if (formData.password.length < 6 || !/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      errs.password = lang === 'ta' ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துக்களுடன் எண்களையும் கொண்டிருக்க வேண்டும்.' : 'Password must be at least 6 characters and contain letters and numbers.';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = lang === 'ta' ? 'கடவுச்சொற்கள் பொருந்தவில்லை.' : 'Passwords do not match.';
    }

    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (clientErrors[name]) {
      setClientErrors(prev => ({ ...prev, [name]: null }));
    }
    setApiError('');
  };

  const handleVoiceChange = (fieldName, cleanValue) => {
    setFormData(prev => ({ ...prev, [fieldName]: cleanValue }));
    if (clientErrors[fieldName]) {
      setClientErrors(prev => ({ ...prev, [fieldName]: null }));
    }
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await api.auth.register({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        area: formData.area.trim(),
        district: formData.district.trim(),
        password: formData.password
      });

      if (res.user) {
        onRegisterSuccess(res.user);
      }
    } catch (err) {
      setApiError(err.message || (lang === 'ta' ? 'பதிவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.' : 'Registration failed. Please check inputs and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', width: '100%' }}>
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
            <UserPlus size={24} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
            {t('register_title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            {t('register_subtitle')}
          </p>
        </div>

        {apiError && (
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
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Full Name Field with Voice Input */}
          <div className="form-group">
            <label className="form-label">{t('full_name_label')} *</label>
            <ValidatedVoiceField
              value={formData.name}
              onChange={(val) => handleVoiceChange('name', val)}
              validationRules={{
                type: 'text',
                minLength: 3,
                errorMessage: lang === 'ta' ? 'பெயர் குறைந்தது 3 எழுத்துக்களைக் கொண்டிருக்க வேண்டும்.' : 'Name must contain at least 3 letters.'
              }}
            >
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={lang === 'ta' ? 'எ.கா. கவிதா முருகன்' : 'e.g. Kavitha Murugan'}
                className="form-input"
                autoComplete="off"
                required
              />
            </ValidatedVoiceField>
            {clientErrors.name && <span className="form-error">{clientErrors.name}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            {/* Phone with Voice Input */}
            <div className="form-group">
              <label className="form-label">{t('phone_label')} *</label>
              <ValidatedVoiceField
                value={formData.phone}
                onChange={(val) => handleVoiceChange('phone', val)}
                validationRules={{
                  type: 'tel',
                  pattern: /^\d{10}$/,
                  errorMessage: lang === 'ta' ? 'கைபேசி எண் சரியாக 10 இலக்கங்களாக இருக்க வேண்டும்.' : 'Phone number must be exactly 10 digits.'
                }}
              >
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="form-input"
                  autoComplete="off"
                  maxLength={10}
                  required
                />
              </ValidatedVoiceField>
              {clientErrors.phone && <span className="form-error">{clientErrors.phone}</span>}
            </div>

            {/* Email with Voice Input */}
            <div className="form-group">
              <label className="form-label">{t('email_label')} *</label>
              <ValidatedVoiceField
                value={formData.email}
                onChange={(val) => handleVoiceChange('email', val)}
                validationRules={{
                  type: 'email',
                  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  errorMessage: lang === 'ta' ? 'சரியான மின்னஞ்சல் முகவரியை உச்சரிக்கவும்.' : 'Please enter or speak a valid email address.'
                }}
              >
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="form-input"
                  autoComplete="off"
                  required
                />
              </ValidatedVoiceField>
              {clientErrors.email && <span className="form-error">{clientErrors.email}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            {/* Area with Voice Input */}
            <div className="form-group">
              <label className="form-label">{t('area_label')} *</label>
              <ValidatedVoiceField
                value={formData.area}
                onChange={(val) => handleVoiceChange('area', val)}
                validationRules={{
                  type: 'text',
                  minLength: 2,
                  errorMessage: lang === 'ta' ? 'பகுதி குறைந்தது 2 எழுத்துக்கள் இருக்க வேண்டும்.' : 'Area must have at least 2 characters.'
                }}
              >
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder={lang === 'ta' ? 'எ.கா. மயிலாப்பூர்' : 'e.g. Mylapore'}
                  className="form-input"
                  autoComplete="off"
                  required
                />
              </ValidatedVoiceField>
              {clientErrors.area && <span className="form-error">{clientErrors.area}</span>}
            </div>

            {/* District with Voice Input */}
            <div className="form-group">
              <label className="form-label">{t('district_label')} *</label>
              <ValidatedVoiceField
                value={formData.district}
                onChange={(val) => handleVoiceChange('district', val)}
                validationRules={{
                  type: 'text',
                  minLength: 2,
                  errorMessage: lang === 'ta' ? 'மாவட்டம் குறைந்தது 2 எழுத்துக்கள் இருக்க வேண்டும்.' : 'District must have at least 2 characters.'
                }}
              >
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder={lang === 'ta' ? 'சென்னை / மதுரை' : 'Chennai / Madurai'}
                  className="form-input"
                  autoComplete="off"
                  required
                />
              </ValidatedVoiceField>
              {clientErrors.district && <span className="form-error">{clientErrors.district}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">{t('password_label')} *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={lang === 'ta' ? 'குறைந்தது 6 எழுத்துக்கள்' : 'Min 6 alphanumeric'}
                className="form-input"
                autoComplete="off"
                required
              />
              {clientErrors.password && <span className="form-error">{clientErrors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">{lang === 'ta' ? 'கடவுச்சொல் உறுதி *' : 'Confirm Password *'}</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={lang === 'ta' ? 'மீண்டும் கடவுச்சொல்' : 'Re-enter password'}
                className="form-input"
                autoComplete="off"
                required
              />
              {clientErrors.confirmPassword && <span className="form-error">{clientErrors.confirmPassword}</span>}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
          >
            <UserPlus size={18} />
            <span>{submitting ? (lang === 'ta' ? 'பதிவு செய்யப்படுகிறது...' : 'Registering Account...') : t('signup')}</span>
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
          {lang === 'ta' ? 'ஏற்கனவே உறுப்பினரா?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-700)',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {t('signin')}
          </button>
        </div>
      </div>
    </div>
  );
}
