const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const { readCollection, writeCollection, initDb } = require('./db');
const { generateToken, authenticateToken, requireRole } = require('./auth');
const {
  sendLoanSanctionEmail,
  sendLoanDisbursementEmail,
  sendCashRepaymentEmail,
  sendUpiRepaymentEmail,
  sendLoanRejectionEmail,
  retryEmail
} = require('./mailer');
const {
  calculateEmi,
  generateRepaymentSchedule,
  allocateRepayment,
  processDailyRepaymentAndScore,
  DAILY_PENALTY_RATE,
  DAILY_SCORE_PENALTY
} = require('./loanCalculations');
const {
  isLoanCompleted,
  isLoanActive,
  calculateRepaymentScoreDetails,
  evaluateLoanEligibility
} = require('./loanEligibilityService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
// Initialize database & seed master accounts
initDb();

// ----------------- NOTIFICATION & AUDIT HELPERS -----------------
function createNotification(userId, type, title, message, relatedLoanId = null) {
  try {
    const notifications = readCollection('notifications');
    const notif = {
      id: uuidv4(),
      user_id: userId,
      type,
      title,
      message,
      related_loan_id: relatedLoanId,
      is_read: false,
      created_at: new Date().toISOString()
    };
    notifications.unshift(notif);
    writeCollection('notifications', notifications);
    return notif;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

// ----------------- DAILY REPAYMENT & SCORE CHECK SERVICE -----------------
function runDailyRepaymentCheck(customDate = null) {
  try {
    const loans = readCollection('loans');
    const schedules = readCollection('repayment_schedules');
    const users = readCollection('users');
    const dailyPenalties = readCollection('daily_penalties');
    const notifications = readCollection('notifications');

    const result = processDailyRepaymentAndScore({
      loans,
      schedules,
      users,
      dailyPenalties,
      notifications,
      currentDate: customDate,
      notifyCallback: ({ userId, loanId, repaymentId, overdueDays, pendingAmount, penaltyAmount, totalOutstanding }) => {
        // Overdue Notification bilingual as per requirement
        const title = `⚠️ Repayment Overdue / தவணை நிலுவை அறிவிப்பு`;
        const messageEn = `Your ₹${pendingAmount} repayment is ${overdueDays} days overdue. Pending Amount: ₹${pendingAmount}, Late Penalty: ₹${penaltyAmount}, Total Outstanding: ₹${totalOutstanding}.`;
        const messageTa = `உங்கள் ₹${pendingAmount} repayment ${overdueDays} நாட்கள் overdue ஆக உள்ளது. Pending Amount: ₹${pendingAmount}, Late Penalty: ₹${penaltyAmount}, Total Outstanding: ₹${totalOutstanding}.`;
        const fullMessage = `${messageEn}\n\n${messageTa}`;

        createNotification(userId, 'REPAYMENT_OVERDUE', title, fullMessage, loanId);
      }
    });

    writeCollection('loans', loans);
    writeCollection('repayment_schedules', schedules);
    writeCollection('users', users);
    writeCollection('daily_penalties', dailyPenalties);

    console.log(`[DAILY CHECK] Completed for ${result.todayStr}. New daily penalties: ${result.penaltiesCreatedCount}, Total tracked: ${result.totalPenaltiesTracked}`);
    return result;
  } catch (err) {
    console.error('[DAILY CHECK] Error running daily repayment check:', err);
    return null;
  }
}


function recordAudit(userId, userName, role, action, details) {
  try {
    const logs = readCollection('audit_logs');
    logs.unshift({
      id: uuidv4(),
      user_id: userId,
      user_name: userName,
      role,
      action,
      details,
      created_at: new Date().toISOString()
    });
    writeCollection('audit_logs', logs);
  } catch (err) {
    console.error('Error recording audit:', err);
  }
}

// Helper: Get a user's active non-completed loans
function getUserActiveLoans(userId) {
  const loans = readCollection('loans');
  return loans.filter(l => l.user_id === userId && isLoanActive(l));
}

function checkUserActiveLoan(userId) {
  const activeLoans = getUserActiveLoans(userId);
  return activeLoans.length > 0 ? activeLoans[0] : null;
}

// Centralized helper to get current member loan eligibility using real DB records
function getMemberLoanEligibility(userId) {
  const users = readCollection('users');
  const loans = readCollection('loans');
  const repayments = readCollection('repayments');
  const dailyPenalties = readCollection('daily_penalties');
  const schedules = readCollection('repayment_schedules');
  const groups = readCollection('groups');

  return evaluateLoanEligibility({
    userId,
    users,
    loans,
    repayments,
    dailyPenalties,
    schedules,
    groups
  });
}

// ----------------- VALIDATION HELPERS -----------------
function validateRegistration(data) {
  const { name, phone, email, area, district, password } = data;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().replace(/[^a-zA-Z]/g, '').length < 3) {
    errors.push('Name must contain at least 3 letters.');
  }
  if (!phone || !/^\d{10}$/.test(String(phone).trim())) {
    errors.push('Phone number must be exactly 10 digits.');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(String(email).trim())) {
    errors.push('A valid email address is required.');
  }
  if (!area || typeof area !== 'string' || !area.trim()) {
    errors.push('Area is mandatory.');
  }
  if (!district || typeof district !== 'string' || !district.trim()) {
    errors.push('District is mandatory.');
  }
  if (!password || typeof password !== 'string' || password.length < 6 || !/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    errors.push('Password must be at least 6 characters and contain both letters and numbers.');
  }
  return errors;
}

// ----------------- AUTH ROUTES -----------------
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, phone, email, area, district, password } = req.body;
    const errors = validateRegistration(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' ') });
    }

    const users = readCollection('users');
    const existing = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const newUser = {
      id: uuidv4(),
      name: name.trim(),
      phone: String(phone).trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      area: area.trim(),
      district: district.trim(),
      status: 'PENDING',
      role: 'USER',
      group_id: null,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    writeCollection('users', users);

    res.status(201).json({
      message: 'Registration submitted successfully. Your account is pending Super Admin approval.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        status: newUser.status
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const users = readCollection('users');
    const user = users.find(u => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'PENDING') {
      return res.status(200).json({
        status: 'PENDING',
        message: 'Your registration is currently pending Super Admin approval. You will receive access once approved.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: 'PENDING',
          role: user.role,
          area: user.area,
          district: user.district
        }
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        status: 'REJECTED',
        error: 'Your registration request has been declined. Please contact the administrator for further details.'
      });
    }

    const token = generateToken(user);
    let group = null;
    if (user.group_id) {
      const groups = readCollection('groups');
      group = groups.find(g => g.id === user.group_id) || null;
    }

    res.json({
      status: 'APPROVED',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        area: user.area,
        district: user.district,
        role: user.role,
        status: user.status,
        group_id: user.group_id,
        group
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const users = readCollection('users');
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let group = null;
    if (user.group_id) {
      const groups = readCollection('groups');
      group = groups.find(g => g.id === user.group_id) || null;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      area: user.area,
      district: user.district,
      role: user.role,
      status: user.status,
      group_id: user.group_id,
      group
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error retrieving user session.' });
  }
});

// ----------------- INTERACTIVE LOAN CALCULATOR -----------------
app.post('/api/calculator', (req, res) => {
  try {
    const { principal, annual_interest_rate = 12, repayment_frequency = 'WEEKLY', tenure_value = 10, start_date } = req.body;
    const P = Number(principal);
    const R = Number(annual_interest_rate);
    const N = Number(tenure_value);

    if (isNaN(P) || P <= 0) {
      return res.status(400).json({ error: 'Please provide a valid positive principal amount.' });
    }

    const result = generateRepaymentSchedule(P, R, repayment_frequency, N, start_date);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate loan schedule.' });
  }
});

// ----------------- SUPER ADMIN ROUTES -----------------

// Overview metrics
app.get('/api/admin/overview', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const users = readCollection('users');
    const groups = readCollection('groups');
    const loans = readCollection('loans');
    const repayments = readCollection('repayments');

    const totalMembers = users.filter(u => u.role !== 'SUPER_ADMIN').length;
    const approvedMembers = users.filter(u => u.status === 'APPROVED' && u.role !== 'SUPER_ADMIN').length;
    const pendingMembers = users.filter(u => u.status === 'PENDING').length;
    const activeGroups = groups.length;

    // Financial totals
    let totalSanctionedAmount = 0;
    let totalDisbursedAmount = 0;
    let totalCollectedAmount = 0;
    let totalOutstandingBalance = 0;
    let overdueCount = 0;

    const today = new Date().toISOString().split('T')[0];

    loans.forEach(l => {
      if (['SANCTIONED', 'DISBURSED', 'APPROVED', 'COMPLETED'].includes(l.status)) {
        totalSanctionedAmount += (l.sanctioned_amount || l.amount || 0);
      }
      if (l.status === 'DISBURSED' || l.disbursed_at) {
        totalDisbursedAmount += (l.disbursed_amount || l.sanctioned_amount || l.amount || 0);
      }
      totalCollectedAmount += (l.total_paid || 0);
      if (l.status === 'DISBURSED') {
        const bal = l.outstanding_balance !== undefined ? l.outstanding_balance : (l.amount - (l.total_paid || 0));
        totalOutstandingBalance += Math.max(0, bal);
        if (l.next_due_date && l.next_due_date < today && bal > 0) {
          overdueCount++;
        }
      }
    });

    const pendingLoanApprovals = loans.filter(l => l.status === 'PENDING_SUPER_ADMIN').length;
    const awaitingDisbursement = loans.filter(l => l.status === 'SANCTIONED').length;

    res.json({
      totalMembers,
      approvedMembers,
      pendingMembers,
      activeGroups,
      totalSanctionedAmount,
      totalDisbursedAmount,
      totalCollectedAmount,
      totalOutstandingBalance,
      overdueCount,
      pendingLoanApprovals,
      awaitingDisbursement
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch overview metrics.' });
  }
});

// Admin Analytics (charts, breakdown)
app.get('/api/admin/analytics', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const loans = readCollection('loans');
    const repayments = readCollection('repayments');

    let weeklyLoansCount = 0;
    let monthlyLoansCount = 0;
    loans.forEach(l => {
      if (l.repayment_frequency === 'MONTHLY') monthlyLoansCount++;
      else weeklyLoansCount++;
    });

    let cashTotal = 0;
    let upiTotal = 0;
    repayments.forEach(r => {
      if (r.payment_method === 'CASH') cashTotal += (r.amount || 0);
      else upiTotal += (r.amount || 0);
    });

    // Group-wise loan performance metrics
    const groups = readCollection('groups');
    const groupBreakdown = groups.map(g => {
      const gLoans = loans.filter(l => l.group_id === g.id);
      const totalSanctioned = gLoans
        .filter(l => ['SANCTIONED', 'DISBURSED', 'APPROVED', 'COMPLETED'].includes(l.status))
        .reduce((sum, l) => sum + (l.sanctioned_amount || l.amount || 0), 0);
      const totalRepaid = gLoans.reduce((sum, l) => sum + (l.total_paid || 0), 0);
      const totalBalance = gLoans
        .filter(l => l.status === 'DISBURSED')
        .reduce((sum, l) => sum + Math.max(0, l.outstanding_balance || 0), 0);
      return {
        id: g.id,
        group_name: g.group_name,
        area: g.area,
        loanCount: gLoans.length,
        sanctioned: totalSanctioned,
        repaid: totalRepaid,
        balance: totalBalance,
        recoveryRate: totalSanctioned > 0 ? Math.round((totalRepaid / totalSanctioned) * 100) : 100
      };
    });

    // Purpose categorization breakdown
    const purposeMap = {};
    loans.forEach(l => {
      const p = l.purpose || 'Small Business';
      purposeMap[p] = (purposeMap[p] || 0) + 1;
    });
    const purposeBreakdown = Object.entries(purposeMap).map(([name, count]) => ({ name, count }));

    // Monthly repayment trend (last 6 months)
    const monthMap = {};
    repayments.forEach(r => {
      const d = r.payment_date || r.created_at || '2026-10-01';
      const m = d.slice(0, 7); // YYYY-MM
      monthMap[m] = (monthMap[m] || 0) + (r.amount || 0);
    });
    const repaymentTrends = Object.entries(monthMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }));

    res.json({
      weeklyVsMonthly: {
        weekly: weeklyLoansCount,
        monthly: monthlyLoansCount
      },
      cashVsUpi: {
        cash: cashTotal,
        upi: upiTotal
      },
      groupBreakdown,
      purposeBreakdown,
      repaymentTrends
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

// Pending users with auto-suggested groups
app.get('/api/admin/pending-users', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const users = readCollection('users');
    const groups = readCollection('groups');

    const pending = users
      .filter(u => u.status === 'PENDING')
      .map(u => {
        const suggestedGroups = groups.filter(g =>
          (g.area.toLowerCase() === u.area.toLowerCase() || g.district.toLowerCase() === u.district.toLowerCase())
        );
        return {
          id: u.id,
          name: u.name,
          phone: u.phone,
          email: u.email,
          area: u.area,
          district: u.district,
          created_at: u.created_at,
          suggestedGroups
        };
      });

    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending users.' });
  }
});

// Approve user & assign group
app.post('/api/admin/users/:id/approve', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const { group_id, role = 'USER' } = req.body;

    const users = readCollection('users');
    const groups = readCollection('groups');

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const group = groups.find(g => g.id === group_id);
    if (!group) {
      return res.status(400).json({ error: 'Please select a valid group for allocation.' });
    }

    users[userIndex].status = 'APPROVED';
    users[userIndex].group_id = group_id;
    users[userIndex].role = role;
    users[userIndex].approved_at = new Date().toISOString();

    if (role === 'GROUP_ADMIN') {
      const gIdx = groups.findIndex(g => g.id === group_id);
      if (gIdx !== -1) {
        groups[gIdx].group_admin_id = id;
        writeCollection('groups', groups);
      }
    }

    writeCollection('users', users);

    createNotification(
      id,
      'REGISTRATION_APPROVED',
      'Registration Approved! | பதிவு அனுமதிக்கப்பட்டது',
      `Welcome to Magalir Kuzhu! You have been allocated to ${group.group_name}.`
    );

    recordAudit(req.user.id, req.user.name, 'SUPER_ADMIN', 'APPROVE_USER', `Approved user ${users[userIndex].name} into group ${group.group_name}`);

    res.json({
      message: `User ${users[userIndex].name} approved and assigned to group ${group.group_name}.`,
      user: users[userIndex],
      group
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve user.' });
  }
});

// Reject user
app.post('/api/admin/users/:id/reject', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const users = readCollection('users');
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found.' });
    }

    users[userIndex].status = 'REJECTED';
    users[userIndex].rejection_reason = reason || 'Application requirements not met.';
    writeCollection('users', users);

    recordAudit(req.user.id, req.user.name, 'SUPER_ADMIN', 'REJECT_USER', `Rejected registration for ${users[userIndex].email}`);
    res.json({ message: 'User registration declined.', user: users[userIndex] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to decline registration.' });
  }
});

