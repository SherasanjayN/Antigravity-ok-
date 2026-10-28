/**
 * Magalir Kuzhu Loan Financial Calculations
 * Standard Reducing-Balance EMI Formula and Schedule Generation
 */

function calculateEmi(principal, annualRate, frequency = 'WEEKLY', tenureUnits = 10) {
  const P = Number(principal);
  const R = Number(annualRate);
  const N = Math.max(1, Math.round(Number(tenureUnits)));

  if (isNaN(P) || P <= 0) return { emi: 0, totalInterest: 0, totalRepayment: 0, installments: N };

  if (isNaN(R) || R <= 0) {
    const rawEmi = Math.round((P / N) * 100) / 100;
    return {
      emi: rawEmi,
      totalInterest: 0,
      totalRepayment: P,
      installments: N,
      periodicRate: 0
    };
  }

  // Periodic interest rate
  const r = frequency === 'MONTHLY' 
    ? (R / 100) / 12 
    : (R / 100) / 52;

  const factor = Math.pow(1 + r, N);
  const emi = (P * r * factor) / (factor - 1);
  const roundedEmi = Math.round(emi * 100) / 100;

  // Compute exact schedule to get actual total interest and total repayment
  let balance = P;
  let totalInterest = 0;
  for (let i = 1; i <= N; i++) {
    const intPortion = Math.round(balance * r * 100) / 100;
    totalInterest += intPortion;
    const prinPortion = i === N ? balance : Math.round((roundedEmi - intPortion) * 100) / 100;
    balance = Math.max(0, Math.round((balance - prinPortion) * 100) / 100);
  }

  totalInterest = Math.round(totalInterest * 100) / 100;
  const totalRepayment = Math.round((P + totalInterest) * 100) / 100;

  return {
    emi: roundedEmi,
    totalInterest,
    totalRepayment,
    installments: N,
    periodicRate: r
  };
}

