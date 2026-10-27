import React, { useState, useEffect } from 'react';
import { Megaphone, Send, Calendar, CheckCircle2, Edit2, X, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import AnnouncementsFeed from '../AnnouncementsFeed';

export default function BroadcastTab() {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
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

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setMessage(item.message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setMessage('');
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this official announcement?')) {
      return;
    }
    try {
      await api.admin.deleteAnnouncement(id);
      setSuccessMsg('Announcement successfully deleted.');
      if (editingId === id) {
        handleCancelEdit();
      }
      await loadAnnouncements();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete announcement.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Please provide both title and message.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');
    try {
      if (editingId) {
        await api.admin.updateAnnouncement(editingId, {
          title: title.trim(),
          message: message.trim()
        });
        setSuccessMsg('Announcement successfully updated!');
        setEditingId(null);
      } else {
        await api.admin.createAnnouncement({
          title: title.trim(),
          message: message.trim()
        });
        setSuccessMsg('Announcement successfully broadcasted to all members!');
      }
      setTitle('');
      setMessage('');
      await loadAnnouncements();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to save announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Broadcast Announcements</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Publish, edit, and manage official notices, meeting dates, scheme updates, and guidelines.
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Megaphone size={18} color="var(--primary-700)" />
              <span>{editingId ? 'Edit Announcement' : 'Create New Announcement'}</span>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff', color: '#64748b', fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                <X size={13} /> Cancel Edit
              </button>
            )}
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

          <form onSubmit={handleSubmit}>
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

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <Send size={16} />
                <span>{submitting ? 'Saving...' : editingId ? 'Update Announcement' : 'Broadcast Announcement'}</span>
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div>
          <AnnouncementsFeed
            announcements={announcements}
            onEdit={handleStartEdit}
            onDelete={handleDeleteAnnouncement}
          />
        </div>
      </div>
    </div>
  );
}
