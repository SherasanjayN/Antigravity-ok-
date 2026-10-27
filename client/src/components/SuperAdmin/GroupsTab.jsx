import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, ShieldCheck, MessageSquare, MapPin } from 'lucide-react';
import { api } from '../../services/api';
import GroupChat from '../GroupChat';

export default function GroupsTab({ currentUser }) {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Group Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupArea, setNewGroupArea] = useState('');
  const [newGroupDistrict, setNewGroupDistrict] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Assign Admin Modal
  const [assignAdminGroup, setAssignAdminGroup] = useState(null);
  const [selectedAdminId, setSelectedAdminId] = useState('');

  // Active Chat Modal
  const [activeChatGroup, setActiveChatGroup] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsData, usersData] = await Promise.all([
        api.admin.getGroups(),
        api.admin.getUsers()
      ]);
      setGroups(groupsData);
      setUsers(usersData);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupArea.trim() || !newGroupDistrict.trim()) {
      alert('Please fill out all group details.');
      return;
    }

    setSubmitting(true);
    try {
      await api.admin.createGroup({
        group_name: newGroupName.trim(),
        area: newGroupArea.trim(),
        district: newGroupDistrict.trim()
      });
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupArea('');
      setNewGroupDistrict('');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to create group.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignAdmin = async () => {
    if (!assignAdminGroup) return;
    setSubmitting(true);
    try {
      await api.admin.assignGroupAdmin(assignAdminGroup.id, {
        group_admin_id: selectedAdminId || null
      });
      setAssignAdminGroup(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to assign group admin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Magalir Kuzhu Groups</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage Self-Help Groups, designate group admins, and inspect dedicated group communication channels.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Create New Group</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading groups...
        </div>
      ) : groups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Building2 size={42} color="var(--primary-600)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>No groups created yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Create your first Self-Help Group to start organizing members.
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
            <Plus size={14} /> Create Group
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {groups.map((group) => {
            const groupMembers = users.filter(u => u.group_id === group.id && u.status === 'APPROVED');
            return (
              <div key={group.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                        {group.group_name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        <MapPin size={13} />
                        <span>{group.area}, {group.district}</span>
                      </div>
                    </div>
                    <span className="badge" style={{ backgroundColor: '#f0fdfa', color: 'var(--primary-800)', border: '1px solid var(--primary-200)' }}>
                      <Users size={12} /> {group.member_count} Members
                    </span>
                  </div>

                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    margin: '1rem 0',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Designated Group Admin
                    </div>
                    {group.group_admin_name ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#0f172a' }}>
                        <ShieldCheck size={16} color="#0f766e" />
                        <span>{group.group_admin_name}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>({group.group_admin_email})</span>
                      </div>
                    ) : (
                      <div style={{ color: '#d97706', fontStyle: 'italic', fontSize: '0.8rem' }}>
                        No Group Admin assigned. Click below to designate.
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => {
                      setAssignAdminGroup(group);
                      setSelectedAdminId(group.group_admin_id || '');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <ShieldCheck size={14} />
                    <span>{group.group_admin_id ? 'Change Admin' : 'Assign Admin'}</span>
                  </button>

                  <button
                    onClick={() => setActiveChatGroup(group)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <MessageSquare size={14} />
                    <span>Group Chat</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleCreateGroup}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Establish New Magalir Kuzhu Group</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Group Name *</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Bharathi Magalir Kuzhu"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Area / Locality *</label>
                  <input
                    type="text"
                    value={newGroupArea}
                    onChange={(e) => setNewGroupArea(e.target.value)}
                    placeholder="e.g. Mylapore"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">District *</label>
                  <input
                    type="text"
                    value={newGroupDistrict}
                    onChange={(e) => setNewGroupDistrict(e.target.value)}
                    placeholder="e.g. Chennai"
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: '#f0fdfa', padding: '0.75rem', borderRadius: '6px' }}>
                  ℹ Creating a group will automatically set up its dedicated chatroom and allow pending members in this area to be allocated.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN ADMIN MODAL */}
      {assignAdminGroup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Designate Group Admin for {assignAdminGroup.group_name}
              </h3>
              <button
                onClick={() => setAssignAdminGroup(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Select an approved member from this group to serve as the Group Admin. Exactly one Group Admin is designated per group.
              </p>

              <div className="form-group">
                <label className="form-label">Select Group Member</label>
                {users.filter(u => u.group_id === assignAdminGroup.id && u.status === 'APPROVED').length === 0 ? (
                  <div style={{ color: '#d97706', fontSize: '0.85rem' }}>
                    No approved members currently in this group. Allocate members first from the Pending Registrations tab.
                  </div>
                ) : (
                  <select
                    value={selectedAdminId}
                    onChange={(e) => setSelectedAdminId(e.target.value)}
                    className="form-select"
                  >
                    <option value="">-- None / Remove Admin --</option>
                    {users
                      .filter(u => u.group_id === assignAdminGroup.id && u.status === 'APPROVED')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email}) - {u.role}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setAssignAdminGroup(null)}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignAdmin}
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Updating...' : 'Save Group Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT MODAL (Visible to Super Admin) */}
      {activeChatGroup && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Group Chat: {activeChatGroup.group_name}
              </h3>
              <button
                onClick={() => setActiveChatGroup(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1rem' }}>
              <GroupChat
                groupId={activeChatGroup.id}
                groupName={activeChatGroup.group_name}
                currentUser={currentUser}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
