import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Building2,
  Users,
  IndianRupee,
  Megaphone,
  Mail,
  ShieldAlert,
  MessageSquare,
  Calculator
} from 'lucide-react';
import OverviewTab from './OverviewTab';
import PendingUsersTab from './PendingUsersTab';
import LoansTab from './LoansTab';
import GroupsTab from './GroupsTab';
import UsersTab from './UsersTab';
import BroadcastTab from './BroadcastTab';
import LoanCalculatorModal from '../LoanCalculatorModal';
import { api } from '../../services/api';

import { useLanguage } from '../../i18n';

export default function SuperAdminDashboard({ currentUser }) {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingLoansCount, setPendingLoansCount] = useState(0);

  const fetchBadgeCounts = async () => {
    try {
      const [pendingUsers, loans] = await Promise.all([
        api.admin.getPendingUsers(),
        api.admin.getLoans()
      ]);
      setPendingCount(pendingUsers.length);
      setPendingLoansCount(loans.filter(l => l.status === 'PENDING_SUPER_ADMIN').length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBadgeCounts();
  }, [activeTab]);

  const navItems = [
    { id: 'overview', label: t('tab_overview'), icon: LayoutDashboard },
    {
      id: 'pending',
      label: t('tab_pending_users'),
      icon: UserCheck,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: '#d97706'
    },
    {
      id: 'loans',
      label: t('tab_loans'),
      icon: IndianRupee,
      badge: pendingLoansCount > 0 ? pendingLoansCount : null,
      badgeColor: '#7c3aed'
    },
    { id: 'calculator', label: lang === 'ta' ? 'கடன் கால்குலேட்டர்' : 'Loan Calculator', icon: Calculator },
    { id: 'groups', label: t('tab_groups'), icon: Building2 },
    { id: 'users', label: t('tab_users'), icon: Users },
    { id: 'broadcast', label: t('tab_broadcast'), icon: Megaphone }
  ];

  return (
    <div className="main-layout">
      {/* Sidebar Navigation */}
      <aside style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--border-color)',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem'
      }}>
        <div style={{
          padding: '0.5rem 0.75rem 1rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)'
        }}>
          Super Admin Console
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--primary-50)' : 'transparent',
                color: isActive ? 'var(--primary-800)' : 'var(--text-main)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} color={isActive ? 'var(--primary-700)' : 'var(--text-muted)'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  backgroundColor: item.badgeColor || 'var(--primary-700)',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  borderRadius: '999px',
                  padding: '0.15rem 0.45rem',
                  lineHeight: 1
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </aside>

      {/* Main Content Area */}
      <main className="content-area">
        {activeTab === 'overview' && <OverviewTab onNavigate={setActiveTab} />}
        {activeTab === 'pending' && <PendingUsersTab onActionComplete={fetchBadgeCounts} />}
        {activeTab === 'loans' && <LoansTab onActionComplete={fetchBadgeCounts} />}
        {activeTab === 'calculator' && (
          <div className="card">
            <LoanCalculatorModal isEmbedded={true} />
          </div>
        )}
        {activeTab === 'groups' && <GroupsTab currentUser={currentUser} />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'broadcast' && <BroadcastTab />}
      </main>
    </div>
  );
}
