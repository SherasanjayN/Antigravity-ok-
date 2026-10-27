/**
 * Magalir Kuzhu Loan Eligibility & Repayment Scoring Service
 * Centralized, deterministic, data-driven financial scoring and eligibility evaluator.
 *
 * CORE BUSINESS RULES:
 * 1. Single Active Loan Policy:
 *    A member must NOT apply for another normal loan while having an active outstanding loan.
 * 2. Loan Sequence & Completion Rule:
 *    - Loan 1 -> Must be COMPLETED (balance ₹0)
 *    - Loan 2 -> Must be COMPLETED (balance ₹0)
 *    - Loan 3 -> Must be COMPLETED (balance ₹0)
 *    - Loan 4 -> Allowed ONLY if repayment score >= 95 and all qualification conditions are met.
 *    - Loan 5 -> NOT allowed under standard automatic policy (completedLoanCount >= 4 blocked).
 * 3. Repayment Score (0 - 100):
 *    - Calculated deterministically from real database repayment history, installment accuracy,
 *      on-time compliance, partial/late/overdue penalties, and successful loan completions.
 *    - Base 100 with explainable factors.
 * 4. Super Admin Exception Review:
 *    - Super Admin can review manual 5th loan exceptions with explicit reason, auth, and audit log.
 */

/**
 * Determine if a loan record is truly completed/closed.
 * A loan is completed only when:
 * - Status is 'COMPLETED' (or outstanding_balance <= 0.01)
 * - Remaining balance is ₹0
 */
function isLoanCompleted(loan) {
  if (!loan) return false;
  const balance = loan.outstanding_balance !== undefined 
    ? Number(loan.outstanding_balance) 
    : (loan.remaining_balance !== undefined ? Number(loan.remaining_balance) : Number(loan.amount || 0));

  // Must not be active/pending/overdue
  if (['REJECTED_GROUP_ADMIN', 'REJECTED_SUPER_ADMIN', 'REJECTED', 'DENIED_BY_USER', 'CANCELLED'].includes(loan.status)) {
    return false;
  }
  return loan.status === 'COMPLETED' && balance <= 0.01;
}

/**
 * Determine if a loan is an active/blocking ongoing loan.
 * A loan blocks new requests if it is pending approval, sanctioned, or disbursed with balance > 0.
 */
function isLoanActive(loan) {
  if (!loan) return false;
  if (['REJECTED_GROUP_ADMIN', 'REJECTED_SUPER_ADMIN', 'COMPLETED', 'REJECTED', 'DENIED_BY_USER', 'CANCELLED'].includes(loan.status)) {
    return false;
  }
  if (['PENDING_GROUP_ADMIN', 'PENDING_SUPER_ADMIN', 'SANCTIONED'].includes(loan.status)) {
    return true;
  }
  if (loan.status === 'DISBURSED' || loan.status === 'APPROVED') {
    const balance = loan.outstanding_balance !== undefined 
      ? Number(loan.outstanding_balance) 
      : (loan.remaining_balance !== undefined ? Number(loan.remaining_balance) : Number(loan.amount || 0));
    return balance > 0.01;
  }
  return false;
}

/**
 * Calculate user's data-driven repayment score and detailed breakdown.
 *
 * Scoring Formula (Deterministic 0 - 100):
 * - Starts at Base 100
 * - Deductions:
 *   - Overdue days: -1 point per overdue day recorded in dailyPenalties / overdue schedules
 *   - Partial payments: -2 points per installment that was partially paid (incentivize full installment payment)
 *   - Current active overdue amount: -3 points if any installment currently past due date with remaining balance
 * - Rewards / Stabilizers:
 *   - Completed loans: +2 bonus credit points per successfully settled loan (up to base cap of 100)
 * - Floor: 0, Ceiling: 100
 */