// Directory of users
app.get('/api/admin/users', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const users = readCollection('users');
    const groups = readCollection('groups');

    const mapped = users.map(u => {
      const g = groups.find(grp => grp.id === u.group_id);
      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        area: u.area,
        district: u.district,
        role: u.role,
        status: u.status,
        group_id: u.group_id,
        group_name: g ? g.group_name : 'Unallocated',
        created_at: u.created_at
      };
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Groups list
app.get('/api/admin/groups', authenticateToken, (req, res) => {
  try {
    const groups = readCollection('groups');
    const users = readCollection('users');

    const mappedGroups = groups.map(g => {
      const admin = users.find(u => u.id === g.group_admin_id);
      const members = users.filter(u => u.group_id === g.id && u.status === 'APPROVED');
      return {
        id: g.id,
        group_name: g.group_name,
        area: g.area,
        district: g.district,
        group_admin_id: g.group_admin_id,
        group_admin_name: admin ? admin.name : null,
        group_admin_email: admin ? admin.email : null,
        member_count: members.length,
        created_at: g.created_at
      };
    });
    res.json(mappedGroups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch groups.' });
  }
});

// Create group
app.post('/api/admin/groups', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const { group_name, area, district, group_admin_id } = req.body;
    if (!group_name || !area || !district) {
      return res.status(400).json({ error: 'Group name, area, and district are required.' });
    }

    const groups = readCollection('groups');
    const newGroup = {
      id: uuidv4(),
      group_name: group_name.trim(),
      area: area.trim(),
      district: district.trim(),
      group_admin_id: group_admin_id || null,
      created_at: new Date().toISOString()
    };

    groups.push(newGroup);
    writeCollection('groups', groups);

    recordAudit(req.user.id, req.user.name, 'SUPER_ADMIN', 'CREATE_GROUP', `Created group ${newGroup.group_name}`);
    res.status(201).json({ message: 'Group created successfully.', group: newGroup });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create group.' });
  }
});

// Assign / Change Group Admin (Super Admin)
app.post('/api/admin/groups/:groupId/assign-admin', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const { groupId } = req.params;
    const { group_admin_id } = req.body;

    const groups = readCollection('groups');
    const users = readCollection('users');

    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    const previousAdminId = groups[groupIndex].group_admin_id;

    // If new admin is specified, verify user exists and belongs to the group
    let newAdmin = null;
    if (group_admin_id) {
      newAdmin = users.find(u => u.id === group_admin_id);
      if (!newAdmin) {
        return res.status(404).json({ error: 'Selected user not found.' });
      }
      if (newAdmin.group_id !== groupId) {
        return res.status(400).json({ error: 'User does not belong to this group.' });
      }
    }

    // Demote previous admin back to USER if different
    if (previousAdminId && previousAdminId !== group_admin_id) {
      const prevUserIdx = users.findIndex(u => u.id === previousAdminId);
      if (prevUserIdx !== -1) {
        users[prevUserIdx].role = 'USER';
      }
    }

    // Promote new admin to GROUP_ADMIN
    if (newAdmin) {
      const newUserIdx = users.findIndex(u => u.id === group_admin_id);
      if (newUserIdx !== -1) {
        users[newUserIdx].role = 'GROUP_ADMIN';
      }
    }

    groups[groupIndex].group_admin_id = group_admin_id || null;

    writeCollection('groups', groups);
    writeCollection('users', users);

    recordAudit(
      req.user.id,
      req.user.name,
      'SUPER_ADMIN',
      'CHANGE_GROUP_ADMIN',
      `Changed group admin for ${groups[groupIndex].group_name} to ${newAdmin ? newAdmin.name : 'None'}`
    );

    if (newAdmin) {
      createNotification(
        newAdmin.id,
        'ROLE_UPDATED',
        'Group Admin Role Designated | குழு தலைவர் பதவி வழங்கப்பட்டது',
        `You have been appointed as the Group Admin for ${groups[groupIndex].group_name}.`
      );
    }

    res.json({
      message: 'Group admin updated successfully.',
      group: groups[groupIndex]
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign group admin.' });
  }
});

// All loans (Super Admin)
app.get('/api/admin/loans', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const loans = readCollection('loans');
    const users = readCollection('users');
    const groups = readCollection('groups');

    const mapped = loans.map(l => {
      const member = users.find(u => u.id === l.user_id);
      const group = groups.find(g => g.id === l.group_id);
      const userActiveLoans = getUserActiveLoans(l.user_id);
      const eligibility = getMemberLoanEligibility(l.user_id);
      return {
        ...l,
        member_name: member ? member.name : 'Unknown',
        member_email: member ? member.email : 'Unknown',
        member_phone: member ? member.phone : 'Unknown',
        member_repayment_score: eligibility.repaymentScore,
        member_completed_loans: eligibility.completedLoans,
        member_remaining_balance: eligibility.remainingBalance,
        eligibility: {
          eligible: eligibility.eligible,
          loanNumber: eligibility.loanNumber,
          reason: eligibility.reason,
          statusCode: eligibility.statusCode,
          ratingCategory: eligibility.ratingCategory
        },
        group_name: group ? group.group_name : 'Unknown',
        user_active_loans_count: userActiveLoans.length
      };
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch loans.' });
  }
});

// STEP 3: Super Admin Final Sanction (generates loan account #, creates schedule, sends sanction email)
app.post('/api/admin/loans/:id/sanction', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const loans = readCollection('loans');
    const users = readCollection('users');
    const schedules = readCollection('repayment_schedules');

    const loanIndex = loans.findIndex(l => l.id === id);
    if (loanIndex === -1) {
      return res.status(404).json({ error: 'Loan request not found.' });
    }

    const loan = loans[loanIndex];
    if (loan.status === 'SANCTIONED' || loan.status === 'DISBURSED' || loan.status === 'APPROVED') {
      return res.status(400).json({ error: 'Loan is already sanctioned or disbursed.' });
    }

    const member = users.find(u => u.id === loan.user_id);
    if (!member) {
      return res.status(404).json({ error: 'Associated member not found.' });
    }

    // Generate Unique Loan Account Number: MK-LN-2026-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const loanAccountNumber = loan.loan_account_number || `MK-LN-2026-${randomSuffix}`;

    // Calculate loan terms
    const principal = loan.amount;
    const rate = loan.annual_interest_rate || 12;
    const freq = loan.repayment_frequency || 'WEEKLY';
    const tenure = loan.tenure_value || (freq === 'WEEKLY' ? 10 : 6);

    const scheduleData = generateRepaymentSchedule(principal, rate, freq, tenure, loan.preferred_first_due_date || new Date().toISOString(), loan.id);

    loan.loan_account_number = loanAccountNumber;
    loan.status = 'SANCTIONED';
    loan.sanctioned_amount = principal;
    loan.annual_interest_rate = rate;
    loan.repayment_frequency = freq;
    loan.tenure_value = tenure;
    loan.tenure_unit = freq === 'WEEKLY' ? 'Weeks' : 'Months';
    loan.total_installments = scheduleData.calc.installments;
    loan.installment_amount = scheduleData.calc.emi;
    loan.total_interest = scheduleData.calc.totalInterest;
    loan.total_repayment = scheduleData.calc.totalRepayment;
    loan.outstanding_balance = scheduleData.calc.totalRepayment;
    loan.total_paid = 0;
    loan.first_due_date = scheduleData.schedule[0]?.due_date || null;
    loan.final_due_date = scheduleData.schedule[scheduleData.schedule.length - 1]?.due_date || null;
    loan.sanctioned_at = new Date().toISOString();
    loan.disbursement_status = 'NOT_DISBURSED';
    loan.repayment_schedule = scheduleData.schedule;

    loan.timeline = loan.timeline || [];
    loan.timeline.push({
      status: 'SANCTIONED',
      note: `Final sanction granted by Super Admin for ₹${principal}. Loan Account Number: ${loanAccountNumber}. Ready for disbursement.`,
      by_name: req.user.name,
      at: new Date().toISOString()
    });

    writeCollection('loans', loans);

    // Save schedule in repayment_schedules collection
    const schIndex = schedules.findIndex(s => s.loan_id === loan.id);
    if (schIndex !== -1) {
      schedules[schIndex].schedule = scheduleData.schedule;
    } else {
      schedules.push({ loan_id: loan.id, schedule: scheduleData.schedule });
    }
    writeCollection('repayment_schedules', schedules);

    // Send official loan sanction email to registered email
    const emailResult = await sendLoanSanctionEmail(member.email, member.name, loan);

    // In-app notification
    createNotification(
      member.id,
      'LOAN_SANCTIONED',
      'Loan Application Sanctioned! | கடன் அனுமதிக்கப்பட்டது',
      `Your loan of ₹${principal} (Acct: ${loanAccountNumber}) has been officially sanctioned. Disbursal pending.`,
      loan.id
    );

    recordAudit(req.user.id, req.user.name, 'SUPER_ADMIN', 'SANCTION_LOAN', `Sanctioned loan ${loanAccountNumber} of ₹${principal} for ${member.name}`);

    res.json({
      message: `Loan ${loanAccountNumber} successfully sanctioned! Sanction email dispatched to ${member.email}.`,
      loan,
      emailResult
    });
  } catch (err) {
    console.error('Sanction error:', err);
    res.status(500).json({ error: 'Failed to sanction loan.' });
  }
});

