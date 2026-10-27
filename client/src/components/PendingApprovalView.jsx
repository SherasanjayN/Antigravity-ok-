import React, { useState } from 'react';
import { Clock, ShieldAlert, CheckCircle2, RefreshCw, LogOut, Phone, Mail, MapPin } from 'lucide-react';
import { api } from '../services/api';

export default function PendingApprovalView({ user, onLogout, onRefreshUser }) {
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState('');

  const checkStatus = async () => {
    setChecking(true);
    setMsg('');
    try {
      if (onRefreshUser) {
        await onRefreshUser();
      }
      setMsg('Status checked. Still pending Super Admin allocation.');
    } catch (err) {
      setMsg('Could not refresh status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="card" style={{ maxWidth: '580px', width: '100%', textAlign: 'center', padding: '2.5rem 2rem' }}>
        <div style={{
          width: '72px',
          height: '72px',
          margin: '0 auto 1.5rem auto',
          borderRadius: '50%',
          backgroundColor: '#fef3c7',
          color: '#d97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)'
        }}>
          <Clock size={38} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: '#1e293b' }}>
          Registration Pending Super Admin Approval
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: '1.6' }}>
          Welcome, <strong>{user.name}</strong>! Your account registration has been submitted and is currently being reviewed by the Super Admin for area verification and group allocation.
        </p>

        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          textAlign: 'left',
          marginBottom: '1.75rem'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Registered Details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Mail size={16} color="var(--primary-700)" />
              <span style={{ color: 'var(--text-muted)' }}>Email:</span>
              <strong>{user.email}</strong>
            </div>
            {user.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Phone size={16} color="var(--primary-700)" />
                <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                <strong>{user.phone}</strong>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <MapPin size={16} color="var(--primary-700)" />
              <span style={{ color: 'var(--text-muted)' }}>Location:</span>
              <strong>{user.area}, {user.district}</strong>
            </div>
          </div>
        </div>

        {msg && (
          <div style={{
            padding: '0.65rem 1rem',
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={checkStatus}
            disabled={checking}
            className="btn btn-primary"
            style={{ minWidth: '150px' }}
          >
            <RefreshCw size={16} className={checking ? 'spin' : ''} />
            <span>{checking ? 'Checking...' : 'Check Status'}</span>
          </button>

          <button
            onClick={onLogout}
            className="btn btn-secondary"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