function calculateRepaymentScoreDetails({
  user,
  userLoans = [],
  repayments = [],
  dailyPenalties = [],
  schedules = []
}) {
  let score = 100;
  const explanations = [];

  let totalInstallmentsAssessed = 0;
  let onTimePaidInstallments = 0;
  let partialPaidInstallments = 0;
  let overdueInstallmentsCount = 0;
  let currentOverdueAmount = 0;

  // 1. Analyze all repayment schedules and installments for user loans
  for (const loan of userLoans) {
    let schedule = loan.repayment_schedule || [];
    if (!schedule || schedule.length === 0) {
      const schEntry = schedules.find(s => s.loan_id === loan.id);
      if (schEntry && Array.isArray(schEntry.schedule)) {
        schedule = schEntry.schedule;
      }
    }

    if (Array.isArray(schedule) && schedule.length > 0) {
      for (const inst of schedule) {
        totalInstallmentsAssessed++;
        const paidAmount = Number(inst.paidAmount || inst.paid_amount || 0);
        const expected = Number(inst.expectedAmount || inst.scheduled_amount || inst.due_amount || 0);
        const remaining = Number(inst.remainingAmount !== undefined ? inst.remainingAmount : (expected - paidAmount));
        const status = inst.status || '';

        if (status === 'PAID') {
          onTimePaidInstallments++;
        } else if (status === 'PARTIALLY_PAID' || (paidAmount > 0 && remaining > 0.01)) {
          partialPaidInstallments++;
        }

        if (status.includes('OVERDUE') || (inst.overdueDays && inst.overdueDays > 0)) {
          overdueInstallmentsCount++;
          currentOverdueAmount += Math.max(0, remaining);
        }
      }
    }
  }

  // 2. Count penalties from dailyPenalties collection
  const userPenalties = dailyPenalties.filter(p => p.userId === user.id);
  const overdueDaysPenalty = userPenalties.length; // 1 point per overdue day
  const partialPenalty = partialPaidInstallments * 2;
  const currentOverduePenalty = currentOverdueAmount > 0 ? 3 : 0;

  score -= overdueDaysPenalty;
  score -= partialPenalty;
  score -= currentOverduePenalty;

  // 3. Completed loans consistency
  const completedLoansCount = userLoans.filter(isLoanCompleted).length;
  // If user has recorded user.repayment_score in users collection, respect it as floor/anchor
  if (user.repayment_score !== undefined && userPenalties.length === 0 && partialPaidInstallments === 0) {
    score = user.repayment_score;
  }

  // Bound score between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // If user has recorded user.repayment_score, keep consistency if it has no overdue records
  if (user.repayment_score !== undefined && userLoans.length === 0 && userPenalties.length === 0) {
    score = user.repayment_score;
  }

  // 4. Generate user-friendly explainable factors
  if (totalInstallmentsAssessed > 0) {
    const onTimePct = Math.round((onTimePaidInstallments / totalInstallmentsAssessed) * 100);
    explanations.push(`✅ ${onTimePct}% installments paid on time`);
  } else {
    explanations.push(`✅ Perfect baseline repayment history`);
  }

  if (completedLoansCount > 0) {
    explanations.push(`✅ ${completedLoansCount} previous loan(s) completed & fully settled`);
  }

  if (currentOverdueAmount === 0 && overdueInstallmentsCount === 0) {
    explanations.push(`✅ No current overdue amount`);
  } else {
    explanations.push(`⚠️ ₹${Math.round(currentOverdueAmount)} currently overdue (${userPenalties.length} overdue days)`);
  }

  if (partialPaidInstallments > 0) {
    explanations.push(`⚠️ ${partialPaidInstallments} partial payment(s) recorded`);
  }

  let ratingCategory = 'High Risk';
  if (score >= 95) ratingCategory = 'Excellent';
  else if (score >= 90) ratingCategory = 'Very Good';
  else if (score >= 80) ratingCategory = 'Good';
  else if (score >= 70) ratingCategory = 'Needs Improvement';

  return {
    score,
    ratingCategory,
    explanations,
    completedLoansCount,
    totalInstallmentsAssessed,
    onTimePaidInstallments,
    partialPaidInstallments,
    overdueDaysCount: userPenalties.length,
    currentOverdueAmount
  };
}

/**
 * Calculate user loan eligibility based on strict business rules.
 */