// STEP 4: Separate Loan Disbursement Action (Super Admin only)
app.post('/api/admin/loans/:id/disburse', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method = 'BANK_TRANSFER', transaction_reference = '', notes = '' } = req.body;

    const loans = readCollection('loans');
    const users = readCollection('users');

    const loanIndex = loans.findIndex(l => l.id === id);
    if (loanIndex === -1) {
      return res.status(404).json({ error: 'Loan request not found.' });
    }

    const loan = loans[loanIndex];
    if (loan.status !== 'SANCTIONED') {
      return res.status(400).json({ error: `Cannot disburse loan with status ${loan.status}. Loan must be SANCTIONED first.` });
    }

    if (loan.disbursement_status === 'DISBURSED') {
      return res.status(400).json({ error: 'Loan has already been disbursed.' });
    }

    const member = users.find(u => u.id === loan.user_id);
    if (!member) {
      return res.status(404).json({ error: 'Associated member not found.' });
    }

    const disbursedAmount = loan.sanctioned_amount || loan.amount;
    const disbursementDate = new Date().toISOString().split('T')[0];

    loan.status = 'DISBURSED';
    loan.disbursement_status = 'DISBURSED';
    loan.disbursed_amount = disbursedAmount;
    loan.disbursed_at = new Date().toISOString();
    loan.disbursed_by = req.user.name;
    loan.disbursement_payment_method = payment_method;
    loan.disbursement_reference = transaction_reference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    loan.timeline = loan.timeline || [];
    loan.timeline.push({
      status: 'DISBURSED',
      note: `Loan disbursed: ₹${disbursedAmount} via ${payment_method}. Ref: ${loan.disbursement_reference}. Repayment schedule is now active.`,
      by_name: req.user.name,
      at: new Date().toISOString()
    });

    writeCollection('loans', loans);

    // Send official disbursement email
    const emailResult = await sendLoanDisbursementEmail(member.email, member.name, loan, {
      amount: disbursedAmount,
      date: disbursementDate,
      method: payment_method,
      reference: loan.disbursement_reference
    });

    // In-app notification
    createNotification(
      member.id,
      'LOAN_DISBURSED',
      'Loan Disbursed! | கடன் தொகை வழங்கப்பட்டது',
      `Your loan of ₹${disbursedAmount} has been disbursed to your account. Your repayment schedule is now active.`,
      loan.id
    );

    recordAudit(req.user.id, req.user.name, 'SUPER_ADMIN', 'DISBURSE_LOAN', `Disbursed ₹${disbursedAmount} for loan ${loan.loan_account_number} (${member.name})`);

    res.json({
      message: `Loan ${loan.loan_account_number} disbursed successfully! Confirmation email dispatched to ${member.email}.`,
      loan,
      emailResult
    });
  } catch (err) {
    console.error('Disbursement error:', err);
    res.status(500).json({ error: 'Failed to disburse loan.' });
  }
});

