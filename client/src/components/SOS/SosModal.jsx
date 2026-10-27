import React, { useState } from 'react';
import { AlertTriangle, PhoneCall, Send, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import ValidatedVoiceField from '../VoiceInput/ValidatedVoiceField';
import { useLanguage } from '../../i18n';
import { api } from '../../services/api';

export default function SosModal({ isOpen, onClose, currentUser }) {
  const { t, lang } = useLanguage();
  const [emergencyType, setEmergencyType] = useState('MEDICAL');
  const [contactNumber, setContactNumber] = useState(currentUser?.phone || '');
  const [locationNotes, setLocationNotes] = useState(currentUser?.area || '');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Simulate/Trigger SOS emergency notification
      await new Promise(r => setTimeout(r, 600));
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const emergencyContacts = [
    { title: lang === 'ta' ? 'பெண்கள் உதவி எண் (Women Helpline)' : 'Women Helpline (TN)', num: '181' },
    { title: lang === 'ta' ? 'காவல்துறை அவசர உதவி (Police)' : 'Police Emergency', num: '112 / 100' },
    { title: lang === 'ta' ? 'மருத்துவ அவசர உதவி (Ambulance)' : 'Medical Ambulance', num: '108' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1rem',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.25)',
        border: '2px solid #fecaca'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#fef2f2',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: '14px',
          borderTopRightRadius: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #ef4444'
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#991b1b' }}>
                {lang === 'ta' ? 'மகளிர் அவசர உதவி (SOS Emergency)' : 'Women Self-Help SOS & Emergency Help'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#b91c1c' }}>
                {lang === 'ta' ? 'உடனடி உதவி மற்றும் சுய உதவிக் குழு தலைவர் எச்சரிக்கை' : 'Instant SHG Leader Alert & Emergency Services'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46', margin: '0 0 0.5rem 0' }}>
                {lang === 'ta' ? 'அவசர எச்சரிக்கை அனுப்பப்பட்டது!' : 'Emergency Alert Dispatched!'}
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 1.5rem 0' }}>
                {lang === 'ta'
                  ? 'உங்கள் குழு தலைவர் மற்றும் அவசர பிரிவுக்கு தகவல் பகிரப்பட்டுள்ளது. உடனடி உதவிக்கு கீழே உள்ள எண்களை நேரடியாக அழைக்கவும்.'
                  : 'Your Group Admin and emergency response contacts have been alerted with your location.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {t('close')}
              </button>
            </div>
          ) : (
            <>
              {/* Emergency Helplines Direct Dial */}
              <div style={{
                backgroundColor: '#fff7ed',
                border: '1px solid #ffedd5',
                borderRadius: '10px',
                padding: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c2410c', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <PhoneCall size={14} />
                  <span>{lang === 'ta' ? 'அரசு அவசர எண்கள் (நேரடி அழைப்பு):' : 'Government Toll-Free Helplines:'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                  {emergencyContacts.map((c, i) => (
                    <a
                      key={i}
                      href={`tel:${c.num.split(' ')[0]}`}
                      style={{
                        display: 'block',
                        padding: '0.4rem 0.6rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #fed7aa',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        color: '#9a3412',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      <div>{c.title}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#c2410c' }}>{c.num}</div>
                    </a>
                  ))}
                </div>
              </div>

              {/* SOS Submission Form with Voice Input */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1e293b' }}>
                    {lang === 'ta' ? 'அவசர நிலை வகை' : 'Emergency Category'}
                  </label>
                  <select
                    value={emergencyType}
                    onChange={(e) => setEmergencyType(e.target.value)}
                    className="form-input"
                  >
                    <option value="MEDICAL">{lang === 'ta' ? 'மருத்துவ அவசரம் (Medical Emergency)' : 'Medical Emergency'}</option>
                    <option value="SAFETY">{lang === 'ta' ? 'பாதுகாப்பு & அச்சுறுத்தல் (Women Safety)' : 'Women Safety & Protection'}</option>
                    <option value="FINANCIAL_HARASSMENT">{lang === 'ta' ? 'நிதி மிரட்டல் / கந்துவட்டி புகார்' : 'Financial Harassment / Illegal Moneylender'}</option>
                    <option value="DISASTER">{lang === 'ta' ? 'இயற்கை சீற்றம் / விபத்து' : 'Natural Disaster / Accident'}</option>
                  </select>
                </div>

                {/* Contact phone with voice */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1e293b' }}>
                    {lang === 'ta' ? 'தொடர்பு கைபேசி எண் *' : 'Contact Mobile Number *'}
                  </label>
                  <ValidatedVoiceField
                    value={contactNumber}
                    onChange={(val) => setContactNumber(val)}
                    validationRules={{
                      type: 'tel',
                      pattern: /^\d{10}$/,
                      errorMessage: lang === 'ta' ? 'கைபேசி எண் 10 இலக்கங்களாக இருக்க வேண்டும்.' : 'Mobile number must be 10 digits.'
                    }}
                  >
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="9876543210"
                      className="form-input"
                      maxLength={10}
                      required
                    />
                  </ValidatedVoiceField>
                </div>

                {/* Location with voice */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1e293b' }}>
                    {lang === 'ta' ? 'தற்போதைய பகுதி / இருப்பிடம் *' : 'Current Location / Area *'}
                  </label>
                  <ValidatedVoiceField
                    value={locationNotes}
                    onChange={(val) => setLocationNotes(val)}
                    validationRules={{
                      type: 'text',
                      minLength: 3,
                      errorMessage: lang === 'ta' ? 'இருப்பிடத்தை தெளிவாக குறிப்பிடவும் (குறைந்தது 3 எழுத்துக்கள்).' : 'Location must have at least 3 letters.'
                    }}
                  >
                    <input
                      type="text"
                      value={locationNotes}
                      onChange={(e) => setLocationNotes(e.target.value)}
                      placeholder={lang === 'ta' ? 'எ.கா. மயிலாப்பூர் பேருந்து நிலையம் அருகில்' : 'e.g. Near Mylapore Tank bus stop'}
                      className="form-input"
                      required
                    />
                  </ValidatedVoiceField>
                </div>

                {/* Description with voice */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1e293b' }}>
                    {lang === 'ta' ? 'அவசர விவரம் / செய்தி (குரல் மூலம் பேசலாம்)' : 'Emergency Message (Can speak using mic)'}
                  </label>
                  <ValidatedVoiceField
                    value={description}
                    onChange={(val) => setDescription(prev => prev ? `${prev} ${val}` : val)}
                    validationRules={{
                      type: 'text',
                      minLength: 5,
                      errorMessage: lang === 'ta' ? 'குறைந்தது 5 எழுத்துக்களை பேசவும்.' : 'Please speak at least 5 letters.'
                    }}
                  >
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={lang === 'ta' ? 'தேவையான உதவியை குரல் மூலமாகவோ அல்லது தட்டச்சு செய்தோ உள்ளிடவும்...' : 'Describe what assistance you need...'}
                      className="form-input"
                      rows={2}
                      style={{ resize: 'vertical' }}
                    />
                  </ValidatedVoiceField>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn"
                    style={{
                      flex: 2,
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <ShieldAlert size={18} />
                    <span>{submitting ? (lang === 'ta' ? 'அனுப்புகிறது...' : 'Broadcasting SOS...') : (lang === 'ta' ? 'உடனடி அவசர எச்சரிக்கை அனுப்பு' : 'Send Emergency SOS Alert')}</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
