import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ShieldCheck, UserCheck, ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import ValidatedVoiceField from './VoiceInput/ValidatedVoiceField';
import { useLanguage } from '../i18n';

export default function GroupChat({ groupId, groupName, group, currentUser }) {
  const { lang } = useLanguage();
  const effectiveGroupId = groupId || group?.id;
  const effectiveGroupName = groupName || group?.group_name;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const fetchMessages = async (silent = false) => {
    if (!effectiveGroupId) return;
    try {
      if (!silent) setLoading(true);
      const data = await api.chat.getMessages(effectiveGroupId);
      setMessages(data);
      setError('');
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Failed to load group messages.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [effectiveGroupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sending || !effectiveGroupId) return;

    setSending(true);
    try {
      const newMsg = await api.chat.sendMessage(effectiveGroupId, inputText.trim());
      setMessages(prev => [...prev, newMsg]);
      setInputText('');
    } catch (err) {
      setError(err.message || 'Failed to post message.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm(lang === 'ta' ? 'இந்த செய்தியை நிச்சயமாக நீக்க வேண்டுமா?' : 'Are you sure you want to delete this message?')) {
      return;
    }
    setDeletingId(messageId);
    try {
      await api.chat.deleteMessage(effectiveGroupId, messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      alert(err.message || 'Failed to delete message.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'SUPER_ADMIN') return <ShieldAlert size={12} />;
    if (role === 'GROUP_ADMIN') return <ShieldCheck size={12} />;
    return <UserCheck size={12} />;
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <MessageSquare size={20} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
              {groupName || 'Group Discussion Room'}
            </div>
            <div style={{ fontSize: '0.725rem', opacity: 0.9 }}>
              Dedicated Real-time Discussion • Live Updates Active
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchMessages(false)}
          className="btn btn-secondary btn-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff', borderColor: 'transparent' }}
          title="Refresh Messages"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="chat-messages" style={{ height: '420px' }}>
        {loading && messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading group discussion...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <MessageSquare size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
            <div style={{ fontWeight: 600 }}>No messages in this group yet.</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Say hello or post a question to start the conversation with your group members!
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === currentUser?.id;
            const canDelete = currentUser?.role === 'SUPER_ADMIN' ||
                              (currentUser?.role === 'GROUP_ADMIN' && currentUser?.group_id === effectiveGroupId) ||
                              isMine;

            return (
              <div
                key={m.id}
                className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}
                style={{ position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="chat-sender">
                    {getRoleIcon(m.sender_role)}
                    <span>{m.sender_name}</span>
                    {m.sender_role === 'GROUP_ADMIN' && <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>(Group Admin)</span>}
                    {m.sender_role === 'SUPER_ADMIN' && <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>(Super Admin)</span>}
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(m.id)}
                      disabled={deletingId === m.id}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isMine ? '#fecaca' : '#94a3b8',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: '8px',
                        transition: 'color 0.2s'
                      }}
                      title={lang === 'ta' ? 'செய்தியை நீக்கு' : 'Delete message'}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '2px' }}>{m.text}</div>
                <div className="chat-timestamp">{formatTime(m.timestamp)}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div style={{ padding: '0.5rem 1rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSend} className="chat-input-bar">
        <div style={{ flex: 1, position: 'relative' }}>
          <ValidatedVoiceField
            value={inputText}
            onChange={(val) => setInputText(prev => prev ? `${prev} ${val}` : val)}
            validationRules={{
              type: 'text'
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={lang === 'ta' ? `${effectiveGroupName || 'குழு'}-க்கு செய்தி அனுப்பவும்...` : `Message ${effectiveGroupName || 'group'}...`}
              className="form-input"
              style={{ width: '100%', padding: '0.6rem 2.6rem 0.6rem 0.9rem' }}
              disabled={sending}
            />
          </ValidatedVoiceField>
        </div>
        <button
          type="submit"
          disabled={sending || !inputText.trim()}
          className="btn btn-primary"
          style={{ padding: '0.6rem 1rem', height: '40px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Send size={16} />
          <span>{sending ? 'Sending...' : 'Send'}</span>
        </button>
      </form>
    </div>
  );
}
