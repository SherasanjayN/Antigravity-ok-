import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Building2,
  MapPin,
  ShieldCheck,
  Send,
  RefreshCw,
  Search,
  Users
} from 'lucide-react';
import { api } from '../../services/api';
import GroupChat from '../GroupChat';
import { useLanguage } from '../../i18n';

export default function AreaWiseGroupChatTab({ currentUser }) {
  const { lang } = useLanguage();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('ALL');

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getGroups();
      setGroups(data);
      if (data.length > 0 && !selectedGroup) {
        setSelectedGroup(data[0]);
      }
    } catch (err) {
      console.error('Failed to load groups for Area-wise chat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const districts = ['ALL', ...new Set(groups.map(g => g.district).filter(Boolean))];

  const filteredGroups = groups.filter(g => {
    const matchesSearch =
      (g.group_name && g.group_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.area && g.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.district && g.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.group_admin_name && g.group_admin_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDistrict = filterDistrict === 'ALL' || g.district === filterDistrict;
    return matchesSearch && matchesDistrict;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <MessageSquare size={24} color="#047857" />
          <span>{lang === 'ta' ? 'பகுதி வாரியான குழு தலைவர் உரையாடல்' : 'Area-wise Group Admin Communication Hub'}</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {lang === 'ta'
            ? 'ஒவ்வொரு பகுதியிலும் உள்ள குழு தலைவர்களுடன் நேரடியாக நிகழ்நேரத்தில் அரட்டை அடிக்கலாம் மற்றும் செய்திகளைப் பெறலாம்.'
            : 'Direct real-time area-wise message inbox and communications with designated Group Admins.'}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gap: '1.25rem',
        minHeight: '620px',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: Area-wise Group Admins Directory */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {lang === 'ta' ? 'பகுதிகள் & குழு தலைவர்கள்' : 'Areas & Group Admins'} ({filteredGroups.length})
            </span>
            <button
              onClick={loadGroups}
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
              title="Refresh groups"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder={lang === 'ta' ? 'பகுதி / குழு பெயர் தேடுக...' : 'Search area, admin, group...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.65rem 0.5rem 2rem',
                fontSize: '0.82rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)'
              }}
            />
          </div>

          {/* District Filter Pills */}
          {districts.length > 2 && (
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '4px' }}>
              {districts.map(d => (
                <button
                  key={d}
                  onClick={() => setFilterDistrict(d)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    border: filterDistrict === d ? '1px solid #047857' : '1px solid #cbd5e1',
                    backgroundColor: filterDistrict === d ? '#ecfdf5' : '#ffffff',
                    color: filterDistrict === d ? '#047857' : '#475569',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {/* List of Group Admins grouped by Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '520px' }}>
            {filteredGroups.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No area matches found.
              </div>
            ) : (
              filteredGroups.map(grp => {
                const isSelected = selectedGroup?.id === grp.id;
                return (
                  <div
                    key={grp.id}
                    onClick={() => setSelectedGroup(grp)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #047857' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.88rem', color: isSelected ? '#047857' : '#0f172a' }}>
                        {grp.group_name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#0284c7', fontWeight: 600, marginBottom: '0.35rem' }}>
                      <MapPin size={12} />
                      <span>{grp.area}, {grp.district}</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.75rem',
                      backgroundColor: isSelected ? '#ffffff' : '#f8fafc',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <ShieldCheck size={13} color="#059669" />
                      <span style={{ fontWeight: 700, color: '#334155' }}>Admin:</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{grp.group_admin_name || 'Designated Leader'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Chat with Designated Group Admin */}
        <div>
          {selectedGroup ? (
            <div>
              {/* Active Area Banner */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      {selectedGroup.group_name}
                    </span>
                    <span style={{
                      backgroundColor: '#ecfdf5',
                      color: '#047857',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid #a7f3d0'
                    }}>
                      📍 {selectedGroup.area}, {selectedGroup.district}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Group Admin: <strong>{selectedGroup.group_admin_name || 'Designated Leader'}</strong> ({selectedGroup.group_admin_email || 'Verified Account'})
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#047857', fontWeight: 700 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                  <span>Real-Time Connected</span>
                </div>
              </div>

              {/* Live Group Chat Component */}
              <GroupChat
                key={selectedGroup.id}
                groupId={selectedGroup.id}
                groupName={selectedGroup.group_name}
                currentUser={currentUser}
              />
            </div>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={36} style={{ margin: '0 auto 0.75rem auto', color: '#cbd5e1' }} />
              <h3>Select an Area-wise Group Admin to start chat</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
