import React, { useState, useEffect } from 'react';
import { UserCheck, XCircle, Building2, MapPin, Phone, Mail, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function PendingUsersTab({ onActionComplete }) {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Approval Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [allocationMode, setAllocationMode] = useState('existing'); // 'existing' | 'new'
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [makeGroupAdmin, setMakeGroupAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reject Modal State
  const [rejectUser, setRejectUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, groupsData] = await Promise.all([
        api.admin.getPendingUsers(),
        api.admin.getGroups()
      ]);
      setPendingUsers(usersData);
      setAllGroups(groupsData);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load pending registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openApproveModal = (user) => {
    setSelectedUser(user);
    setNewGroupName(`${user.area} Magalir Kuzhu`);
    setMakeGroupAdmin(false);
    // Pre-select first suggested group if available
    if (user.suggestedGroups && user.suggestedGroups.length > 0) {
      setSelectedGroupId(user.suggestedGroups[0].id);
      setAllocationMode('existing');
    } else if (allGroups.length > 0) {
      setSelectedGroupId(allGroups[0].id);
      setAllocationMode('existing');
    } else {
      setAllocationMode('new');
    }
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const payload = {
        make_group_admin: makeGroupAdmin
      };
      if (allocationMode === 'existing') {
        payload.group_id = selectedGroupId;
      } else {
        if (!newGroupName.trim()) {
          alert('Please enter a group name for the new group.');
          setSubmitting(false);
          return;
        }
        payload.new_group_name = newGroupName.trim();
      }

      await api.admin.approveUser(selectedUser.id, payload);
      setSelectedUser(null);
      await loadData();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      alert(err.message || 'Failed to approve user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectUser) return;
    setSubmitting(true);
    try {
      await api.admin.rejectUser(rejectUser.id, rejectReason);
      setRejectUser(null);
      setRejectReason('');
      await loadData();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      alert(err.message || 'Failed to decline registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Pending Member Registrations</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Verify applicant details, inspect location match auto-suggestions, and allocate members to groups.
          </p>
        </div>
        <span className="badge badge-pending" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
          {pendingUsers.length} Pending Approval
        </span>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading pending registrations...
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <UserCheck size={48} color="var(--primary-600)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Pending Registrations</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            All incoming member registrations have been reviewed and allocated.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {pendingUsers.map((user) => (
            <div key={user.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{user.name}</h3>
                    <span className="badge badge-pending">PENDING</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={15} color="var(--primary-700)" />
                      <span>{user.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={15} color="var(--primary-700)" />
                      <span>{user.phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={15} color="var(--primary-700)" />
                      <span><strong>Area:</strong> {user.area} | <strong>District:</strong> {user.district}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => openApproveModal(user)}
                    className="btn btn-primary btn-sm"
                  >
                    <UserCheck size={15} />
                    <span>Approve & Allocate</span>
                  </button>
                  <button
                    onClick={() => setRejectUser(user)}
                    className="btn btn-danger btn-sm"
                  >
                    <XCircle size={15} />
                    <span>Decline</span>
                  </button>
                </div>
              </div>

              {/* Area & District Matching Groups Auto-Suggestion */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.825rem',
                color: 'var(--text-muted)'
              }}>
                <Sparkles size={15} color="#d97706" />
                <span><strong>Auto-suggested groups in area:</strong></span>
                {user.suggestedGroups && user.suggestedGroups.length > 0 ? (
                  user.suggestedGroups.map(g => (
                    <span
                      key={g.id}
                      style={{
                        backgroundColor: '#f0fdfa',
                        color: 'var(--primary-800)',
                        border: '1px solid var(--primary-200)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}
                    >
                      {g.group_name} ({g.area})
                    </span>
                  ))
                ) : (
                  <span style={{ fontStyle: 'italic' }}>
                    No existing group found in {user.area}, {user.district}. Admin can create a new group.
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* APPROVAL MODAL */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Approve & Allocate Member: {selectedUser.name}
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem'
              }}>
                <div><strong>Applicant:</strong> {selectedUser.name} ({selectedUser.email})</div>
                <div><strong>Location:</strong> {selectedUser.area}, {selectedUser.district}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Allocation Strategy</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="radio"
                      name="allocMode"
                      checked={allocationMode === 'existing'}
                      onChange={() => setAllocationMode('existing')}
                    />
                    <span>Assign to Existing Group</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="radio"
                      name="allocMode"
                      checked={allocationMode === 'new'}
                      onChange={() => setAllocationMode('new')}
                    />
                    <span>Create New Group</span>
                  </label>
                </div>
              </div>

              {allocationMode === 'existing' ? (
                <div className="form-group">
                  <label className="form-label">Select Group</label>
                  {allGroups.length === 0 ? (
                    <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>
                      No groups exist yet. Please select "Create New Group".
                    </div>
                  ) : (
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="form-select"
                    >
                      {allGroups.map((g) => {
                        const isMatch = g.area.toLowerCase() === selectedUser.area.toLowerCase();
                        return (
                          <option key={g.id} value={g.id}>
                            {g.group_name} — {g.area}, {g.district} {isMatch ? '★ (Matched Location)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">New Group Name</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Annai Teresa Magalir Kuzhu"
                    className="form-input"
                  />
                  <div className="form-hint">
                    Group will be established in <strong>{selectedUser.area}, {selectedUser.district}</strong>.
                  </div>
                </div>
              )}

              <div style={{
                marginTop: '1.25rem',
                padding: '0.85rem 1rem',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe'
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={makeGroupAdmin}
                    onChange={(e) => setMakeGroupAdmin(e.target.checked)}
                    style={{ marginTop: '0.2rem' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e40af' }}>
                      Designate as Group Admin
                    </div>
                    <div style={{ fontSize: '0.775rem', color: '#3b82f6', marginTop: '0.15rem' }}>
                      Each group has exactly one Group Admin responsible for preliminary loan review and group coordination.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="btn btn-primary"
                disabled={submitting || (allocationMode === 'existing' && !selectedGroupId)}
              >
                {submitting ? 'Approving...' : 'Confirm Approval & Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#dc2626' }}>
                Decline Registration: {rejectUser.name}
              </h3>
              <button
                onClick={() => setRejectUser(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Are you sure you want to decline registration for <strong>{rejectUser.name}</strong> ({rejectUser.email})?
              </p>
              <div className="form-group">
                <label className="form-label">Reason for declining (Optional)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Incomplete verification documents or outside service jurisdiction"
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setRejectUser(null)}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="btn btn-danger"
                disabled={submitting}
              >
                {submitting ? 'Declining...' : 'Decline Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