// Super Admin Reject Loan
app.post('/api/admin/loans/:id/reject', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const loans = readCollection('loans');
    const users = readCollection('users');

    const loanIndex = loans.findIndex(l => l.id === id);
    if (loanIndex === -1) {
      return res.status(404).json({ error: 'Loan request not found.' });
    }

    const loan = loans[loanIndex];
    loan.status = 'REJECTED_SUPER_ADMIN';
    loan.rejection_reason = reason || 'Declined during Super Admin final review.';
    loan.timeline = loan.timeline || [];
    loan.timeline.push({
      status: 'REJECTED_SUPER_ADMIN',
      note: reason || 'Declined during Super Admin final review.',
      by_name: req.user.name,
      at: new Date().toISOString()
    });

    writeCollection('loans', loans);

    const member = users.find(u => u.id === loan.user_id);
    if (member) {
      await sendLoanRejectionEmail(member.email, member.name, loan, reason, 'Super Admin Final');
      createNotification(
        member.id,
        'LOAN_REJECTED',
        'Loan Application Declined',
        `Your loan application was declined by Super Admin. Reason: ${reason || 'Criteria not met.'}`,
        loan.id
      );
    }

    recordAudit(req.user.id, req.user.name, 'SUPER_ADMIN', 'REJECT_LOAN', `Rejected loan ${loan.id} - ${reason}`);
    res.json({ message: 'Loan rejected by Super Admin.', loan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject loan.' });
  }
});

// Super Admin Manual Exception Review for 5th Loan / Special Cases
// Requires: Super Admin Auth + Authorization + Reason + Explicit Approval + Audit Log
app.post('/api/admin/loans/override-exception', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const {
      member_id,
      amount,
      purpose = 'Super Admin Policy Exception Facility',
      repayment_frequency = 'WEEKLY',
      tenure_value = 10,
      payment_mode = 'BANK_TRANSFER',
      reason
    } = req.body;

    if (!member_id || !amount || !reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({ error: 'Mandatory fields: member_id, amount, and an explicit justification reason (min 10 characters).' });
    }

    const users = readCollection('users');
    const loans = readCollection('loans');

    const member = users.find(u => u.id === member_id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    if (!member.group_id) {
      return res.status(400).json({ error: 'Member is not assigned to an active group.' });
    }

    const activeLoans = getUserActiveLoans(member.id);
    if (activeLoans.length > 0) {
      return res.status(400).json({ error: 'Cannot grant exception: Member still has an active loan with an outstanding balance.' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0 || numAmount > 10000) {
      return res.status(400).json({ error: 'Loan amount must be between ₹1 and ₹10,000.' });
    }

    const completedLoansCount = loans.filter(l => l.user_id === member.id && isLoanCompleted(l)).length;
    const nextLoanSequence = completedLoansCount + 1;
    const applicationId = `APP-SA-EXC-${Math.floor(1000 + Math.random() * 9000)}`;
    const calc = calculateEmi(numAmount, 12, repayment_frequency, tenure_value);

    const newLoan = {
      id: uuidv4(),
      application_id: applicationId,
      loan_account_number: null,
      loan_sequence_number: nextLoanSequence,
      user_id: member.id,
      group_id: member.group_id,
      amount: numAmount,
      sanctioned_amount: null,
      purpose: purpose.trim(),
      annual_interest_rate: 12,
      interest_method: 'REDUCING_BALANCE',
      repayment_frequency,
      tenure_value: Number(tenure_value),
      tenure_unit: repayment_frequency === 'WEEKLY' ? 'Weeks' : 'Months',
      total_installments: calc.installments,
      installment_amount: calc.emi,
      total_interest: calc.totalInterest,
      total_repayment: calc.totalRepayment,
      payment_mode: payment_mode || 'UPI',
      upi_email: member.email,
      status: 'PENDING_SUPER_ADMIN',
      disbursement_status: 'NOT_DISBURSED',
      total_paid: 0,
      outstanding_balance: calc.totalRepayment,
      is_super_admin_exception: true,
      exception_reason: reason.trim(),
      exception_approved_by: req.user.name,
      exception_approved_by_id: req.user.id,
      requested_at: new Date().toISOString(),
      timeline: [
        {
          status: 'PENDING_SUPER_ADMIN',
          note: `Manual Super Admin policy exception initiated for Loan #${nextLoanSequence}. Reason: ${reason.trim()}`,
          by_name: req.user.name,
          at: new Date().toISOString()
        }
      ]
    };

    loans.unshift(newLoan);
    writeCollection('loans', loans);

    // Record formal audit log
    recordAudit(
      req.user.id,
      req.user.name,
      'SUPER_ADMIN',
      'SUPER_ADMIN_EXCEPTION_APPROVED',
      `Approved policy exception for member ${member.name} (${member.id}) for Loan #${nextLoanSequence} amount ₹${numAmount}. Justification: ${reason.trim()}`
    );

    createNotification(
      member.id,
      'LOAN_EXCEPTION_APPROVED',
      'Special Loan Exception Created | சிறப்பு கடன் அனுமதி',
      `A Super Admin policy exception was granted for Loan #${nextLoanSequence} (₹${numAmount}). Awaiting final sanction.`,
      newLoan.id
    );

    res.status(201).json({
      message: `Super Admin exception successfully created for Loan #${nextLoanSequence}.`,
      loan: newLoan
    });
  } catch (err) {
    console.error('Super Admin exception error:', err);
    res.status(500).json({ error: 'Failed to process exception review.' });
  }
});

// Broadcast announcement
app.post('/api/admin/announcements', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    const announcements = readCollection('announcements');
    const newAnnouncement = {
      id: uuidv4(),
      title: title.trim(),
      message: message.trim(),
      created_by: req.user.name,
      created_at: new Date().toISOString()
    };

    announcements.unshift(newAnnouncement);
    writeCollection('announcements', announcements);

    // Also notify all users
    const users = readCollection('users');
    users.forEach(u => {
      createNotification(u.id, 'ANNOUNCEMENT', title, message);
    });

    res.status(201).json({ message: 'Announcement broadcasted successfully.', announcement: newAnnouncement });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create announcement.' });
  }
});

// Update / Edit announcement (Super Admin only)
app.put('/api/admin/announcements/:id', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    const announcements = readCollection('announcements');
    const index = announcements.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    announcements[index].title = title.trim();
    announcements[index].message = message.trim();
    announcements[index].updated_at = new Date().toISOString();
    announcements[index].updated_by = req.user.name;

    writeCollection('announcements', announcements);
    recordAudit(req.user.id, req.user.name, 'SUPER_ADMIN', 'UPDATE_ANNOUNCEMENT', `Updated announcement: ${title}`);

    res.json({ message: 'Announcement updated successfully.', announcement: announcements[index] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update announcement.' });
  }
});

// Delete announcement (Super Admin only)
app.delete('/api/admin/announcements/:id', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const announcements = readCollection('announcements');
    const index = announcements.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    const deleted = announcements.splice(index, 1)[0];
    writeCollection('announcements', announcements);
    recordAudit(req.user.id, req.user.name, 'SUPER_ADMIN', 'DELETE_ANNOUNCEMENT', `Deleted announcement: ${deleted.title}`);

    res.json({ message: 'Announcement deleted successfully.', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete announcement.' });
  }
});

// Email outbox logs
app.get('/api/admin/email-logs', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const outbox = readCollection('email_outbox');
    const legacy = readCollection('emails');
    // Merge or return outbox
    res.json(outbox.length > 0 ? outbox : legacy);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch email logs.' });
  }
});

// Retry failed email
app.post('/api/admin/emails/:id/retry', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await retryEmail(id);
    res.json({ message: 'Email retry attempted.', result });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to retry email delivery.' });
  }
});

// ----------------- GROUP ADMIN ROUTES -----------------

app.get('/api/group-admin/my-group', authenticateToken, requireRole('GROUP_ADMIN', 'SUPER_ADMIN'), (req, res) => {
  try {
    const users = readCollection('users');
    const groups = readCollection('groups');

    let group = null;
    if (req.user.role === 'GROUP_ADMIN') {
      group = groups.find(g => g.group_admin_id === req.user.id || g.id === req.user.group_id);
    } else if (req.query.group_id) {
      group = groups.find(g => g.id === req.query.group_id);
    }

    if (!group) {
      return res.status(404).json({ error: 'No group assigned to this Group Admin.' });
    }

    const members = users
      .filter(u => u.group_id === group.id && u.status === 'APPROVED')
      .map(u => {
        const eligibility = getMemberLoanEligibility(u.id);
        return {
          id: u.id,
          name: u.name,
          phone: u.phone,
          email: u.email,
          role: u.role,
          area: u.area,
          district: u.district,
          created_at: u.created_at,
          repayment_score: eligibility.repaymentScore,
          completed_loans: eligibility.completedLoans,
          remaining_balance: eligibility.remainingBalance,
          eligibility: {
            eligible: eligibility.eligible,
            loanNumber: eligibility.loanNumber,
            reason: eligibility.reason,
            reasonTa: eligibility.reasonTa,
            statusCode: eligibility.statusCode,
            ratingCategory: eligibility.ratingCategory
          }
        };
      });

    res.json({ group, members });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group details.' });
  }
});

