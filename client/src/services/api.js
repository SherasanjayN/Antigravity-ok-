const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('mk_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('mk_token', token);
  } else {
    localStorage.removeItem('mk_token');
  }
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    register: (userData) => request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
    me: () => request('/auth/me')
  },

  // Interactive Live Calculator
  calculator: (payload) => request('/calculator', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Super Admin
  admin: {
    getOverview: () => request('/admin/overview'),
    getAnalytics: () => request('/admin/analytics'),
    getPendingUsers: () => request('/admin/pending-users'),
    approveUser: (id, payload) => request(`/admin/users/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    rejectUser: (id, reason) => request(`/admin/users/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
    getUsers: () => request('/admin/users'),
    getGroups: () => request('/admin/groups'),
    createGroup: (payload) => request('/admin/groups', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    getLoans: () => request('/admin/loans'),
    sanctionLoan: (loanId) => request(`/admin/loans/${loanId}/sanction`, {
      method: 'POST'
    }),
    disburseLoan: (loanId, payload) => request(`/admin/loans/${loanId}/disburse`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    rejectLoan: (loanId, reason) => request(`/admin/loans/${loanId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
    createAnnouncement: (payload) => request('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    getEmailLogs: () => request('/admin/email-logs'),
    retryEmail: (emailId) => request(`/admin/emails/${emailId}/retry`, {
      method: 'POST'
    }),
    assignGroupAdmin: (groupId, payload) => request(`/admin/groups/${groupId}/assign-admin`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  // Group Admin
  groupAdmin: {
    getMyGroup: () => request('/group-admin/my-group'),
    getLoans: () => request('/group-admin/loans'),
    forwardLoan: (loanId) => request(`/group-admin/loans/${loanId}/forward`, {
      method: 'POST'
    }),
    rejectLoan: (loanId, reason) => request(`/group-admin/loans/${loanId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
    applyLoan: (payload) => request('/group-admin/loans/apply', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  // Member (User)
  member: {
    getDashboard: () => request('/member/dashboard'),
    checkActiveLoan: () => request('/member/active-loan-check'),
    applyLoan: (payload) => request('/member/loans', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  // Repayment Ledger & Recording
  repayments: {
    record: (payload) => request('/repayments', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    getLedger: (loanId) => request(`/loans/${loanId}/ledger`)
  },

  // Notifications
  notifications: {
    getAll: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => request('/notifications/mark-all-read', { method: 'POST' })
  },

  // Chat
  chat: {
    getMessages: (groupId, since) => {
      const query = since ? `?since=${encodeURIComponent(since)}` : '';
      return request(`/groups/${groupId}/messages${query}`);
    },
    sendMessage: (groupId, text) => request(`/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text })
    }),
    deleteMessage: (groupId, messageId) => request(`/groups/${groupId}/messages/${messageId}`, {
      method: 'DELETE'
    })
  },

  // Announcements
  announcements: {
    getAll: () => request('/announcements')
  }
};
