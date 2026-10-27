import React, { useState, useEffect } from 'react';
import { Megaphone, Send, Calendar, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import AnnouncementsFeed from '../AnnouncementsFeed';

export default function BroadcastTab() {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadAnnouncements = async () => {
    try {
      const data = await api.announcements.getAll();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Please provide both title and message.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');
    try {
      await api.admin.createAnnouncement({
        title: title.trim(),
        message: message.trim()
      });
      setTitle('');
      setMessage('');
      setSuccessMsg('Announcement successfully broadcasted to all members!');
      await loadAnnouncements();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to broadcast announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Broadcast Announcements</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Publish official notices, meeting dates, scheme updates, and guidelines. Visible to all members across every group.
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Megaphone size={18} color="var(--primary-700)" />
              <span>Create New Announcement</span>
            </div>
          </div>

          {successMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#f0fdf4',
              color: '#166534',
              borderRadius: '6px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleBroadcast}>
            <div className="form-group">
              <label className="form-label">Announcement Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monthly SHG Review Meeting Scheduled"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Message Content *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter detailed announcement details, dates, or financial guidelines..."
                className="form-textarea"
                rows={5}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              <Send size={16} />
              <span>{submitting ? 'Broadcasting...' : 'Broadcast Announcement'}</span>
            </button>
          </form>
        </div>

        <div>
          <AnnouncementsFeed announcements={announcements} />
        </div>
      </div>
    </div>
  );
}
