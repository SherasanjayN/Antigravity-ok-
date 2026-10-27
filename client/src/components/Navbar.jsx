import React, { useState, useEffect } from 'react';
import { Users, LogOut, Building2, Bell, Check, Globe, AlertTriangle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import SosModal from './SOS/SosModal';
import { useLanguage } from '../i18n';
import { api } from '../services/api';

export default function Navbar({ user, onLogout }) {
  const { t, lang, toggleLanguage } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.notifications.getAll();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // 20s polling
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.85rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #047857 0%, #0d9488 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 2px 4px rgba(4, 120, 87, 0.3)'
        }}>
          <Users size={22} />
        </div>
        <div>
          <div style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            color: '#065f46',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-heading)'
          }}>
            {t('app_tamil_title')} • Magalir Kuzhu
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t('portal_sub')}
          </div>
        </div>
      </div>

      {/* Right Tools & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Language Switcher */}
        <button
          type="button"
          onClick={toggleLanguage}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            borderRadius: '20px',
            border: '1.5px solid #a7f3d0',
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title="Switch Language / மொழியை மாற்றுக"
        >
          <Globe size={15} />
          <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
        </button>

        {user && (
          <>
            {/* SOS Emergency Helpline Button */}
            <button
              type="button"
              onClick={() => setShowSosModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '20px',
                border: '1.5px solid #fecaca',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(220, 38, 38, 0.15)'
              }}
              title="Women SOS & Emergency Help | மகளிர் அவசர உதவி"
            >
              <AlertTriangle size={15} color="#dc2626" />
              <span>SOS {lang === 'ta' ? 'அவசரம்' : 'Emergency'}</span>
            </button>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                style={{
                  position: 'relative',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: unreadCount > 0 ? '#047857' : 'var(--text-muted)'
                }}
                title={t('notifications')}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifMenu && (
                <div style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '340px',
                  maxHeight: '400px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                  border: '1px solid var(--border-color)',
                  zIndex: 100,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8fafc'
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                      {t('notifications')} ({unreadCount})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        style={{
                          fontSize: '0.75rem',
                          color: '#047857',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {t('mark_all_read')}
                      </button>
                    )}
                  </div>

                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {t('no_notifications')}
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkOneRead(notif.id)}
                          style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid #f8fafc',
                            backgroundColor: notif.is_read ? '#ffffff' : '#f0fdf4',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong style={{ fontSize: '0.84rem', color: notif.is_read ? '#334155' : '#047857' }}>
                              {notif.title}
                            </strong>
                            {!notif.is_read && (
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                            )}
                          </div>
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                            {notif.message}
                          </p>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>{user.name}</span>
                <StatusBadge status={user.role} type="role" />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                {user.group?.group_name ? (
                  <>
                    <Building2 size={12} />
                    <span>{user.group.group_name}</span>
                  </>
                ) : (
                  <span>{user.area}, {user.district}</span>
                )}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title={t('logout')}
            >
              <LogOut size={14} />
              <span>{t('logout')}</span>
            </button>
          </>
        )}
      </div>

      {/* SOS Emergency Modal */}
      <SosModal
        isOpen={showSosModal}
        onClose={() => setShowSosModal(false)}
        currentUser={user}
      />
    </header>
  );
}
