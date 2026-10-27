const assert = require('assert');
const {
  calculateEmi,
  generateRepaymentSchedule,
  allocateRepayment,
  processDailyRepaymentAndScore,
  getCalendarDaysDiff,
  DAILY_PENALTY_RATE,
  DAILY_SCORE_PENALTY
} = require('./loanCalculations');

console.log('--- Starting Daily Repayment & Score System Acceptance Tests ---');

// 1. Weekly Schedule Test
const weeklyLoan = generateRepaymentSchedule(5000, 0, 'WEEKLY', 10, '2026-11-01', 'LN_WK_01');
assert.strictEqual(weeklyLoan.schedule.length, 10, 'Weekly loan should have 10 installments');
assert.strictEqual(weeklyLoan.schedule[0].repaymentId, 'LN_WK_01_inst_1');
assert.strictEqual(weeklyLoan.schedule[0].due_date, '2026-11-08');
assert.strictEqual(weeklyLoan.schedule[1].due_date, '2026-11-15');
assert.strictEqual(weeklyLoan.schedule[2].due_date, '2026-11-22');
assert.strictEqual(weeklyLoan.schedule[0].expectedAmount, 500);
console.log('✓ Weekly repayment schedule generated with weekly intervals and repaymentId');

// 2. Monthly Schedule Test
const monthlyLoan = generateRepaymentSchedule(12000, 0, 'MONTHLY', 12, '2026-11-05', 'LN_MO_01');
assert.strictEqual(monthlyLoan.schedule.length, 12, 'Monthly loan should have 12 installments');
assert.strictEqual(monthlyLoan.schedule[0].repaymentId, 'LN_MO_01_inst_1');
assert.strictEqual(monthlyLoan.schedule[0].due_date, '2026-12-05');
assert.strictEqual(monthlyLoan.schedule[1].due_date, '2027-01-05');
assert.strictEqual(monthlyLoan.schedule[0].expectedAmount, 1000);
console.log('✓ Monthly repayment schedule generated with monthly intervals (strictly independent from weekly)');

// 3. Due-date and Overdue-day calculation
assert.strictEqual(getCalendarDaysDiff('2026-11-04', '2026-11-01'), 3, 'Difference should be 3 days');
assert.strictEqual(getCalendarDaysDiff('2026-11-06', '2026-11-01'), 5, 'Difference should be 5 days');
assert.strictEqual(getCalendarDaysDiff('2026-11-01', '2026-11-01'), 0, 'Due today difference should be 0');
assert.strictEqual(getCalendarDaysDiff('2026-10-30', '2026-11-01'), -2, 'Upcoming difference should be negative');
console.log('✓ Correct overdue-day calendar calculations');

// 4. Overdue Penalty and Score Reduction simulation
const testLoans = [
  {
    id: 'LN_WK_01',
    user_id: 'USR_01',
    status: 'DISBURSED',
    repayment_frequency: 'WEEKLY',
    amount: 5000,
    outstanding_balance: 5000,
    repayment_schedule: [
      {
        repaymentId: 'LN_WK_01_inst_1',
        installment_number: 1,
        due_date: '2026-11-01',
        scheduled_amount: 500,
        expectedAmount: 500,
        principal_due: 500,
        interest_due: 0,
        principal_paid: 0,
        interest_paid: 0,
        paidAmount: 0,
        remainingAmount: 500,
        status: 'UPCOMING'
      }
    ]
  }
];

const testUsers = [
  { id: 'USR_01', name: 'Kavitha', role: 'USER', repayment_score: 100 }
];

const testPenalties = [];
const testSchedules = [{ loan_id: 'LN_WK_01', schedule: testLoans[0].repayment_schedule }];
const notificationsReceived = [];

// Simulate Day 2026-11-04 (3 days overdue: Due 01/11, Current 04/11)
let res1 = processDailyRepaymentAndScore({
  loans: testLoans,
  schedules: testSchedules,
  users: testUsers,
  dailyPenalties: testPenalties,
  notifications: [],
  currentDate: '2026-11-04',
  notifyCallback: (n) => notificationsReceived.push(n)
});

