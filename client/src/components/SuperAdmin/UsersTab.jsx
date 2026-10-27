import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, Mail, Phone, MapPin, Building2, Edit } from 'lucide-react';
import { api } from '../../services/api';
import StatusBadge from '../StatusBadge';

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit user modal
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState('USER');
  const [editGroupId, setEditGroupId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, groupsData] = await Promise.all([
        api.admin.getUsers(),
        api.admin.getGroups()
      ]);
      setUsers(usersData);
      setGroups(groupsData);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditModal = (u) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditGroupId(u.group_id || '');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setSubmitting(true);
    try {
      await api.admin.updateUserRole(editUser.id, {
        role: editRole,
        group_id: editGroupId || null
      });
      setEditUser(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update user.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.area && u.area.toLowerCase().includes(q)) ||
      (u.district && u.district.toLowerCase().includes(q)) ||
      (u.group_name && u.group_name.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Registered Users Directory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Comprehensive directory of all members, group admins, and system administrators.
          </p>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, area..."
            className="form-input"
            style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading user records...
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Status</th>
                <th>Group Allocation</th>
                <th>Location</th>
                <th>Registered Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ph: {u.phone}</div>
                  </td>
                  <td>
                    <StatusBadge status={u.role} type="role" />
                  </td>
                  <td>
                    <StatusBadge status={u.status} />
                  </td>
                  <td>
                    {u.group_name ? (
                      <span style={{ fontWeight: 600, color: 'var(--primary-800)' }}>
                        {u.group_name}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                        Not allocated
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.825rem' }}>
                    {u.area}, {u.district}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    {u.role !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => openEditModal(u)}
                        className="btn btn-secondary btn-sm"
                        title="Edit User Role/Group"
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleUpdateUser}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Modify User: {editUser.name}</h3>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div><strong>Email:</strong> {editUser.email}</div>
                  <div><strong>Phone:</strong> {editUser.phone}</div>
                  <div><strong>Location:</strong> {editUser.area}, {editUser.district}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">System Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="form-select"
                  >
                    <option value="USER">USER (Regular Member)</option>
                    <option value="GROUP_ADMIN">GROUP_ADMIN (Group Coordinator)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Allocated Group</label>
                  <select
                    value={editGroupId}
                    onChange={(e) => setEditGroupId(e.target.value)}
                    className="form-select"
                  >
                    <option value="">-- No Group Allocation --</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.group_name} ({g.area})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
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
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
