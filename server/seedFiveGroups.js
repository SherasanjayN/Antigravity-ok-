/**
 * Seed Script: 5 SHG Groups with 5 Members Each (25 members + 5 Group Admins)
 * - All accounts assigned password: "user123"
 * - Realistic Tamil Nadu SHG names, districts, phone numbers, and member roles
 * - Diverse loan scenarios:
 *   1. Normal Active Loan with regular repayments
 *   2. Overdue Loan with penalties and fines calculated
 *   3. 3 Completed Loans with score >= 95 -> Eligible for Loan #4
 *   4. 3 Completed Loans with score < 95 -> NOT eligible for Loan #4
 *   5. 4 Completed Loans -> 5th Loan blocked under standard policy
 * - Synced into both server/data JSON files and MongoDB
 */

const bcrypt = require('./node_modules/bcryptjs');
const { MongoClient } = require('./node_modules/mongodb');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { generateRepaymentSchedule, calculateEmi } = require('./loanCalculations');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/magalir_kuzhu';
const DB_NAME = process.env.DB_NAME || 'magalir_kuzhu';

async function seedData() {
  console.log('🌱 Starting comprehensive seed generation...');
  const salt = bcrypt.genSaltSync(10);
  const userPasswordHash = bcrypt.hashSync('user123', salt);

  // Group definitions across Tamil Nadu
  const groupDefs = [
    {
      id: 'grp-chn-01',
      group_name: 'Mylapore Mahasakthi Kuzhu',
      area: 'Mylapore',
      district: 'Chennai',
      admin: { name: 'Kavitha Murugan', email: 'kavitha.admin@magalir.org', phone: '9840112233' },
      members: [
        { name: 'Lakshmi Raman', email: 'lakshmi.m1@magalir.org', phone: '9840998811', area: 'Mylapore', scenario: '4TH_LOAN_QUALIFIED' },
        { name: 'Priya Sundaram', email: 'priya.m2@magalir.org', phone: '9840998812', area: 'Mandaveli', scenario: 'OVERDUE_WITH_FINE' },
        { name: 'Revathi Natarajan', email: 'revathi.m3@magalir.org', phone: '9840998813', area: 'Mylapore', scenario: 'ACTIVE_NORMAL' },
        { name: 'Geetha Balan', email: 'geetha.m4@magalir.org', phone: '9840998814', area: 'Alwarpet', scenario: '4TH_LOAN_LOW_SCORE' },
        { name: 'Shanthi Saravanan', email: 'shanthi.m5@magalir.org', phone: '9840998815', area: 'Mylapore', scenario: 'COMPLETED_MAX_4' }
      ]
    },
    {
      id: 'grp-cbe-02',
      group_name: 'Marutham Magalir Kuzhu',
      area: 'Gandhipuram',
      district: 'Coimbatore',
      admin: { name: 'Selvi Karuppasamy', email: 'selvi.admin@magalir.org', phone: '9842113344' },
      members: [
        { name: 'Anitha Velusamy', email: 'anitha.m1@magalir.org', phone: '9842998821', area: 'Gandhipuram', scenario: 'ACTIVE_NORMAL' },
        { name: 'Deepa Senthil', email: 'deepa.m2@magalir.org', phone: '9842998822', area: 'R.S. Puram', scenario: 'OVERDUE_WITH_FINE' },
        { name: 'Saranya Mohan', email: 'saranya.m3@magalir.org', phone: '9842998823', area: 'Peelamedu', scenario: '4TH_LOAN_QUALIFIED' },
        { name: 'Bhuvaneswari Palani', email: 'bhuvi.m4@magalir.org', phone: '9842998824', area: 'Saibaba Colony', scenario: 'CLEARED_FIRST_LOAN' },
        { name: 'Radha Kannan', email: 'radha.m5@magalir.org', phone: '9842998825', area: 'Gandhipuram', scenario: 'COMPLETED_MAX_4' }
      ]
    },
    {
      id: 'grp-mdu-03',
      group_name: 'Meenakshi Amman Kuzhu',
      area: 'Simmakkal',
      district: 'Madurai',
      admin: { name: 'Meenakshi Sundaram', email: 'meenakshi.admin@magalir.org', phone: '9843114455' },
      members: [
        { name: 'Karpagam Muthu', email: 'karpagam.m1@magalir.org', phone: '9843998831', area: 'Simmakkal', scenario: '4TH_LOAN_QUALIFIED' },
        { name: 'Alagammai Ramar', email: 'alagammai.m2@magalir.org', phone: '9843998832', area: 'Goripalayam', scenario: 'OVERDUE_WITH_FINE' },
        { name: 'Valli Perumal', email: 'valli.m3@magalir.org', phone: '9843998833', area: 'Teppakulam', scenario: 'ACTIVE_NORMAL' },
        { name: 'Kanimozhi Pandian', email: 'kanimozhi.m4@magalir.org', phone: '9843998834', area: 'Tallakulam', scenario: '4TH_LOAN_LOW_SCORE' },
        { name: 'Chitra Subramanian', email: 'chitra.m5@magalir.org', phone: '9843998835', area: 'Simmakkal', scenario: 'CLEARED_FIRST_LOAN' }
      ]
    },
    {
      id: 'grp-try-04',
      group_name: 'Kaveri Thaimagal Kuzhu',
      area: 'Thillai Nagar',
      district: 'Trichy',
      admin: { name: 'Thilagavathi Ganesan', email: 'thilaga.admin@magalir.org', phone: '9844115566' },
      members: [
        { name: 'Kalaiselvi Rajan', email: 'kalai.m1@magalir.org', phone: '9844998841', area: 'Thillai Nagar', scenario: 'CLEARED_FIRST_LOAN' },
        { name: 'Banumathi Durai', email: 'banu.m2@magalir.org', phone: '9844998842', area: 'Srirangam', scenario: 'OVERDUE_WITH_FINE' },
        { name: 'Saraswathi Bose', email: 'saras.m3@magalir.org', phone: '9844998843', area: 'Woraiyur', scenario: '4TH_LOAN_QUALIFIED' },
        { name: 'Vijaya Lakshmi', email: 'vijaya.m4@magalir.org', phone: '9844998844', area: 'Ponmalai', scenario: 'ACTIVE_NORMAL' },
        { name: 'Mallika Dharmaraj', email: 'mallika.m5@magalir.org', phone: '9844998845', area: 'Thillai Nagar', scenario: 'COMPLETED_MAX_4' }
      ]
    },
    {
      id: 'grp-slm-05',
      group_name: 'Mangalam Magalir Kuzhu',
      area: 'Fairlands',
      district: 'Salem',
      admin: { name: 'Poongothai Marimuthu', email: 'poongo.admin@magalir.org', phone: '9845116677' },
      members: [
        { name: 'Manimegalai Sivam', email: 'mani.m1@magalir.org', phone: '9845998851', area: 'Fairlands', scenario: '4TH_LOAN_QUALIFIED' },
        { name: 'Kokila Govind', email: 'kokila.m2@magalir.org', phone: '9845998852', area: 'Hasthampatti', scenario: 'OVERDUE_WITH_FINE' },
        { name: 'Parvathi Mani', email: 'parvathi.m3@magalir.org', phone: '9845998853', area: 'Suramangalam', scenario: 'ACTIVE_NORMAL' },
        { name: 'Nithya Shankar', email: 'nithya.m4@magalir.org', phone: '9845998854', area: 'Ammapet', scenario: '4TH_LOAN_LOW_SCORE' },
        { name: 'Suseela Murugesan', email: 'suseela.m5@magalir.org', phone: '9845998855', area: 'Fairlands', scenario: 'CLEARED_FIRST_LOAN' }
      ]
    }
  ];

  const allUsers = [];
  const allGroups = [];
  const allLoans = [];
  const allRepayments = [];
  const allSchedules = [];
  const allDailyPenalties = [];
  const allNotifications = [];

  // Super Admin Account
  const superAdmin = {
    id: 'super-admin-01',
    name: 'Super Admin',
    phone: '9876543210',
    email: 'sherasanjayn@gmail.com',
    password_hash: userPasswordHash, // user123
    area: 'HQ Central',
    district: 'Chennai',
    status: 'APPROVED',
    role: 'SUPER_ADMIN',
    group_id: null,
    created_at: '2026-01-01T00:00:00.000Z'
  };
  allUsers.push(superAdmin);

  for (const g of groupDefs) {
    const adminId = `usr-admin-${g.id}`;
    const groupAdminUser = {
      id: adminId,
      name: g.admin.name,
      phone: g.admin.phone,
      email: g.admin.email,
      password_hash: userPasswordHash, // user123
      area: g.area,
      district: g.district,
      status: 'APPROVED',
      role: 'GROUP_ADMIN',
      group_id: g.id,
      created_at: '2026-01-01T00:00:00.000Z'
    };
    allUsers.push(groupAdminUser);

    allGroups.push({
      id: g.id,
      group_name: g.group_name,
      area: g.area,
      district: g.district,
      group_admin_id: adminId,
      created_at: '2026-01-01T00:00:00.000Z'
    });

    // 5 Members per group
    for (let i = 0; i < g.members.length; i++) {
      const mDef = g.members[i];
      const memberId = `usr-${g.id}-m${i + 1}`;
      let initialScore = 100;
      let overdueDaysTotal = 0;
      let penaltiesTotal = 0;

      // Build loan histories based on scenario
      if (mDef.scenario === '4TH_LOAN_QUALIFIED') {
        // 3 completed loans, perfect repayment, balance = 0, score = 98 -> Eligible for Loan #4
        initialScore = 98;
        for (let lNum = 1; lNum <= 3; lNum++) {
          const loanId = `ln-${memberId}-0${lNum}`;
          const amt = lNum === 1 ? 5000 : lNum === 2 ? 7000 : 10000;
          const schData = generateRepaymentSchedule(amt, 12, 'WEEKLY', 10, `2026-0${lNum * 2}-01`, loanId);
          // mark schedule all paid
          schData.schedule.forEach(inst => {
            inst.status = 'PAID';
            inst.paidAmount = inst.expectedAmount;
            inst.remainingAmount = 0;
          });

          allLoans.push({
            id: loanId,
            application_id: `APP-2026-${1000 + Math.floor(Math.random() * 8999)}`,
            loan_account_number: `MK-LN-2026-${1000 + lNum * 100 + i}`,
            loan_sequence_number: lNum,
            user_id: memberId,
            group_id: g.id,
            amount: amt,
            sanctioned_amount: amt,
            purpose: 'Organic Food Cart & Tailoring Expansion',
            annual_interest_rate: 12,
            interest_method: 'REDUCING_BALANCE',
            repayment_frequency: 'WEEKLY',
            tenure_value: 10,
            tenure_unit: 'Weeks',
            total_installments: 10,
            installment_amount: schData.calc.emi,
            total_interest: schData.calc.totalInterest,
            total_repayment: schData.calc.totalRepayment,
            payment_mode: 'UPI',
            upi_email: mDef.email,
            status: 'COMPLETED',
            disbursement_status: 'DISBURSED',
            total_paid: schData.calc.totalRepayment,
            outstanding_balance: 0,
            requested_at: `2026-0${lNum * 2}-01T10:00:00.000Z`,
            sanctioned_at: `2026-0${lNum * 2}-02T10:00:00.000Z`,
            completed_at: `2026-0${lNum * 2 + 1}-15T10:00:00.000Z`,
            repayment_schedule: schData.schedule
          });
          allSchedules.push({ loan_id: loanId, schedule: schData.schedule });
        }
      } else if (mDef.scenario === 'OVERDUE_WITH_FINE') {
        // Loan with active overdue days, late penalty fine (₹50/day), score reduced to 86
        initialScore = 86;
        overdueDaysTotal = 14;
        penaltiesTotal = 700; // 14 * ₹50

        const loanId = `ln-${memberId}-overdue`;
        const amt = 6000;
        const schData = generateRepaymentSchedule(amt, 12, 'WEEKLY', 10, '2026-09-01', loanId);

        // Mark first 3 paid, inst 4 & 5 overdue with fine
        schData.schedule.forEach((inst, idx) => {
          if (idx < 3) {
            inst.status = 'PAID';
            inst.paidAmount = inst.expectedAmount;
            inst.remainingAmount = 0;
          } else if (idx === 3) {
            inst.status = 'OVERDUE';
            inst.due_date = '2026-10-10';
            inst.overdueDays = 14;
            inst.penaltyAmount = 700; // ₹50 * 14 days
            inst.paidAmount = 0;
            inst.remainingAmount = inst.expectedAmount;
          } else {
            inst.status = 'UPCOMING';
            inst.paidAmount = 0;
            inst.remainingAmount = inst.expectedAmount;
          }
        });

        const paidSoFar = Math.round(schData.schedule[0].expectedAmount * 3 * 100) / 100;
        const remainingBal = Math.round((schData.calc.totalRepayment - paidSoFar) * 100) / 100;

        allLoans.push({
          id: loanId,
          application_id: `APP-2026-${2000 + i}`,
          loan_account_number: `MK-LN-2026-${3000 + i}`,
          loan_sequence_number: 1,
          user_id: memberId,
          group_id: g.id,
          amount: amt,
          sanctioned_amount: amt,
          purpose: 'Dairy Cattle Feed & Livestock Care',
          annual_interest_rate: 12,
          interest_method: 'REDUCING_BALANCE',
          repayment_frequency: 'WEEKLY',
          tenure_value: 10,
          tenure_unit: 'Weeks',
          total_installments: 10,
          installment_amount: schData.calc.emi,
          total_interest: schData.calc.totalInterest,
          total_repayment: schData.calc.totalRepayment,
          payment_mode: 'CASH',
          status: 'DISBURSED',
          disbursement_status: 'DISBURSED',
          total_paid: paidSoFar,
          outstanding_balance: remainingBal,
          overdue_days: 14,
          penalty_amount: 700,
          requested_at: '2026-09-01T10:00:00.000Z',
          sanctioned_at: '2026-09-02T10:00:00.000Z',
          disbursed_at: '2026-09-03T10:00:00.000Z',
          repayment_schedule: schData.schedule
        });
        allSchedules.push({ loan_id: loanId, schedule: schData.schedule });

        // Record daily penalty records (14 days = 14 penalties * ₹50 = ₹700, -14 score)
        for (let d = 1; d <= 14; d++) {
          const dateStr = `2026-10-${d < 10 ? '0' + d : d}`;
          allDailyPenalties.push({
            id: `pen_${loanId}_inst_4_${dateStr}`,
            userId: memberId,
            loanId,
            repaymentId: `${loanId}_inst_4`,
            date: dateStr,
            frequency: 'WEEKLY',
            dueDate: '2026-10-10',
            overdueDays: d,
            penaltyAmount: 50,
            totalAccumulatedPenalty: d * 50,
            scorePenalty: 1,
            remainingPrincipal: schData.schedule[3].expectedAmount,
            createdAt: new Date().toISOString()
          });
        }

        allNotifications.push({
          id: uuidv4(),
          user_id: memberId,
          type: 'REPAYMENT_OVERDUE',
          title: '⚠️ Repayment Overdue / தவணை நிலுவை அறிவிப்பு',
          message: `Your ₹${schData.schedule[3].expectedAmount} installment is 14 days overdue. Pending Amount: ₹${schData.schedule[3].expectedAmount}, Late Penalty: ₹700, Total Outstanding: ₹${schData.schedule[3].expectedAmount + 700}.`,
          related_loan_id: loanId,
          is_read: false,
          created_at: new Date().toISOString()
        });
      } else if (mDef.scenario === 'ACTIVE_NORMAL') {
        // Current active loan, 0 overdue, prompt on-time payer, balance ₹3,000
        initialScore = 100;
        const loanId = `ln-${memberId}-active`;
        const amt = 5000;
        const schData = generateRepaymentSchedule(amt, 12, 'WEEKLY', 10, '2026-10-01', loanId);

        schData.schedule.forEach((inst, idx) => {
          if (idx < 4) {
            inst.status = 'PAID';
            inst.paidAmount = inst.expectedAmount;
            inst.remainingAmount = 0;
          } else {
            inst.status = 'UPCOMING';
            inst.paidAmount = 0;
            inst.remainingAmount = inst.expectedAmount;
          }
        });

        const paidSoFar = Math.round(schData.schedule[0].expectedAmount * 4 * 100) / 100;
        const remainingBal = Math.max(0, Math.round((schData.calc.totalRepayment - paidSoFar) * 100) / 100);

        allLoans.push({
          id: loanId,
          application_id: `APP-2026-${3000 + i}`,
          loan_account_number: `MK-LN-2026-${4000 + i}`,
          loan_sequence_number: 1,
          user_id: memberId,
          group_id: g.id,
          amount: amt,
          sanctioned_amount: amt,
          purpose: 'Handicraft & Brass Ware Procurement',
          annual_interest_rate: 12,
          interest_method: 'REDUCING_BALANCE',
          repayment_frequency: 'WEEKLY',
          tenure_value: 10,
          tenure_unit: 'Weeks',
          total_installments: 10,
          installment_amount: schData.calc.emi,
          total_interest: schData.calc.totalInterest,
          total_repayment: schData.calc.totalRepayment,
          payment_mode: 'UPI',
          upi_email: mDef.email,
          status: 'DISBURSED',
          disbursement_status: 'DISBURSED',
          total_paid: paidSoFar,
          outstanding_balance: remainingBal,
          requested_at: '2026-10-01T10:00:00.000Z',
          sanctioned_at: '2026-10-02T10:00:00.000Z',
          disbursed_at: '2026-10-03T10:00:00.000Z',
          repayment_schedule: schData.schedule
        });
        allSchedules.push({ loan_id: loanId, schedule: schData.schedule });
      } else if (mDef.scenario === '4TH_LOAN_LOW_SCORE') {
        // 3 completed loans, but score = 88 (< 95) due to past 12 late payment days -> NOT eligible for 4th loan
        initialScore = 88;
        overdueDaysTotal = 12;

        for (let lNum = 1; lNum <= 3; lNum++) {
          const loanId = `ln-${memberId}-0${lNum}`;
          const amt = 5000;
          const schData = generateRepaymentSchedule(amt, 12, 'WEEKLY', 10, `2026-0${lNum * 2}-01`, loanId);
          schData.schedule.forEach(inst => {
            inst.status = 'PAID';
            inst.paidAmount = inst.expectedAmount;
            inst.remainingAmount = 0;
          });

          allLoans.push({
            id: loanId,
            application_id: `APP-2026-${4000 + lNum * 100 + i}`,
            loan_account_number: `MK-LN-2026-${5000 + lNum * 100 + i}`,
            loan_sequence_number: lNum,
            user_id: memberId,
            group_id: g.id,
            amount: amt,
            sanctioned_amount: amt,
            purpose: 'Pottery & Clay Product Production',
            annual_interest_rate: 12,
            interest_method: 'REDUCING_BALANCE',
            repayment_frequency: 'WEEKLY',
            tenure_value: 10,
            tenure_unit: 'Weeks',
            total_installments: 10,
            installment_amount: schData.calc.emi,
            total_interest: schData.calc.totalInterest,
            total_repayment: schData.calc.totalRepayment,
            payment_mode: 'UPI',
            upi_email: mDef.email,
            status: 'COMPLETED',
            disbursement_status: 'DISBURSED',
            total_paid: schData.calc.totalRepayment,
            outstanding_balance: 0,
            requested_at: `2026-0${lNum * 2}-01T10:00:00.000Z`,
            sanctioned_at: `2026-0${lNum * 2}-02T10:00:00.000Z`,
            completed_at: `2026-0${lNum * 2 + 1}-15T10:00:00.000Z`,
            repayment_schedule: schData.schedule
          });
          allSchedules.push({ loan_id: loanId, schedule: schData.schedule });
        }

        // 12 penalties past history
        for (let d = 1; d <= 12; d++) {
          allDailyPenalties.push({
            id: `pen_${memberId}_hist_${d}`,
            userId: memberId,
            loanId: `ln-${memberId}-01`,
            repaymentId: `ln-${memberId}-01_inst_${(d % 5) + 1}`,
            date: `2026-03-${d < 10 ? '0' + d : d}`,
            overdueDays: d,
            penaltyAmount: 50,
            totalAccumulatedPenalty: d * 50,
            scorePenalty: 1,
            createdAt: new Date().toISOString()
          });
        }
      } else if (mDef.scenario === 'COMPLETED_MAX_4') {
        // 4 completed loans, score = 100, balance = 0 -> 5th Loan NOT allowed under standard policy
        initialScore = 100;
        for (let lNum = 1; lNum <= 4; lNum++) {
          const loanId = `ln-${memberId}-0${lNum}`;
          const amt = lNum * 2500;
          const schData = generateRepaymentSchedule(amt, 12, 'WEEKLY', 8, `2026-0${lNum}-01`, loanId);
          schData.schedule.forEach(inst => {
            inst.status = 'PAID';
            inst.paidAmount = inst.expectedAmount;
            inst.remainingAmount = 0;
          });

          allLoans.push({
            id: loanId,
            application_id: `APP-2026-${6000 + lNum * 100 + i}`,
            loan_account_number: `MK-LN-2026-${7000 + lNum * 100 + i}`,
            loan_sequence_number: lNum,
            user_id: memberId,
            group_id: g.id,
            amount: amt,
            sanctioned_amount: amt,
            purpose: 'Textile Wholesale & Handloom Yarn',
            annual_interest_rate: 12,
            interest_method: 'REDUCING_BALANCE',
            repayment_frequency: 'WEEKLY',
            tenure_value: 8,
            tenure_unit: 'Weeks',
            total_installments: 8,
            installment_amount: schData.calc.emi,
            total_interest: schData.calc.totalInterest,
            total_repayment: schData.calc.totalRepayment,
            payment_mode: 'UPI',
            upi_email: mDef.email,
            status: 'COMPLETED',
            disbursement_status: 'DISBURSED',
            total_paid: schData.calc.totalRepayment,
            outstanding_balance: 0,
            requested_at: `2026-0${lNum}-01T10:00:00.000Z`,
            sanctioned_at: `2026-0${lNum}-02T10:00:00.000Z`,
            completed_at: `2026-0${lNum + 1}-01T10:00:00.000Z`,
            repayment_schedule: schData.schedule
          });
          allSchedules.push({ loan_id: loanId, schedule: schData.schedule });
        }
      } else if (mDef.scenario === 'CLEARED_FIRST_LOAN') {
        // 1 completed loan, 0 active balance, eligible for Loan #2
        initialScore = 100;
        const loanId = `ln-${memberId}-01`;
        const amt = 5000;
        const schData = generateRepaymentSchedule(amt, 12, 'WEEKLY', 10, '2026-05-01', loanId);
        schData.schedule.forEach(inst => {
          inst.status = 'PAID';
          inst.paidAmount = inst.expectedAmount;
          inst.remainingAmount = 0;
        });

        allLoans.push({
          id: loanId,
          application_id: `APP-2026-${8000 + i}`,
          loan_account_number: `MK-LN-2026-${9000 + i}`,
          loan_sequence_number: 1,
          user_id: memberId,
          group_id: g.id,
          amount: amt,
          sanctioned_amount: amt,
          purpose: 'Small Flower Shop & Puja Articles',
          annual_interest_rate: 12,
          interest_method: 'REDUCING_BALANCE',
          repayment_frequency: 'WEEKLY',
          tenure_value: 10,
          tenure_unit: 'Weeks',
          total_installments: 10,
          installment_amount: schData.calc.emi,
          total_interest: schData.calc.totalInterest,
          total_repayment: schData.calc.totalRepayment,
          payment_mode: 'UPI',
          upi_email: mDef.email,
          status: 'COMPLETED',
          disbursement_status: 'DISBURSED',
          total_paid: schData.calc.totalRepayment,
          outstanding_balance: 0,
          requested_at: '2026-05-01T10:00:00.000Z',
          sanctioned_at: '2026-05-02T10:00:00.000Z',
          completed_at: '2026-07-15T10:00:00.000Z',
          repayment_schedule: schData.schedule
        });
        allSchedules.push({ loan_id: loanId, schedule: schData.schedule });
      }

      const memberUser = {
        id: memberId,
        name: mDef.name,
        phone: mDef.phone,
        email: mDef.email,
        password_hash: userPasswordHash, // user123
        area: mDef.area,
        district: g.district,
        status: 'APPROVED',
        role: 'USER',
        group_id: g.id,
        repayment_score: initialScore,
        total_overdue_days: overdueDaysTotal,
        total_penalties_incurred: penaltiesTotal,
        created_at: '2026-01-01T00:00:00.000Z'
      };
      allUsers.push(memberUser);
    }
  }

  // 1. Write to server/data/*.json
  const dataDir = path.join(__dirname, 'data');
  fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(allUsers, null, 2));
  fs.writeFileSync(path.join(dataDir, 'groups.json'), JSON.stringify(allGroups, null, 2));
  fs.writeFileSync(path.join(dataDir, 'loans.json'), JSON.stringify(allLoans, null, 2));
  fs.writeFileSync(path.join(dataDir, 'repayments.json'), JSON.stringify(allRepayments, null, 2));
  fs.writeFileSync(path.join(dataDir, 'repayment_schedules.json'), JSON.stringify(allSchedules, null, 2));
  fs.writeFileSync(path.join(dataDir, 'daily_penalties.json'), JSON.stringify(allDailyPenalties, null, 2));
  fs.writeFileSync(path.join(dataDir, 'notifications.json'), JSON.stringify(allNotifications, null, 2));
  console.log('✅ JSON backup files successfully updated in server/data/');

  // 2. Sync to MongoDB
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    const collections = [
      { name: 'users', data: allUsers },
      { name: 'groups', data: allGroups },
      { name: 'loans', data: allLoans },
      { name: 'repayments', data: allRepayments },
      { name: 'repayment_schedules', data: allSchedules },
      { name: 'daily_penalties', data: allDailyPenalties },
      { name: 'notifications', data: allNotifications }
    ];

    for (const c of collections) {
      const coll = db.collection(c.name);
      await coll.deleteMany({});
      if (c.data.length > 0) {
        await coll.insertMany(c.data.map(item => ({ ...item })));
      }
      console.log(`✅ MongoDB collection '${c.name}' updated with ${c.data.length} records.`);
    }

    await client.close();
    console.log('🎉 MongoDB sync finished successfully!');
  } catch (err) {
    console.error('⚠️ MongoDB sync note (files still active):', err.message);
  }

  console.log(`\n🎉 SEED SUMMARY:`);
  console.log(`- Total Groups: ${allGroups.length}`);
  console.log(`- Total Users: ${allUsers.length} (1 Super Admin + 5 Group Admins + 25 Members)`);
  console.log(`- Total Loans: ${allLoans.length}`);
  console.log(`- Total Daily Overdue Penalties Tracked: ${allDailyPenalties.length}`);
  console.log(`- All Passwords Set To: "user123"`);
}

seedData();
