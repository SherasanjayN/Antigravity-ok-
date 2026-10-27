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

function generateRepaymentSchedule(principal, annualRate, frequency = 'WEEKLY', tenureUnits = 10, startDate = null) {
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

    schedule.push({
      installment_number: i,
      due_date: dueDate,
      opening_balance: openingBalance,
      scheduled_amount: scheduledAmount,
      principal_due: principalDue,
      interest_due: interestDue,
      principal_paid: 0,
      interest_paid: 0,
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

    // Check status of instalment
    const totalDue = inst.scheduled_amount;
    const totalPaidOnInst = (inst.interest_paid || 0) + (inst.principal_paid || 0);
    if (totalPaidOnInst >= totalDue - 0.01) {
      inst.status = 'PAID';
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

module.exports = {
  calculateEmi,
  generateRepaymentSchedule,
  allocateRepayment
};