// Group Admin Analytics (Group-specific innovative chart metrics)
app.get('/api/group-admin/analytics', authenticateToken, requireRole('GROUP_ADMIN', 'SUPER_ADMIN'), (req, res) => {
  try {
    const loans = readCollection('loans');
    const repayments = readCollection('repayments');
    const groups = readCollection('groups');
    const users = readCollection('users');

    let targetGroupId = req.user.group_id;
    if (req.user.role === 'GROUP_ADMIN') {
      const g = groups.find(grp => grp.group_admin_id === req.user.id || grp.id === req.user.group_id);
      if (g) targetGroupId = g.id;
    }

    const groupLoans = loans.filter(l => l.group_id === targetGroupId);
    const groupMembers = users.filter(u => u.group_id === targetGroupId && u.status === 'APPROVED');

    // 1. Loan Status Distribution
    const statusCounts = {
      APPROVED: 0,
      DISBURSED: 0,
      COMPLETED: 0,
      PENDING_GROUP_ADMIN: 0,
      PENDING_SUPER_ADMIN: 0,
      REJECTED: 0
    };
    groupLoans.forEach(l => {
      if (statusCounts[l.status] !== undefined) statusCounts[l.status]++;
      else if (l.status.includes('REJECT') || l.status === 'DENIED_BY_USER') statusCounts.REJECTED++;
      else statusCounts.PENDING_SUPER_ADMIN++;
    });

    // 2. Member Repayment Leaderboard / Progress
    const memberRepayments = groupMembers.map(m => {
      const mLoans = groupLoans.filter(l => l.user_id === m.id);
      const totalSanctioned = mLoans.reduce((sum, l) => sum + (l.sanctioned_amount || l.amount || 0), 0);
      const totalPaid = mLoans.reduce((sum, l) => sum + (l.total_paid || 0), 0);
      const activeBalance = mLoans
        .filter(l => l.status === 'DISBURSED')
        .reduce((sum, l) => sum + Math.max(0, l.outstanding_balance || 0), 0);
      const activeRunningLoans = mLoans.filter(l => ['PENDING_GROUP_ADMIN', 'PENDING_SUPER_ADMIN', 'SANCTIONED', 'DISBURSED'].includes(l.status)).length;
      return {
        memberId: m.id,
        memberName: m.name,
        totalSanctioned,
        totalPaid,
        activeBalance,
        activeRunningLoans,
        repaymentRate: totalSanctioned > 0 ? Math.round((totalPaid / totalSanctioned) * 100) : 100
      };
    });

    // 3. Weekly vs Monthly Ratio for Group
    let weekly = 0;
    let monthly = 0;
    groupLoans.forEach(l => {
      if (l.repayment_frequency === 'MONTHLY') monthly++;
      else weekly++;
    });

    // 4. Cash vs UPI collected in Group
    const groupLoanIds = groupLoans.map(l => l.id);
    const groupReceipts = repayments.filter(r => groupLoanIds.includes(r.loan_id));
    let groupCash = 0;
    let groupUpi = 0;
    groupReceipts.forEach(r => {
      if (r.payment_method === 'CASH') groupCash += (r.amount || 0);
      else groupUpi += (r.amount || 0);
    });

    res.json({
      totalMembers: groupMembers.length,
      totalLoansCount: groupLoans.length,
      statusCounts,
      memberRepayments,
      weeklyVsMonthly: { weekly, monthly },
      cashVsUpi: { cash: groupCash, upi: groupUpi },
      totalCollected: groupCash + groupUpi,
      totalSanctioned: groupLoans.reduce((sum, l) => sum + (l.sanctioned_amount || l.amount || 0), 0)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group analytics.' });
  }
});

// Group loans for Group Admin
app.get('/api/group-admin/loans', authenticateToken, requireRole('GROUP_ADMIN', 'SUPER_ADMIN'), (req, res) => {
  try {
    const loans = readCollection('loans');
    const users = readCollection('users');
    const groups = readCollection('groups');

    let targetGroupId = req.user.group_id;
    if (req.user.role === 'GROUP_ADMIN') {
      const g = groups.find(grp => grp.group_admin_id === req.user.id || grp.id === req.user.group_id);
      if (g) targetGroupId = g.id;
    }

    const groupLoans = loans
      .filter(l => l.group_id === targetGroupId)
      .map(l => {
        const member = users.find(u => u.id === l.user_id);
        const userActiveLoans = getUserActiveLoans(l.user_id);
        const eligibility = getMemberLoanEligibility(l.user_id);
        return {
          ...l,
          member_name: member ? member.name : 'Unknown',
          member_email: member ? member.email : 'Unknown',
          member_phone: member ? member.phone : 'Unknown',
          user_active_loans_count: userActiveLoans.length,
          member_repayment_score: eligibility.repaymentScore,
          member_completed_loans: eligibility.completedLoans,
          member_remaining_balance: eligibility.remainingBalance,
          eligibility: {
            eligible: eligibility.eligible,
            loanNumber: eligibility.loanNumber,
            reason: eligibility.reason,
            reasonTa: eligibility.reasonTa,
            statusCode: eligibility.statusCode,
            ratingCategory: eligibility.ratingCategory
          }
        };
      });

    res.json(groupLoans);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group loan requests.' });
  }
});

// STEP 2: Group Admin Review & Forward to Super Admin
app.post('/api/group-admin/loans/:id/forward', authenticateToken, requireRole('GROUP_ADMIN', 'SUPER_ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const loans = readCollection('loans');
    const users = readCollection('users');

    const loanIndex = loans.findIndex(l => l.id === id);
    if (loanIndex === -1) {
      return res.status(404).json({ error: 'Loan request not found.' });
    }

    const loan = loans[loanIndex];
    if (loan.status !== 'PENDING_GROUP_ADMIN') {
      return res.status(400).json({ error: `Cannot forward loan with current status ${loan.status}.` });
    }

    loan.status = 'PENDING_SUPER_ADMIN';
    loan.timeline = loan.timeline || [];
    loan.timeline.push({
      status: 'PENDING_SUPER_ADMIN',
      note: 'Verified and recommended by Group Admin. Forwarded to Super Admin for final sanction.',
      by_name: req.user.name,
      at: new Date().toISOString()
    });

    writeCollection('loans', loans);

    const member = users.find(u => u.id === loan.user_id);
    if (member) {
      createNotification(
        member.id,
        'LOAN_FORWARDED',
        'Loan Verified by Group Admin | குழு நிர்வாகி பரிந்துரைத்துள்ளார்',
        `Your loan request has been recommended by your Group Admin and submitted to Super Admin for final sanction.`,
        loan.id
      );
    }

    recordAudit(req.user.id, req.user.name, 'GROUP_ADMIN', 'FORWARD_LOAN', `Forwarded loan ${loan.id} to Super Admin`);
    res.json({ message: 'Loan approved and forwarded to Super Admin for final sanction.', loan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to forward loan.' });
  }
});

// Group Admin Reject Loan
app.post('/api/group-admin/loans/:id/reject', authenticateToken, requireRole('GROUP_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const loans = readCollection('loans');
    const users = readCollection('users');

    const loanIndex = loans.findIndex(l => l.id === id);
    if (loanIndex === -1) {
      return res.status(404).json({ error: 'Loan request not found.' });
    }

    const loan = loans[loanIndex];
    loan.status = 'REJECTED_GROUP_ADMIN';
    loan.rejection_reason = reason || 'Declined during Group Admin preliminary assessment.';
    loan.timeline = loan.timeline || [];
    loan.timeline.push({
      status: 'REJECTED_GROUP_ADMIN',
      note: reason || 'Declined by Group Admin.',
      by_name: req.user.name,
      at: new Date().toISOString()
    });

    writeCollection('loans', loans);

    const member = users.find(u => u.id === loan.user_id);
    if (member) {
      await sendLoanRejectionEmail(member.email, member.name, loan, reason, 'Group Admin Preliminary');
      createNotification(
        member.id,
        'LOAN_REJECTED',
        'Loan Application Declined by Group Admin',
        `Your loan application was declined. Reason: ${reason || 'Assessment criteria not met.'}`,
        loan.id
      );
    }

    recordAudit(req.user.id, req.user.name, 'GROUP_ADMIN', 'REJECT_LOAN', `Rejected loan ${loan.id} - ${reason}`);
    res.json({ message: 'Loan rejected by Group Admin.', loan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject loan.' });
  }
});

// ----------------- MEMBER (USER) ROUTES -----------------

// Member Dashboard
app.get('/api/member/dashboard', authenticateToken, (req, res) => {
  try {
    const users = readCollection('users');
    const groups = readCollection('groups');
    const loans = readCollection('loans');
    const announcements = readCollection('announcements');

    const currentUser = users.find(u => u.id === req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let group = null;
    let groupAdmin = null;
    let fellowMembers = [];

    if (currentUser.group_id) {
      group = groups.find(g => g.id === currentUser.group_id) || null;
      if (group && group.group_admin_id) {
        const ga = users.find(u => u.id === group.group_admin_id);
        if (ga) {
          groupAdmin = {
            id: ga.id,
            name: ga.name,
            phone: ga.phone,
            email: ga.email
          };
        }
      }

      fellowMembers = users
        .filter(u => u.group_id === currentUser.group_id && u.status === 'APPROVED')
        .map(u => ({ id: u.id, name: u.name, role: u.role }));
    }

    const userLoans = loans
      .filter(l => l.user_id === currentUser.id)
      .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));

    // Active loans check (single active loan policy enforced)
    const activeLoans = getUserActiveLoans(currentUser.id);
    const activeLoan = activeLoans.length > 0 ? activeLoans[0] : null;

    // Calculate real-time authoritative loan eligibility
    const eligibility = getMemberLoanEligibility(currentUser.id);

    res.json({
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        area: currentUser.area,
        district: currentUser.district,
        role: currentUser.role,
        status: currentUser.status,
        repayment_score: eligibility.repaymentScore !== undefined ? eligibility.repaymentScore : (currentUser.repayment_score !== undefined ? currentUser.repayment_score : 100),
        total_overdue_days: currentUser.total_overdue_days || 0,
        total_penalties_incurred: currentUser.total_penalties_incurred || 0
      },
      group,
      groupAdmin,
      fellowMembers,
      loans: userLoans,
      activeLoan,
      activeLoans,
      activeLoansCount: activeLoans.length,
      eligibility,
      announcements
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load member dashboard.' });
  }
});

// Centralized Loan Eligibility API endpoint: GET /api/loans/eligibility
app.get('/api/loans/eligibility', authenticateToken, (req, res) => {
  try {
    const targetUserId = (req.query.userId && (req.user.role === 'GROUP_ADMIN' || req.user.role === 'SUPER_ADMIN'))
      ? req.query.userId
      : req.user.id;

    const eligibility = getMemberLoanEligibility(targetUserId);
    res.json(eligibility);
  } catch (err) {
    console.error('Eligibility check error:', err);
    res.status(500).json({ error: 'Failed to check loan eligibility.' });
  }
});

// Check Active Loan status specifically (enforcing Single Active Loan policy & eligibility)
app.get('/api/member/active-loan-check', authenticateToken, (req, res) => {
  try {
    const activeLoans = getUserActiveLoans(req.user.id);
    const count = activeLoans.length;
    const eligibility = getMemberLoanEligibility(req.user.id);

    res.json({
      hasActiveLoan: count > 0,
      activeLoansCount: count,
      canApplyMore: eligibility.eligible,
      eligibility,
      message: count > 0
        ? 'Please complete your current loan before applying for another loan.'
        : eligibility.eligible
          ? eligibility.reason
          : eligibility.reason,
      activeLoans: activeLoans.map(l => ({
        id: l.id,
        loan_account_number: l.loan_account_number || l.application_id || l.id,
        amount: l.amount,
        sanctioned_amount: l.sanctioned_amount || l.amount,
        total_paid: l.total_paid || 0,
        outstanding_balance: l.outstanding_balance !== undefined ? l.outstanding_balance : l.amount,
        repayment_frequency: l.repayment_frequency || 'WEEKLY',
        next_due_date: l.next_due_date || 'Upcoming',
        status: l.status
      })),
      loan: activeLoans[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check active loan status.' });
  }
});

// User Deny / Cancel Loan (Allowed only if not yet approved/sanctioned by Super Admin)
app.post('/api/member/loans/:id/deny', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by applicant' } = req.body;
    const loans = readCollection('loans');
    const users = readCollection('users');

    const loanIndex = loans.findIndex(l => l.id === id);
    if (loanIndex === -1) {
      return res.status(404).json({ error: 'Loan request not found.' });
    }

    const loan = loans[loanIndex];
    if (loan.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You can only cancel your own loan request.' });
    }

    // Business Rule: User can deny only if Super Admin has NOT approved/sanctioned/disbursed it yet
    const superAdminApprovedStatuses = ['SANCTIONED', 'DISBURSED', 'APPROVED', 'COMPLETED'];
    if (superAdminApprovedStatuses.includes(loan.status)) {
      return res.status(400).json({
        error: 'Cannot deny or cancel this loan because it has already been approved / sanctioned by Super Admin.'
      });
    }

    if (['REJECTED_GROUP_ADMIN', 'REJECTED_SUPER_ADMIN', 'DENIED_BY_USER', 'CANCELLED'].includes(loan.status)) {
      return res.status(400).json({ error: `Loan is already in status ${loan.status}.` });
    }

    loan.status = 'DENIED_BY_USER';
    loan.denied_reason = reason;
    loan.denied_at = new Date().toISOString();
    loan.timeline = loan.timeline || [];
    loan.timeline.push({
      status: 'DENIED_BY_USER',
      note: `Application denied/cancelled by user. Reason: ${reason}`,
      by_name: req.user.name,
      at: new Date().toISOString()
    });

    writeCollection('loans', loans);

    // Notify Group Admin
    const groups = readCollection('groups');
    const grp = groups.find(g => g.id === loan.group_id);
    if (grp && grp.group_admin_id) {
      createNotification(
        grp.group_admin_id,
        'LOAN_CANCELLED_BY_USER',
        'Loan Cancelled by User | பயனர் கடனை ரத்து செய்தார்',
        `${req.user.name} has cancelled/denied their loan application of ₹${loan.amount}.`,
        loan.id
      );
    }

    recordAudit(req.user.id, req.user.name, req.user.role, 'DENY_LOAN', `User cancelled loan ${loan.application_id || loan.id}`);

    res.json({
      message: 'Your loan request has been successfully cancelled.',
      loan
    });
  } catch (err) {
    console.error('Error denying loan:', err);
    res.status(500).json({ error: 'Failed to cancel loan request.' });
  }
});

// STEP 1: Apply for Loan (allowing up to 3 active loans running)
app.post('/api/member/loans', authenticateToken, (req, res) => {
  try {
    const {
      amount,
      purpose,
      repayment_frequency = 'WEEKLY',
      tenure_value = 10,
      payment_mode = 'UPI',
      upi_email,
      preferred_first_due_date,
      notes
    } = req.body;

    const users = readCollection('users');
    const loans = readCollection('loans');

    const currentUser = users.find(u => u.id === req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (currentUser.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Only approved members can request loans.' });
    }

    if (!currentUser.group_id) {
      return res.status(400).json({ error: 'You must be allocated to an SHG group before submitting a loan request.' });
    }

    // CORE BUSINESS RULE: Strict Server-Side Loan Eligibility Verification
    const eligibility = getMemberLoanEligibility(currentUser.id);
    if (!eligibility.eligible) {
      recordAudit(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        'LOAN_APPLICATION_BLOCKED',
        `Blocked loan application: ${eligibility.reason} (Score: ${eligibility.repaymentScore}, Completed: ${eligibility.completedLoans}, Status: ${eligibility.statusCode})`
      );
      return res.status(400).json({
        error: eligibility.reason,
        reasonTa: eligibility.reasonTa,
        eligibility
      });
    }

    // Sequence number strictly calculated by backend from actual history
    const backendLoanSequenceNumber = eligibility.loanNumber || (eligibility.completedLoans + 1);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid loan amount.' });
    }

    // ₹10,000 policy cap
    if (numAmount > 10000) {
      return res.status(400).json({ error: 'Maximum loan limit per request is ₹10,000 as per Magalir Kuzhu policy.' });
    }

    if (!['UPI', 'CASH'].includes(payment_mode)) {
      return res.status(400).json({ error: 'Payment mode must be either UPI or CASH.' });
    }

    // UPI verification check
    if (payment_mode === 'UPI') {
      if (!upi_email || typeof upi_email !== 'string') {
        return res.status(400).json({ error: 'UPI disbursal requires entering your registered email ID for verification.' });
      }
      if (upi_email.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
        return res.status(400).json({
          error: `UPI Verification Failed: The entered email does not match your registered email address (${currentUser.email}).`
        });
      }
    }

    const applicationId = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Live reducing-balance calculation estimate
    const calc = calculateEmi(numAmount, 12, repayment_frequency, tenure_value);

    const newLoan = {
      id: uuidv4(),
      application_id: applicationId,
      loan_account_number: null, // assigned on sanction
      loan_sequence_number: backendLoanSequenceNumber,
      user_id: currentUser.id,
      group_id: currentUser.group_id,
      amount: numAmount,
      sanctioned_amount: null,
      purpose: purpose ? purpose.trim() : 'Small Business & Family Welfare',
      annual_interest_rate: 12,
      interest_method: 'REDUCING_BALANCE',
      repayment_frequency,
      tenure_value: Number(tenure_value),
      tenure_unit: repayment_frequency === 'WEEKLY' ? 'Weeks' : 'Months',
      total_installments: calc.installments,
      installment_amount: calc.emi,
      total_interest: calc.totalInterest,
      total_repayment: calc.totalRepayment,
      payment_mode,
      upi_email: payment_mode === 'UPI' ? upi_email.trim().toLowerCase() : null,
      preferred_first_due_date: preferred_first_due_date || null,
      notes: notes ? notes.trim() : '',
      status: 'PENDING_GROUP_ADMIN',
      disbursement_status: 'NOT_DISBURSED',
      total_paid: 0,
      outstanding_balance: calc.totalRepayment,
      requested_at: new Date().toISOString(),
      timeline: [
        {
          status: 'PENDING_GROUP_ADMIN',
          note: `Loan application for ₹${numAmount} submitted (${repayment_frequency}, ${tenure_value} ${repayment_frequency === 'WEEKLY' ? 'weeks' : 'months'}). Awaiting Group Admin review.`,
          by_name: currentUser.name,
          at: new Date().toISOString()
        }
      ]
    };

    loans.unshift(newLoan);
    writeCollection('loans', loans);

    // Notify Group Admin
    const groups = readCollection('groups');
    const grp = groups.find(g => g.id === currentUser.group_id);
    if (grp && grp.group_admin_id) {
      createNotification(
        grp.group_admin_id,
        'NEW_LOAN_APPLICATION',
        'New Loan Application Submitted | புதிய கடன் விண்ணப்பம்',
        `${currentUser.name} has submitted a loan application of ₹${numAmount} for review.`,
        newLoan.id
      );
    }

    createNotification(
      currentUser.id,
      'LOAN_SUBMITTED',
      'Loan Application Submitted',
      'Your loan application has been submitted successfully and is awaiting Group Admin review.',
      newLoan.id
    );

    recordAudit(currentUser.id, currentUser.name, 'USER', 'APPLY_LOAN', `Submitted loan application ${applicationId} for ₹${numAmount}`);

    res.status(201).json({
      message: 'Your loan application has been submitted successfully and is awaiting Group Admin review.',
      loan: newLoan
    });
  } catch (err) {
    console.error('Loan submission error:', err);
    res.status(500).json({ error: 'Failed to submit loan application.' });
  }
});

// Group Admin Loan Request (Directly notifies Super Admin and sets status to PENDING_SUPER_ADMIN)
app.post('/api/group-admin/loans/apply', authenticateToken, requireRole('GROUP_ADMIN'), (req, res) => {
  try {
    const {
      amount,
      purpose,
      repayment_frequency = 'WEEKLY',
      tenure_value = 10,
      payment_mode = 'UPI',
      upi_email,
      preferred_first_due_date,
      notes
    } = req.body;

    const users = readCollection('users');
    const loans = readCollection('loans');
    const groups = readCollection('groups');

    const currentUser = users.find(u => u.id === req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!currentUser.group_id) {
      return res.status(400).json({ error: 'You must be associated with an SHG group.' });
    }

    // CORE BUSINESS RULE: Server-Side Loan Eligibility for Group Admin
    const eligibility = getMemberLoanEligibility(currentUser.id);
    if (!eligibility.eligible) {
      recordAudit(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        'LOAN_APPLICATION_BLOCKED',
        `Blocked Group Admin loan application: ${eligibility.reason} (Score: ${eligibility.repaymentScore}, Status: ${eligibility.statusCode})`
      );
      return res.status(400).json({
        error: eligibility.reason,
        reasonTa: eligibility.reasonTa,
        eligibility
      });
    }

    const backendLoanSequenceNumber = eligibility.loanNumber || (eligibility.completedLoans + 1);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid loan amount.' });
    }

    if (numAmount > 10000) {
      return res.status(400).json({ error: 'Maximum loan limit per request is ₹10,000 as per Magalir Kuzhu policy.' });
    }

    if (payment_mode === 'UPI') {
      if (!upi_email || upi_email.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
        return res.status(400).json({
          error: `UPI Verification: Email must match your registered email address (${currentUser.email}).`
        });
      }
    }

    const applicationId = `APP-GA-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const calc = calculateEmi(numAmount, 12, repayment_frequency, tenure_value);

    const newLoan = {
      id: uuidv4(),
      application_id: applicationId,
      loan_account_number: null,
      loan_sequence_number: backendLoanSequenceNumber,
      user_id: currentUser.id,
      group_id: currentUser.group_id,
      amount: numAmount,
      sanctioned_amount: null,
      purpose: purpose ? purpose.trim() : 'Group Admin Self-Help Enterprise',
      annual_interest_rate: 12,
      interest_method: 'REDUCING_BALANCE',
      repayment_frequency,
      tenure_value: Number(tenure_value),
      tenure_unit: repayment_frequency === 'WEEKLY' ? 'Weeks' : 'Months',
      total_installments: calc.installments,
      installment_amount: calc.emi,
      total_interest: calc.totalInterest,
      total_repayment: calc.totalRepayment,
      payment_mode,
      upi_email: payment_mode === 'UPI' ? upi_email.trim().toLowerCase() : null,
      preferred_first_due_date: preferred_first_due_date || null,
      notes: notes ? notes.trim() : '',
      status: 'PENDING_SUPER_ADMIN', // Directly to Super Admin
      disbursement_status: 'NOT_DISBURSED',
      total_paid: 0,
      outstanding_balance: calc.totalRepayment,
      requested_at: new Date().toISOString(),
      timeline: [
        {
          status: 'PENDING_SUPER_ADMIN',
          note: `Group Admin loan application of ₹${numAmount} submitted. Directly forwarded to Super Admin for sanction.`,
          by_name: currentUser.name,
          at: new Date().toISOString()
        }
      ]
    };

    loans.unshift(newLoan);
    writeCollection('loans', loans);

    // Directly notify all Super Admins
    const superAdmins = users.filter(u => u.role === 'SUPER_ADMIN');
    superAdmins.forEach(sa => {
      createNotification(
        sa.id,
        'GROUP_ADMIN_LOAN_APPLICATION',
        'Group Admin Loan Request Submitted | குழு தலைவர் கடன் விண்ணப்பம்',
        `Group Admin ${currentUser.name} has submitted a loan request for ₹${numAmount} directly for your sanction.`,
        newLoan.id
      );
    });

    createNotification(
      currentUser.id,
      'LOAN_SUBMITTED',
      'Loan Request Submitted to Super Admin',
      'Your loan request has been forwarded directly to the Super Admin for sanction.',
      newLoan.id
    );

    recordAudit(currentUser.id, currentUser.name, 'GROUP_ADMIN', 'APPLY_LOAN_DIRECT', `Submitted Group Admin loan application ${applicationId} for ₹${numAmount}`);

    res.status(201).json({
      message: 'Loan application submitted successfully and forwarded directly to Super Admin.',
      loan: newLoan
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit loan application.' });
  }
});

// ----------------- REPAYMENT & LEDGER ROUTES -----------------

// Record Repayment (by Group Admin - Super Admin can view only)
app.post('/api/repayments', authenticateToken, requireRole('GROUP_ADMIN'), async (req, res) => {
  try {
    const {
      loan_id,
      amount,
      payment_method = 'CASH',
      transaction_reference = '',
      payment_date = new Date().toISOString().split('T')[0],
      notes = ''
    } = req.body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid positive payment amount.' });
    }

    if (!['CASH', 'UPI'].includes(payment_method)) {
      return res.status(400).json({ error: 'Payment method must be CASH or UPI.' });
    }

    const loans = readCollection('loans');
    const users = readCollection('users');
    const repayments = readCollection('repayments');
    const schedules = readCollection('repayment_schedules');

    const loanIndex = loans.findIndex(l => l.id === loan_id);
    if (loanIndex === -1) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    const loan = loans[loanIndex];
    if (loan.status !== 'DISBURSED' && loan.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Repayments can only be recorded for disbursed loans.' });
    }

    const currentBalance = loan.outstanding_balance !== undefined ? loan.outstanding_balance : loan.amount;
    if (currentBalance <= 0) {
      return res.status(400).json({ error: 'This loan is already fully repaid!' });
    }

    if (numAmount > currentBalance + 0.05) {
      return res.status(400).json({ error: `Amount cannot exceed remaining balance of ₹${currentBalance}.` });
    }

    const member = users.find(u => u.id === loan.user_id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    // Allocate payment against schedule
    let schedule = loan.repayment_schedule || [];
    if (schedule.length === 0) {
      const savedSch = schedules.find(s => s.loan_id === loan.id);
      if (savedSch) schedule = savedSch.schedule;
    }

    const allocation = allocateRepayment(schedule, numAmount);

    // Update loan totals
    loan.total_paid = Math.round(((loan.total_paid || 0) + numAmount) * 100) / 100;
    loan.principal_paid = Math.round(((loan.principal_paid || 0) + allocation.allocatedPrincipal) * 100) / 100;
    loan.interest_paid = Math.round(((loan.interest_paid || 0) + allocation.allocatedInterest) * 100) / 100;
    loan.outstanding_balance = Math.max(0, Math.round((currentBalance - numAmount) * 100) / 100);
    loan.next_due_date = allocation.nextDueDate;
    loan.repayment_schedule = allocation.updatedSchedule;

    const isFullyRepaid = loan.outstanding_balance <= 0.01;
    if (isFullyRepaid) {
      loan.status = 'COMPLETED';
      loan.completed_at = new Date().toISOString();
    }

    // Unique Receipt Number: MK-RCP-YYYYMMDD-XXXX
    const datePart = payment_date.replace(/-/g, '');
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `MK-RCP-${datePart}-${randPart}`;

    const receipt = {
      id: uuidv4(),
      receipt_number: receiptNumber,
      loan_id: loan.id,
      loan_account_number: loan.loan_account_number || loan.id,
      member_id: member.id,
      member_name: member.name,
      amount: numAmount,
      payment_method,
      transaction_reference: payment_method === 'UPI' ? transaction_reference || 'N/A' : null,
      payment_date,
      total_paid: loan.total_paid,
      remaining_balance: loan.outstanding_balance,
      next_due_date: loan.next_due_date,
      recorded_by: req.user.name,
      recorded_by_id: req.user.id,
      notes,
      created_at: new Date().toISOString()
    };

    repayments.unshift(receipt);
    writeCollection('repayments', repayments);

    loan.timeline = loan.timeline || [];
    loan.timeline.push({
      status: isFullyRepaid ? 'COMPLETED' : 'REPAYMENT_RECORDED',
      note: `Repayment of ₹${numAmount} recorded via ${payment_method}. Receipt: ${receiptNumber}. Remaining balance: ₹${loan.outstanding_balance}.`,
      by_name: req.user.name,
      at: new Date().toISOString()
    });

    writeCollection('loans', loans);

    // Sync schedule collection
    const schIdx = schedules.findIndex(s => s.loan_id === loan.id);
    if (schIdx !== -1) {
      schedules[schIdx].schedule = allocation.updatedSchedule;
      writeCollection('repayment_schedules', schedules);
    }

    // Trigger required automated email notification to member's registered email
    let emailResult = null;
    if (payment_method === 'CASH') {
      emailResult = await sendCashRepaymentEmail(member.email, member.name, receipt);
    } else {
      emailResult = await sendUpiRepaymentEmail(member.email, member.name, receipt);
    }

    // In-app notification
    createNotification(
      member.id,
      'REPAYMENT_CONFIRMED',
      isFullyRepaid ? 'Loan Fully Repaid! 🎉 | கடன் முற்றிலும் செலுத்தப்பட்டது' : 'Repayment Recorded | தவணை பதிவு செய்யப்பட்டது',
      `Payment of ₹${numAmount} (${payment_method}) recorded. Receipt: ${receiptNumber}. Remaining: ₹${loan.outstanding_balance}.`,
      loan.id
    );

    // Recalculate Member Repayment Score and Eligibility in real-time
    const updatedEligibility = getMemberLoanEligibility(member.id);
    const memberIndex = users.findIndex(u => u.id === member.id);
    if (memberIndex !== -1) {
      const prevScore = users[memberIndex].repayment_score !== undefined ? users[memberIndex].repayment_score : 100;
      users[memberIndex].repayment_score = updatedEligibility.repaymentScore;
      writeCollection('users', users);

      if (prevScore !== updatedEligibility.repaymentScore) {
        recordAudit(
          req.user.id,
          req.user.name,
          req.user.role,
          'SCORE_CHANGED',
          `Repayment score updated for member ${member.name} (${member.id}) from ${prevScore} to ${updatedEligibility.repaymentScore}. Loan completion status: ${isFullyRepaid ? 'COMPLETED' : 'ACTIVE'}.`
        );
      }
    }

    recordAudit(req.user.id, req.user.name, req.user.role, 'RECORD_REPAYMENT', `Recorded ${payment_method} payment of ₹${numAmount} for loan ${loan.loan_account_number}`);

    res.json({
      message: `Repayment of ₹${numAmount} successfully recorded! Receipt ${receiptNumber} generated and dispatched to ${member.email}.`,
      receipt,
      loan,
      eligibility: updatedEligibility,
      emailResult
    });
  } catch (err) {
    console.error('Repayment error:', err);
    res.status(500).json({ error: 'Failed to record repayment.' });
  }
});

// Full Ledger and Repayment History for a Loan
app.get('/api/loans/:id/ledger', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const loans = readCollection('loans');
    const repayments = readCollection('repayments');
    const users = readCollection('users');

    const loan = loans.find(l => l.id === id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    // Privacy control: Member can only view their own loan
    if (req.user.role === 'USER' && loan.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You cannot view another member’s ledger.' });
    }

    const member = users.find(u => u.id === loan.user_id);
    const loanRepayments = repayments.filter(r => r.loan_id === loan.id);

    // Score visibility: Only visible to Super Admin and the particular loan owner
    const canViewScore = req.user.role === 'SUPER_ADMIN' || req.user.id === loan.user_id;
    const memberScore = (canViewScore && member)
      ? (member.repayment_score !== undefined ? member.repayment_score : 100)
      : null;

    res.json({
      loan,
      member: member ? {
        name: member.name,
        email: member.email,
        phone: member.phone,
        repayment_score: memberScore
      } : null,
      repayments: loanRepayments,
      schedule: loan.repayment_schedule || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch loan ledger.' });
  }
});

// ----------------- IN-APP NOTIFICATIONS ROUTES -----------------
app.get('/api/notifications', authenticateToken, (req, res) => {
  try {
    const notifications = readCollection('notifications');
    const userNotifs = notifications
      .filter(n => n.user_id === req.user.id)
      .slice(0, 30);
    const unreadCount = userNotifs.filter(n => !n.is_read).length;

    res.json({ notifications: userNotifs, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

app.post('/api/notifications/:id/read', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const notifications = readCollection('notifications');
    const notif = notifications.find(n => n.id === id && n.user_id === req.user.id);
    if (notif) {
      notif.is_read = true;
      writeCollection('notifications', notifications);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

app.post('/api/notifications/mark-all-read', authenticateToken, (req, res) => {
  try {
    const notifications = readCollection('notifications');
    notifications.forEach(n => {
      if (n.user_id === req.user.id) n.is_read = true;
    });
    writeCollection('notifications', notifications);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications read.' });
  }
});

// ----------------- GROUP CHAT ROUTES -----------------
app.get('/api/groups/:groupId/messages', authenticateToken, (req, res) => {
  try {
    const { groupId } = req.params;
    if (req.user.role !== 'SUPER_ADMIN' && req.user.group_id !== groupId) {
      return res.status(403).json({ error: 'Access forbidden: You do not have permission to view this group chat.' });
    }

    const messages = readCollection('messages');
    const groupMsgs = messages.filter(m => m.group_id === groupId);
    res.json(groupMsgs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

app.post('/api/groups/:groupId/messages', authenticateToken, (req, res) => {
  try {
    const { groupId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text cannot be empty.' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && req.user.group_id !== groupId) {
      return res.status(403).json({ error: 'Access forbidden: You are not a member of this group.' });
    }

    const messages = readCollection('messages');
    const newMsg = {
      id: uuidv4(),
      group_id: groupId,
      sender_id: req.user.id,
      sender_name: req.user.name,
      sender_role: req.user.role,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    messages.push(newMsg);
    writeCollection('messages', messages);
    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

app.delete('/api/groups/:groupId/messages/:messageId', authenticateToken, (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const messages = readCollection('messages');
    const msgIndex = messages.findIndex(m => m.id === messageId && m.group_id === groupId);

    if (msgIndex === -1) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    const msg = messages[msgIndex];

    // Allowed to delete:
    // 1. SUPER_ADMIN can delete any message
    // 2. GROUP_ADMIN of that group can delete any message in their group
    // 3. User who sent the message (sender_id === req.user.id) can delete their own message
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const isGroupAdmin = req.user.role === 'GROUP_ADMIN' && req.user.group_id === groupId;
    const isSender = msg.sender_id === req.user.id;

    if (!isSuperAdmin && !isGroupAdmin && !isSender) {
      return res.status(403).json({ error: 'Access forbidden: You can only delete messages sent by you.' });
    }

    messages.splice(msgIndex, 1);
    writeCollection('messages', messages);

    res.json({ success: true, messageId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

// ----------------- ANNOUNCEMENTS -----------------
app.get('/api/announcements', authenticateToken, (req, res) => {
  try {
    const announcements = readCollection('announcements');
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch announcements.' });
  }
});

// Serve built frontend assets
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Fallback to index.html for client-side routing on non-API routes (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(404).send('Frontend not built. Please run "npm run build" in the client directory.');
    }
  });
});

// ----------------- DAILY REPAYMENT & SCORE CHECK API -----------------
app.post('/api/admin/run-daily-check', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const { date } = req.body;
    const result = runDailyRepaymentCheck(date || null);
    res.json({
      success: true,
      result
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to run daily repayment check.' });
  }
});

// ----------------- SERVER START -----------------
app.listen(PORT, () => {
  console.log(`[SERVER] Magalir Kuzhu Portal Combined Server running on port ${PORT}`);
  console.log(`[SERVER] Serving API on /api and Frontend on http://localhost:${PORT}`);

  // Run daily check on server boot
  setTimeout(() => {
    console.log('[SCHEDULER] Running initial daily repayment and score check...');
    runDailyRepaymentCheck();
  }, 3000);

  // Set recurring daily interval (24 hours: 24 * 60 * 60 * 1000 ms)
  setInterval(() => {
    console.log('[SCHEDULER] Running daily scheduled repayment check...');
    runDailyRepaymentCheck();
  }, 24 * 60 * 60 * 1000);
});