function addWeeks(dateStr, weeks) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + (weeks * 7));
  return d.toISOString().split('T')[0];
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function generateRepaymentSchedule(principal, annualRate, frequency = 'WEEKLY', tenureUnits = 10, startDate = null, loanId = 'loan') {
  const P = Number(principal);
  const R = Number(annualRate);
  const N = Math.max(1, Math.round(Number(tenureUnits)));
  const baseDate = startDate ? new Date(startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const calc = calculateEmi(P, R, frequency, N);
  const r = calc.periodicRate || 0;
  const emi = calc.emi;

  let balance = P;
  const schedule = [];

  for (let i = 1; i <= N; i++) {
    const openingBalance = balance;
    let interestDue = r > 0 ? Math.round(balance * r * 100) / 100 : 0;
    let principalDue = Math.round((emi - interestDue) * 100) / 100;

    // Reconciliation on last instalment to prevent rounding drift
    if (i === N) {
      principalDue = openingBalance;
    }

    const scheduledAmount = Math.round((principalDue + interestDue) * 100) / 100;
    const closingBalance = Math.max(0, Math.round((openingBalance - principalDue) * 100) / 100);
    balance = closingBalance;

    const dueDate = frequency === 'MONTHLY' 
      ? addMonths(baseDate, i) 
      : addWeeks(baseDate, i);

    const repaymentId = `${loanId}_inst_${i}`;

    schedule.push({
      repaymentId,
      installment_number: i,
      due_date: dueDate,
      opening_balance: openingBalance,
      scheduled_amount: scheduledAmount,
      expectedAmount: scheduledAmount,
      principal_due: principalDue,
      interest_due: interestDue,
      principal_paid: 0,
      interest_paid: 0,
      paidAmount: 0,
      remainingAmount: scheduledAmount,
      overdueDays: 0,
      penaltyAmount: 0,
      status: 'UPCOMING'
    });
  }

  return {
    calc,
    schedule
  };
}

function allocateRepayment(schedule, paymentAmount) {
  let remainingPayment = Number(paymentAmount);
  let totalInterestAllocated = 0;
  let totalPrincipalAllocated = 0;

  for (let inst of schedule) {
    if (remainingPayment <= 0) break;
    if (inst.status === 'PAID') continue;

    const remainingInterestDue = Math.max(0, Math.round((inst.interest_due - (inst.interest_paid || 0)) * 100) / 100);
    const remainingPrincipalDue = Math.max(0, Math.round((inst.principal_due - (inst.principal_paid || 0)) * 100) / 100);

    // 1. Pay remaining interest due first
    let interestPaidThisTime = 0;
    if (remainingInterestDue > 0) {
      interestPaidThisTime = Math.min(remainingPayment, remainingInterestDue);
      inst.interest_paid = Math.round(((inst.interest_paid || 0) + interestPaidThisTime) * 100) / 100;
      remainingPayment = Math.round((remainingPayment - interestPaidThisTime) * 100) / 100;
      totalInterestAllocated += interestPaidThisTime;
    }

    // 2. Pay remaining principal due
    let principalPaidThisTime = 0;
    if (remainingPayment > 0 && remainingPrincipalDue > 0) {
      principalPaidThisTime = Math.min(remainingPayment, remainingPrincipalDue);
      inst.principal_paid = Math.round(((inst.principal_paid || 0) + principalPaidThisTime) * 100) / 100;
      remainingPayment = Math.round((remainingPayment - principalPaidThisTime) * 100) / 100;
      totalPrincipalAllocated += principalPaidThisTime;
    }

    // Check status of instalment and update paidAmount and remainingAmount
    const totalDue = inst.expectedAmount || inst.scheduled_amount;
    const totalPaidOnInst = Math.round(((inst.interest_paid || 0) + (inst.principal_paid || 0)) * 100) / 100;
    inst.expectedAmount = totalDue;
    inst.paidAmount = totalPaidOnInst;
    inst.remainingAmount = Math.max(0, Math.round((totalDue - totalPaidOnInst) * 100) / 100);

    if (inst.remainingAmount <= 0.01) {
      inst.status = 'PAID';
      inst.remainingAmount = 0;
      // When paid in full, stop future penalties from being generated
    } else if (totalPaidOnInst > 0) {
      inst.status = 'PARTIALLY_PAID';
    }
  }

  // Find next unpaid due date
  const nextUnpaid = schedule.find(s => s.status !== 'PAID');
  const nextDueDate = nextUnpaid ? nextUnpaid.due_date : null;

  return {
    allocatedInterest: Math.round(totalInterestAllocated * 100) / 100,
    allocatedPrincipal: Math.round(totalPrincipalAllocated * 100) / 100,
    unallocatedSurplus: Math.round(remainingPayment * 100) / 100,
    nextDueDate,
    updatedSchedule: schedule
  };
}

const DAILY_PENALTY_RATE = 50; // ₹50 per overdue day
const DAILY_SCORE_PENALTY = 1; // 1 score point deducted per overdue day

/**
 * Calculate difference in calendar days between date1 and date2 (date1 - date2).
 * Formats: YYYY-MM-DD or ISO strings.
 */
function getCalendarDaysDiff(currentDateStr, dueDateStr) {
  if (!currentDateStr || !dueDateStr) return 0;
  const d1 = new Date(currentDateStr.split('T')[0] + 'T00:00:00Z');
  const d2 = new Date(dueDateStr.split('T')[0] + 'T00:00:00Z');
  const diffMs = d1.getTime() - d2.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Process daily repayment check and score reduction for all loans.
 * Ensures:
 * 1. Strict separation of WEEKLY and MONTHLY loans.
 * 2. Idempotency: repaymentId + date uniqueness in daily_penalties.
 * 3. ₹50 penalty per overdue day on unpaid installments.
 * 4. Score deduction (dailyScorePenalty = 1 per day), score >= 0.
 * 5. Paid installments stop penalties. On-time installments have 0 penalty & 0 score deduction.
 */
function processDailyRepaymentAndScore({
  loans = [],
  schedules = [],
  users = [],
  dailyPenalties = [],
  notifications = [],
  currentDate = null,
  notifyCallback = null
}) {
  const todayStr = currentDate 
    ? new Date(currentDate).toISOString().split('T')[0] 
    : new Date().toISOString().split('T')[0];

  let penaltiesCreatedCount = 0;
  let notificationsCreatedCount = 0;
  const existingPenaltyKeys = new Set(dailyPenalties.map(p => `${p.repaymentId}_${p.date}`));

  // 1. Process active loans (DISBURSED or APPROVED/SANCTIONED with active balance)
  const activeLoans = loans.filter(l => 
    (l.status === 'DISBURSED' || l.status === 'APPROVED' || l.status === 'SANCTIONED') &&
    (l.outstanding_balance > 0.01)
  );

  for (const loan of activeLoans) {
    // Frequency strictly separated
    const frequency = (loan.repayment_frequency || 'WEEKLY').toUpperCase();
    const isWeekly = frequency === 'WEEKLY';
    const isMonthly = frequency === 'MONTHLY';

    // Retrieve schedule
    let schedule = loan.repayment_schedule || [];
    if (schedule.length === 0) {
      const schEntry = schedules.find(s => s.loan_id === loan.id);
      if (schEntry && Array.isArray(schEntry.schedule)) {
        schedule = schEntry.schedule;
      }
    }

    if (!Array.isArray(schedule) || schedule.length === 0) continue;

    let loanTotalOverdueDays = 0;
    let loanTotalPenalty = 0;
    let loanHasOverdue = false;

    // Check each installment independently
    schedule.forEach((inst, idx) => {
      // Ensure repaymentId exists
      if (!inst.repaymentId) {
        inst.repaymentId = `${loan.id}_inst_${inst.installment_number || idx + 1}`;
      }

      // Ensure expectedAmount, paidAmount, remainingAmount are initialized
      if (inst.expectedAmount === undefined) {
        inst.expectedAmount = inst.scheduled_amount || 0;
      }
      if (inst.paidAmount === undefined) {
        inst.paidAmount = Math.round(((inst.principal_paid || 0) + (inst.interest_paid || 0)) * 100) / 100;
      }
      if (inst.remainingAmount === undefined) {
        inst.remainingAmount = Math.max(0, Math.round((inst.expectedAmount - inst.paidAmount) * 100) / 100);
      }

      // If fully paid, no penalties and stop further penalties
      if (inst.remainingAmount <= 0.01 || inst.status === 'PAID') {
        inst.status = 'PAID';
        inst.remainingAmount = 0;
        inst.overdueDays = 0;
        // Keep existing accumulated penalty or 0
        inst.penaltyAmount = inst.penaltyAmount || 0;
        return;
      }

      // Check due date
      const dueDate = inst.due_date;
      if (!dueDate) return;

      const overdueDays = getCalendarDaysDiff(todayStr, dueDate);

      if (overdueDays > 0) {
        // OVERDUE
        loanHasOverdue = true;
        inst.overdueDays = overdueDays;
        inst.status = inst.paidAmount > 0 ? 'PARTIALLY_PAID_OVERDUE' : 'OVERDUE';

        // ₹50 per overdue day formula
        const penaltyAmount = overdueDays * DAILY_PENALTY_RATE;
        inst.penaltyAmount = penaltyAmount;

        loanTotalOverdueDays += overdueDays;
        loanTotalPenalty += penaltyAmount;

        // Idempotent Daily Penalty Record: repaymentId + date
        const penaltyKey = `${inst.repaymentId}_${todayStr}`;
        if (!existingPenaltyKeys.has(penaltyKey)) {
          const newRecord = {
            id: `pen_${inst.repaymentId}_${todayStr}`,
            userId: loan.user_id,
            loanId: loan.id,
            repaymentId: inst.repaymentId,
            date: todayStr,
            frequency,
            dueDate,
            overdueDays,
            penaltyAmount: DAILY_PENALTY_RATE, // Daily increment is ₹50
            totalAccumulatedPenalty: penaltyAmount,
            scorePenalty: DAILY_SCORE_PENALTY, // -1 score for this overdue day
            remainingPrincipal: inst.remainingAmount,
            createdAt: new Date().toISOString()
          };
          dailyPenalties.push(newRecord);
          existingPenaltyKeys.add(penaltyKey);
          penaltiesCreatedCount++;

          // Overdue Notification on new overdue event
          if (notifyCallback) {
            notifyCallback({
              userId: loan.user_id,
              loanId: loan.id,
              repaymentId: inst.repaymentId,
              overdueDays,
              pendingAmount: inst.remainingAmount,
              penaltyAmount,
              totalOutstanding: Math.round((inst.remainingAmount + penaltyAmount) * 100) / 100
            });
            notificationsCreatedCount++;
          }
        }
      } else {
        // Due today or upcoming (currentDate <= dueDate)
        inst.overdueDays = 0;
        inst.penaltyAmount = 0;
        if (inst.status !== 'PAID') {
          inst.status = inst.paidAmount > 0 ? 'PARTIALLY_PAID' : 'UPCOMING';
        }
      }
    });

    loan.overdue_days = loanTotalOverdueDays;
    loan.penalty_amount = loanTotalPenalty;
    loan.repayment_schedule = schedule;

    // Sync in schedules collection
    const schIndex = schedules.findIndex(s => s.loan_id === loan.id);
    if (schIndex !== -1) {
      schedules[schIndex].schedule = schedule;
    }
  }

  // 2. Calculate and update User Repayment Scores
  // Rule: Score = max(0, 100 - totalUniqueScorePenalties)
  // Each daily penalty event for a user represents 1 unique overdue day penalty
  for (const user of users) {
    if (user.role === 'USER' || user.role === 'GROUP_ADMIN') {
      const userPenalties = dailyPenalties.filter(p => p.userId === user.id);
      const totalScorePenalty = userPenalties.reduce((sum, p) => sum + (p.scorePenalty || DAILY_SCORE_PENALTY), 0);
      
      const baseScore = 100;
      const calculatedScore = Math.max(0, baseScore - totalScorePenalty);
      user.repayment_score = calculatedScore;
      user.total_overdue_days = userPenalties.length;
      user.total_penalties_incurred = userPenalties.reduce((sum, p) => sum + (p.penaltyAmount || 0), 0);
    }
  }

  return {
    todayStr,
    penaltiesCreatedCount,
    notificationsCreatedCount,
    totalPenaltiesTracked: dailyPenalties.length
  };
}

module.exports = {
  calculateEmi,
  generateRepaymentSchedule,
  allocateRepayment,
  getCalendarDaysDiff,
  processDailyRepaymentAndScore,
  DAILY_PENALTY_RATE,
  DAILY_SCORE_PENALTY
};

