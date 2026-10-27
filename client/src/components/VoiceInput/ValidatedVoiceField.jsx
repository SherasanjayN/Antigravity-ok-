import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, Check } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput.js';
import { useLanguage } from '../../i18n.jsx';

/**
 * ValidatedVoiceField wrapper component
 * 
 * Props:
 * - value: Current input value
 * - onChange: Callback receiving (newValue) or event
 * - validationRules: {
 *     pattern?: RegExp,
 *     minLength?: number,
 *     maxLength?: number,
 *     min?: number,
 *     max?: number,
 *     type?: 'number' | 'text' | 'email' | 'tel',
 *     cleaner?: (raw: string) => string,
 *     errorMessage?: string
 *   }
 * - renderInput: Render prop: ({ value, onChange, isListening, voiceError, ...props }) => JSX
 *   OR children if custom wrapped
 * - label?: string
 */
export default function ValidatedVoiceField({
  value,
  onChange,
  validationRules = {},
  label,
  children,
  fieldId,
  placeholder
}) {
  const { lang } = useLanguage();
  const speechLang = lang === 'ta' ? 'ta-IN' : 'en-IN';
  
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceInput({ lang: speechLang });

  const [voiceError, setVoiceError] = useState('');
  const [successNotice, setSuccessNotice] = useState(false);

  // Helper to process and validate transcript
  const processTranscript = (spokenText) => {
    if (!spokenText) return;
    setVoiceError('');

    let cleaned = spokenText.trim();

    // Clean numbers if expected
    if (validationRules.type === 'number') {
      // Extract numeric digits, handles words like 'five thousand' if browser converts or raw digits
      const digitsOnly = cleaned.replace(/[^\d.]/g, '');
      if (digitsOnly) {
        cleaned = digitsOnly;
      }
    } else if (validationRules.type === 'tel') {
      cleaned = cleaned.replace(/\D/g, '');
    } else if (validationRules.type === 'email') {
      cleaned = cleaned.toLowerCase().replace(/\s+at\s+/g, '@').replace(/\s+dot\s+/g, '.').replace(/\s+/g, '');
    }

    if (validationRules.cleaner) {
      cleaned = validationRules.cleaner(cleaned);
    }

    // Validation checks
    if (validationRules.minLength && cleaned.length < validationRules.minLength) {
      setVoiceError(
        validationRules.errorMessage ||
        (lang === 'ta'
          ? `குறைந்தது ${validationRules.minLength} எழுத்துக்கள் தேவை (கேட்கப்பட்டது: "${cleaned}")`
          : `Minimum ${validationRules.minLength} characters required (heard: "${cleaned}")`)
      );
      return;
    }

    if (validationRules.maxLength && cleaned.length > validationRules.maxLength) {
      setVoiceError(
        validationRules.errorMessage ||
        (lang === 'ta'
          ? `அதிகபட்சம் ${validationRules.maxLength} எழுத்துக்கள் மட்டுமே அனுமதிக்கப்படும்.`
          : `Maximum ${validationRules.maxLength} characters allowed.`)
      );
      return;
    }

    if (validationRules.type === 'number') {
      const num = Number(cleaned);
      if (isNaN(num)) {
        setVoiceError(
          validationRules.errorMessage ||
          (lang === 'ta' ? 'சரியான எண்ணை உச்சரிக்கவும்.' : 'Please speak a valid number.')
        );
        return;
      }
      if (validationRules.min !== undefined && num < validationRules.min) {
        setVoiceError(
          validationRules.errorMessage ||
          (lang === 'ta' ? `குறைந்தபட்ச தொகை ₹${validationRules.min}` : `Minimum value is ₹${validationRules.min}`)
        );
        return;
      }
      if (validationRules.max !== undefined && num > validationRules.max) {
        setVoiceError(
          validationRules.errorMessage ||
          (lang === 'ta' ? `அதிகபட்ச தொகை ₹${validationRules.max}` : `Maximum value is ₹${validationRules.max}`)
        );
        return;
      }
    }

    if (validationRules.pattern && !validationRules.pattern.test(cleaned)) {
      setVoiceError(
        validationRules.errorMessage ||
        (lang === 'ta' ? `செல்லுபடியாகாத வடிவம்: "${cleaned}"` : `Invalid input format: "${cleaned}"`)
      );
      return;
    }

    // Success: Commit the validated text!
    if (typeof onChange === 'function') {
      onChange(cleaned);
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 2000);
      resetTranscript();
    }
  };

  useEffect(() => {
    if (transcript) {
      processTranscript(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (speechError) {
      setVoiceError(
        lang === 'ta'
          ? `குரல் அறிதல் பிழை: ${speechError}`
          : `Speech recognition error: ${speechError}`
      );
    }
  }, [speechError, lang]);

  const toggleMic = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setVoiceError('');
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="voice-field-wrapper" style={{ position: 'relative', width: '100%' }}>
      {/* Input container */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {children}

        {/* Microphone Action Icon */}
        <button
          type="button"
          onClick={toggleMic}
          disabled={!isSupported}
          title={
            !isSupported
              ? (lang === 'ta' ? 'உங்கள் உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை.' : 'Web Speech not supported in this browser.')
              : isListening
              ? (lang === 'ta' ? 'பேசவும்... கிளிக் செய்து நிறுத்தவும்' : 'Listening... Click to stop')
              : (lang === 'ta' ? 'குரல் உள்ளீட்டிற்கு மைக்ரோஃபோனை அழுத்தவும்' : 'Click microphone to speak')
          }
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: isListening ? '#fee2e2' : '#f1f5f9',
            border: isListening ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isSupported ? 'pointer' : 'not-allowed',
            color: isListening ? '#dc2626' : '#475569',
            padding: 0,
            zIndex: 5,
            transition: 'all 0.2s ease',
            boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none'
          }}
        >
          {isListening ? (
            <MicOff size={16} className="pulse-animation" />
          ) : (
            <Mic size={16} />
          )}
        </button>
      </div>

      {/* Listening or Feedback indicators */}
      {isListening && (
        <div style={{
          fontSize: '0.75rem',
          color: '#059669',
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600
        }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
          }} />
          <span>{lang === 'ta' ? 'பேசுவதைக் கேட்கிறது...' : 'Listening... Speak now'}</span>
          {interimTranscript && (
            <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '4px' }}>
              "{interimTranscript}"
            </span>
          )}
        </div>
      )}

      {/* Validation / error message */}
      {voiceError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: '#b91c1c',
          fontSize: '0.75rem',
          marginTop: '4px',
          backgroundColor: '#fef2f2',
          padding: '2px 8px',
          borderRadius: '4px',
          border: '1px solid #fecaca'
        }}>
          <AlertCircle size={13} />
          <span>{voiceError}</span>
        </div>
      )}

      {/* Success notice */}
      {successNotice && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: '#047857',
          fontSize: '0.75rem',
          marginTop: '4px',
          backgroundColor: '#ecfdf5',
          padding: '2px 8px',
          borderRadius: '4px',
          border: '1px solid #a7f3d0'
        }}>
          <Check size={13} />
          <span>{lang === 'ta' ? 'குரல் உள்ளீடு பதிவு செய்யப்பட்டது!' : 'Voice input committed!'}</span>
        </div>
      )}
    </div>
  );
}
