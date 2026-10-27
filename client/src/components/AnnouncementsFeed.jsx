import React from 'react';
import { Megaphone, Calendar, ShieldAlert } from 'lucide-react';

export default function AnnouncementsFeed({ announcements = [] }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <Megaphone size={18} color="var(--primary-700)" />
          <span>Official Announcements</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Broadcast by Super Admin
        </span>
      </div>

      {announcements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No announcements at this time.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {announcements.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: '#f8fafc',
                borderLeft: '4px solid var(--primary-600)',
                borderRadius: '0 8px 8px 0',
                borderTop: '1px solid var(--border-color)',
                borderRight: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  {item.title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Calendar size={13} />
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>
                {item.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