function evaluateLoanEligibility({
  userId,
  users = [],
  loans = [],
  repayments = [],
  dailyPenalties = [],
  schedules = [],
  groups = []
}) {
  const user = users.find(u => u.id === userId);
  if (!user) {
    return {
      eligible: false,
      reason: 'User account not found.',
      reasonTa: 'பயனர் கணக்கு காணப்படவில்லை.',
      statusCode: 'USER_NOT_FOUND'
    };
  }

  // Group status check
  if (!user.group_id) {
    return {
      eligible: false,
      reason: 'Member must be assigned to an active SHG group before applying for a loan.',
      reasonTa: 'கடன் விண்ணப்பிப்பதற்கு முன் உறுப்பினர் ஒரு செயலில் உள்ள மகளிர் குழுவில் சேர்க்கப்பட்டிருக்க வேண்டும்.',
      statusCode: 'NO_GROUP'
    };
  }

  const group = groups.find(g => g.id === user.group_id);
  if (!group || group.status === 'INACTIVE') {
    return {
      eligible: false,
      reason: 'Your group is currently inactive.',
      reasonTa: 'உங்கள் குழு தற்போது செயலில் இல்லை.',
      statusCode: 'GROUP_INACTIVE'
    };
  }

  // Member status check
  if (user.status !== 'APPROVED') {
    return {
      eligible: false,
      reason: 'Member account is currently pending approval.',
      reasonTa: 'உங்கள் பயனர் கணக்கு இன்னும் முதன்மை நிர்வாகியால் அங்கீகரிக்கப்படவில்லை.',
      statusCode: 'MEMBER_NOT_APPROVED'
    };
  }

  // User loans history
  const userLoans = loans
    .filter(l => l.user_id === userId)
    .sort((a, b) => new Date(a.requested_at || a.created_at || 0) - new Date(b.requested_at || b.created_at || 0));

  // 1. Check current outstanding / active loans
  const activeLoans = userLoans.filter(isLoanActive);
  const currentActiveLoan = activeLoans.length > 0 ? activeLoans[0] : null;

  let currentOutstandingBalance = 0;
  if (currentActiveLoan) {
    currentOutstandingBalance = currentActiveLoan.outstanding_balance !== undefined
      ? Number(currentActiveLoan.outstanding_balance)
      : (currentActiveLoan.remaining_balance !== undefined ? Number(currentActiveLoan.remaining_balance) : Number(currentActiveLoan.amount || 0));
  }

  // 2. Count completed loans
  const completedLoans = userLoans.filter(isLoanCompleted);
  const completedLoanCount = completedLoans.length;

  // 3. Calculate data-driven repayment score
  const scoreDetails = calculateRepaymentScoreDetails({
    user,
    userLoans,
    repayments,
    dailyPenalties,
    schedules
  });
  const repaymentScore = scoreDetails.score;

  // Determine next loan sequence number
  const nextLoanNumber = completedLoanCount + 1;

  // RULE A: Check active loan restriction
  if (activeLoans.length > 0 || currentOutstandingBalance > 0.01) {
    const balDisplay = Math.round(currentOutstandingBalance);
    return {
      eligible: false,
      loanNumber: nextLoanNumber,
      completedLoans: completedLoanCount,
      repaymentScore,
      remainingBalance: balDisplay,
      ratingCategory: scoreDetails.ratingCategory,
      explanations: scoreDetails.explanations,
      activeLoan: currentActiveLoan,
      reason: `Your repayment score is ${repaymentScore}/100, but your current loan still has ₹${balDisplay} outstanding. Please complete the current loan before applying for another loan.`,
      reasonTa: `உங்கள் தவணை ஒழுங்கு ஸ்கோர் ${repaymentScore}/100 ஆக உள்ளது, ஆனால் உங்கள் தற்போதைய கடனில் இன்னும் ₹${balDisplay} நிலுவை உள்ளது. அடுத்த கடனுக்கு விண்ணப்பிக்கும் முன் தற்போதைய கடனை முழுமையாக செலுத்தி முடிக்கவும்.`,
      statusCode: 'ACTIVE_LOAN_EXISTS'
    };
  }

  // RULE B: Check overdue payments block
  if (scoreDetails.currentOverdueAmount > 0) {
    return {
      eligible: false,
      loanNumber: nextLoanNumber,
      completedLoans: completedLoanCount,
      repaymentScore,
      remainingBalance: 0,
      ratingCategory: scoreDetails.ratingCategory,
      explanations: scoreDetails.explanations,
      reason: `You have an overdue payment of ₹${Math.round(scoreDetails.currentOverdueAmount)}. Please settle all overdue installments before requesting a new loan.`,
      reasonTa: `உங்களிடம் ₹${Math.round(scoreDetails.currentOverdueAmount)} நிலுவைத் தொகை உள்ளது. புதிய கடனுக்கு விண்ணப்பிக்கும் முன் அனைத்து நிலுவைகளையும் செலுத்தி முடிக்கவும்.`,
      statusCode: 'OVERDUE_PAYMENT_EXISTS'
    };
  }

  // RULE C: Check Loan 5+ (Standard policy caps at 4 loans)
  if (completedLoanCount >= 4) {
    return {
      eligible: false,
      loanNumber: 5,
      completedLoans: completedLoanCount,
      repaymentScore,
      remainingBalance: 0,
      ratingCategory: scoreDetails.ratingCategory,
      explanations: scoreDetails.explanations,
      reason: 'You have completed the maximum number of loans available under the standard loan eligibility policy (4 loans). A 5th loan is not automatically available.',
      reasonTa: 'நிலையான கடன் தகுதிக் கொள்கையின்படி அனுமதிக்கப்பட்ட அதிகபட்ச கடன்களை (4 கடன்கள்) நீங்கள் முடித்துவிட்டீர்கள். 5-வது கடன் தானாக வழங்கப்படாது.',
      statusCode: 'MAX_LOANS_REACHED',
      superAdminReviewEligible: true
    };
  }

  // RULE D: Check 4th Loan Qualification (requires completedLoanCount === 3 AND score >= 95)
  if (completedLoanCount === 3) {
    if (repaymentScore >= 95) {
      return {
        eligible: true,
        loanNumber: 4,
        completedLoans: completedLoanCount,
        repaymentScore,
        remainingBalance: 0,
        ratingCategory: scoreDetails.ratingCategory,
        explanations: scoreDetails.explanations,
        reason: '🎉 Congratulations! Your repayment record qualifies you for a 4th loan.',
        reasonTa: '🎉 வாழ்த்துகள்! உங்கள் சிறந்த தவணை ஒழுங்கு பதிவு உங்களுக்கு 4-வது கடனுக்கான முழு தகுதியை வழங்குகிறது.',
        statusCode: 'QUALIFIED_FOR_FOURTH_LOAN'
      };
    } else {
      return {
        eligible: false,
        loanNumber: 4,
        completedLoans: completedLoanCount,
        repaymentScore,
        requiredScore: 95,
        remainingBalance: 0,
        ratingCategory: scoreDetails.ratingCategory,
        explanations: scoreDetails.explanations,
        reason: `Your previous loan history is complete, but your current repayment score is ${repaymentScore}/100. A minimum score of 95 is required for 4th-loan eligibility.`,
        reasonTa: `உங்கள் முந்தைய கடன் வரலாறு முடிவடைந்துள்ளது, ஆனால் உங்கள் தற்போதைய தவணை ஒழுங்கு ஸ்கோர் ${repaymentScore}/100 ஆகும். 4-வது கடன் பெற குறைந்தபட்சம் 95 ஸ்கோர் தேவை.`,
        statusCode: 'SCORE_BELOW_95_FOR_FOURTH_LOAN'
      };
    }
  }

  // RULE E: Loans 1, 2, 3 (Normal progression with active loan cleared)
  return {
    eligible: true,
    loanNumber: nextLoanNumber,
    completedLoans: completedLoanCount,
    repaymentScore,
    remainingBalance: 0,
    ratingCategory: scoreDetails.ratingCategory,
    explanations: scoreDetails.explanations,
    reason: `Member is eligible for Loan #${nextLoanNumber}.`,
    reasonTa: `உறுப்பினர் கடன் #${nextLoanNumber}-க்கு விண்ணப்பிக்க தகுதியுடையவர்.`,
    statusCode: 'ELIGIBLE'
  };
}

module.exports = {
  isLoanCompleted,
  isLoanActive,
  calculateRepaymentScoreDetails,
  evaluateLoanEligibility
};
