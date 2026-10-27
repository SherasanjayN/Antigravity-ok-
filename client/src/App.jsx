import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PublicLanding from './components/PublicLanding';
import PendingApprovalView from './components/PendingApprovalView';
import SuperAdminDashboard from './components/SuperAdmin/SuperAdminDashboard';
import GroupAdminDashboard from './components/GroupAdmin/GroupAdminDashboard';
import MemberDashboard from './components/Member/MemberDashboard';
import SheAiAssistant from './components/AI/SheAiAssistant';
import { api, setToken } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Check existing session
  const checkSession = async () => {
    const token = localStorage.getItem('mk_token');
    if (!token) {
      setLoadingInitial(false);
      return;
    }

    try {
      const user = await api.auth.me();
      if (user.status === 'PENDING') {
        setPendingUser(user);
        setCurrentUser(null);
      } else {
        setCurrentUser(user);
        setPendingUser(null);
      }
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      setToken(null);
      setCurrentUser(null);
      setPendingUser(null);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLoginSuccess = (user) => {
    setPendingUser(null);
    setCurrentUser(user);
  };

  const handlePendingUser = (user) => {
    setPendingUser(user);
    setCurrentUser(null);
  };

  const handleRegisterSuccess = (user) => {
    // Land on pending approval screen
    setPendingUser(user);
    setCurrentUser(null);
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setPendingUser(null);
  };

  if (loadingInitial) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-sans)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #a7f3d0',
            borderTopColor: '#047857',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem auto'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontWeight: 600, color: '#065f46' }}>
            Initializing Magalir Kuzhu Portal | மகளிர் குழு...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar user={currentUser} onLogout={handleLogout} />

      {/* CASE 1: Pending Approval Screen */}
      {pendingUser ? (
        <PendingApprovalView
          user={pendingUser}
          onLogout={handleLogout}
          onRefreshUser={checkSession}
        />
      ) : !currentUser ? (
        /* CASE 2: Professional Public Home & Financial Landing Page */
        <PublicLanding
          onLoginSuccess={handleLoginSuccess}
          onRegisterSuccess={handleRegisterSuccess}
          onPendingUser={handlePendingUser}
        />
      ) : (
        /* CASE 3: Authenticated Role-based Dashboards */
        <>
          {currentUser.role === 'SUPER_ADMIN' && (
            <SuperAdminDashboard currentUser={currentUser} />
          )}

          {currentUser.role === 'GROUP_ADMIN' && (
            <GroupAdminDashboard currentUser={currentUser} />
          )}

          {currentUser.role === 'USER' && (
            <MemberDashboard currentUser={currentUser} />
          )}
        </>
      )}

      {/* SHE AI - Available only inside authenticated user dashboard, not on home landing page */}
      {currentUser && <SheAiAssistant currentUser={currentUser} />}
    </div>
  );
}
