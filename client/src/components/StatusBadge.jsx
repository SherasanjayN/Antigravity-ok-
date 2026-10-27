import React from 'react';
import { Clock, CheckCircle2, XCircle, ShieldAlert, ShieldCheck, UserCheck } from 'lucide-react';

export default function StatusBadge({ status, type = 'status' }) {
  if (type === 'role') {
    switch (status) {
      case 'SUPER_ADMIN':
        return (
          <span className="badge badge-super" title="Super Administrator">
            <ShieldAlert size={12} /> Super Admin
          </span>
        );
      case 'GROUP_ADMIN':
        return (
          <span className="badge badge-role" title="Group Administrator">
            <ShieldCheck size={12} /> Group Admin
          </span>
        );
      default:
        return (
          <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
            <UserCheck size={12} /> Member
          </span>
        );
    }
  }

  // Loan and User Statuses
  switch (status) {
    case 'PENDING':
      return (
        <span className="badge badge-pending">
          <Clock size={12} /> Pending Approval
        </span>
      );
    case 'PENDING_GROUP_ADMIN':
      return (
        <span className="badge badge-pending">
          <Clock size={12} /> Step 1: Group Admin Review
        </span>
      );
    case 'PENDING_SUPER_ADMIN':
      return (
        <span className="badge badge-super">
          <Clock size={12} /> Step 2: Super Admin Review
        </span>
      );
    case 'APPROVED':
      return (
        <span className="badge badge-approved">
          <CheckCircle2 size={12} /> Sanctioned & Approved
        </span>
      );
    case 'REJECTED':
      return (
        <span className="badge badge-rejected">
          <XCircle size={12} /> Declined
        </span>
      );
    default:
      return <span className="badge">{status}</span>;
  }
}