assert.strictEqual(testLoans[0].repayment_schedule[0].overdueDays, 3, 'Overdue days should be 3');
assert.strictEqual(testLoans[0].repayment_schedule[0].penaltyAmount, 150, '3 overdue days * 50 = 150 penalty');
assert.strictEqual(testUsers[0].repayment_score, 99, 'Initial day run creates 1 penalty record, score is 99');
assert.strictEqual(testPenalties.length, 1, '1 penalty event recorded for today');
console.log('✓ 3 days overdue correctly produces ₹150 penalty and score deduction');

// 5. Test Idempotency (run multiple times on the same date)
let resDuplicate = processDailyRepaymentAndScore({
  loans: testLoans,
  schedules: testSchedules,
  users: testUsers,
  dailyPenalties: testPenalties,
  notifications: [],
  currentDate: '2026-11-04',
  notifyCallback: (n) => notificationsReceived.push(n)
});

assert.strictEqual(testPenalties.length, 1, 'Idempotency check: No duplicate daily penalty record on same date');
assert.strictEqual(testUsers[0].repayment_score, 99, 'Score remains unchanged on repeated run');
console.log('✓ Idempotency verified: running daily check multiple times on the same day never duplicates penalties or score deduction');

// 6. Test Partial Payment
testLoans[0].repayment_schedule[0].principal_paid = 300;
testLoans[0].repayment_schedule[0].paidAmount = 300;
testLoans[0].repayment_schedule[0].remainingAmount = 200;

// Simulate Next Day 2026-11-05
let resNextDay = processDailyRepaymentAndScore({
  loans: testLoans,
  schedules: testSchedules,
  users: testUsers,
  dailyPenalties: testPenalties,
  notifications: [],
  currentDate: '2026-11-05',
  notifyCallback: (n) => notificationsReceived.push(n)
});

assert.strictEqual(testLoans[0].repayment_schedule[0].overdueDays, 4, 'Overdue days now 4');
assert.strictEqual(testLoans[0].repayment_schedule[0].penaltyAmount, 200, '4 overdue days * 50 = 200');
assert.strictEqual(testPenalties.length, 2, 'Total 2 daily records for the 2 distinct dates');
assert.strictEqual(testUsers[0].repayment_score, 98, 'Score is 98 (100 - 2 overdue day events)');
console.log('✓ Partial payment supported: Remaining principal ₹200 calculated with overdue days');

// 7. Full Payment after overdue stops future penalties
testLoans[0].repayment_schedule[0].principal_paid = 500;
testLoans[0].repayment_schedule[0].paidAmount = 500;
testLoans[0].repayment_schedule[0].remainingAmount = 0;
testLoans[0].repayment_schedule[0].status = 'PAID';

// Simulate Day 2026-11-06
let resPaidDay = processDailyRepaymentAndScore({
  loans: testLoans,
  schedules: testSchedules,
  users: testUsers,
  dailyPenalties: testPenalties,
  notifications: [],
  currentDate: '2026-11-06',
  notifyCallback: (n) => notificationsReceived.push(n)
});

assert.strictEqual(testPenalties.length, 2, 'No new penalty created once installment is PAID');
assert.strictEqual(testUsers[0].repayment_score, 98, 'Score does not decrease after payment');
console.log('✓ Full payment stops future daily penalties and score reductions');

// 8. Test Score floor limit (Score must never go below 0)
const poorUser = { id: 'USR_POOR', name: 'Test Floor', role: 'USER', repayment_score: 100 };
const manyPenalties = [];
for (let i = 1; i <= 150; i++) {
  manyPenalties.push({
    id: `pen_${i}`,
    userId: 'USR_POOR',
    scorePenalty: 1,
    date: `2026-01-${i}`
  });
}
processDailyRepaymentAndScore({
  loans: [],
  schedules: [],
  users: [poorUser],
  dailyPenalties: manyPenalties,
  notifications: []
});
assert.strictEqual(poorUser.repayment_score, 0, 'Score must be clamped at 0, never negative');
console.log('✓ Score floor enforced: score is min 0 (never negative)');

console.log('ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY! 🎉');
