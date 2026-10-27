const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { readCollection, writeCollection } = require('./db');

let transporter = null;
let isEthereal = false;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('[MAILER] Configured custom SMTP transporter with host:', process.env.SMTP_HOST);
    return transporter;
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    isEthereal = true;
    console.log('[MAILER] Created Ethereal test transporter for real email generation:', testAccount.user);
    return transporter;
  } catch (err) {
    console.warn('[MAILER] Could not create Ethereal account, falling back to JSON mock transport:', err.message);
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return transporter;
  }
}

async function dispatchEmail({
  recipientEmail,
  recipientName,
  notificationType,
  relatedLoanId = null,
  relatedTransactionId = null,
  subject,
  body,
  html
}) {
  const fromAddress = process.env.SMTP_FROM || '"Magalir Kuzhu Management" <notifications@magalirkuzhu.org>';
  const emailId = uuidv4();

  let mailRecord = {
    id: emailId,
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    notification_type: notificationType,
    related_loan_id: relatedLoanId,
    related_transaction_id: relatedTransactionId,
    subject,
    body,
    html,
    delivery_status: 'PENDING',
    attempt_count: 1,
    last_error: null,
    preview_url: null,
    details: '',
    created_at: new Date().toISOString(),
    sent_at: null
  };

  try {
    const client = await getTransporter();
    const info = await client.sendMail({
      from: fromAddress,
      to: recipientEmail,
      subject,
      text: body,
      html
    });

    if (isEthereal && nodemailer.getTestMessageUrl) {
      mailRecord.preview_url = nodemailer.getTestMessageUrl(info) || null;
    }
    mailRecord.details = info.messageId || 'Delivered';
    mailRecord.delivery_status = 'SENT';
    mailRecord.sent_at = new Date().toISOString();
    console.log(`[MAILER] ${notificationType} sent to ${recipientEmail}. Preview: ${mailRecord.preview_url || 'N/A'}`);
  } catch (err) {
    console.error(`[MAILER] Error sending ${notificationType} to ${recipientEmail}:`, err.message);
    mailRecord.delivery_status = 'FAILED';
    mailRecord.last_error = err.message;
  }

  // Persist in email_outbox and legacy emails
  const outbox = readCollection('email_outbox');
  outbox.unshift(mailRecord);
  writeCollection('email_outbox', outbox);

  // Sync with emails collection for backward compatibility
  const emails = readCollection('emails');
  emails.unshift({
    id: mailRecord.id,
    to: mailRecord.recipient_email,
    recipient_name: mailRecord.recipient_name,
    amount: mailRecord.related_loan_id,
    subject: mailRecord.subject,
    body: mailRecord.body,
    sent_at: mailRecord.sent_at || mailRecord.created_at,
    status: mailRecord.delivery_status,
    preview_url: mailRecord.preview_url,
    details: mailRecord.details,
    last_error: mailRecord.last_error
  });
  writeCollection('emails', emails);

  return mailRecord;
}

// 1. Loan Sanction Email
async function sendLoanSanctionEmail(memberEmail, memberName, loan) {
  const subject = 'Your Magalir Kuzhu Loan Has Been Sanctioned';
  const body = `Dear ${memberName},

We are pleased to inform you that your loan application has received final approval.

Loan Details:
- Loan Account Number: ${loan.loan_account_number || loan.id}
- Sanctioned Amount: ₹${loan.sanctioned_amount || loan.amount}
- Interest Rate: ${loan.annual_interest_rate || 12}%
- Repayment Frequency: ${loan.repayment_frequency || 'Weekly'}
- Instalment Amount: ₹${loan.installment_amount || loan.emi || 'N/A'}
- Loan Tenure: ${loan.tenure_value || loan.total_installments || '10'} ${loan.tenure_unit || 'Weeks'}
- First Repayment Due Date: ${loan.first_due_date || 'Calculated upon disbursal'}
- Current Status: SANCTIONED

Please note that sanction indicates approval. The amount is considered disbursed only after the authorized disbursement process has been completed.

Thank you for being part of Magalir Kuzhu.

Regards,
Magalir Kuzhu Management System`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #d1fae5; border-radius: 10px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #065f46 0%, #0d9488 100%); color: #ffffff; padding: 24px; text-align: center;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Magalir Kuzhu Management System</h2>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">மகளிர் குழு • Self-Help Group Financial Portal</p>
      </div>
      <div style="padding: 24px 28px; color: #1f2937; line-height: 1.6;">
        <p style="font-size: 16px; margin-top: 0;">Dear <strong>${memberName}</strong>,</p>
        <p>We are pleased to inform you that your loan application has received <strong>final approval</strong>.</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 5px solid #10b981; border-radius: 6px; padding: 16px 20px; margin: 20px 0;">
          <h4 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px;">📋 Sanctioned Loan Summary</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 4px 0; color: #4b5563;">Loan Account Number:</td><td style="font-weight: 600; color: #111827;">${loan.loan_account_number || loan.id}</td></tr>
            <tr><td style="padding: 4px 0; color: #4b5563;">Sanctioned Amount:</td><td style="font-weight: 700; color: #047857; font-size: 16px;">₹${loan.sanctioned_amount || loan.amount}</td></tr>
            <tr><td style="padding: 4px 0; color: #4b5563;">Annual Interest Rate:</td><td style="font-weight: 600; color: #111827;">${loan.annual_interest_rate || 12}% (Reducing Balance)</td></tr>
            <tr><td style="padding: 4px 0; color: #4b5563;">Repayment Frequency:</td><td style="font-weight: 600; color: #111827;">${loan.repayment_frequency || 'Weekly'}</td></tr>
            <tr><td style="padding: 4px 0; color: #4b5563;">Instalment Amount (EMI):</td><td style="font-weight: 600; color: #111827;">₹${loan.installment_amount || loan.emi || 'N/A'}</td></tr>
            <tr><td style="padding: 4px 0; color: #4b5563;">Loan Tenure:</td><td style="font-weight: 600; color: #111827;">${loan.tenure_value || loan.total_installments || '10'} ${loan.tenure_unit || 'Weeks'}</td></tr>
            <tr><td style="padding: 4px 0; color: #4b5563;">First Repayment Due:</td><td style="font-weight: 600; color: #111827;">${loan.first_due_date || 'Activated upon disbursal'}</td></tr>
            <tr><td style="padding: 4px 0; color: #4b5563;">Current Status:</td><td><span style="background-color: #d1fae5; color: #065f46; font-weight: 700; padding: 2px 8px; border-radius: 4px;">SANCTIONED</span></td></tr>
          </table>
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #92400e;">
          ⚠️ <strong>Please note:</strong> Sanction indicates official approval. The amount is considered disbursed only after the authorized disbursement process has been completed by the Super Admin.
        </div>

        <p style="margin-top: 20px;">Thank you for being a valued member of Magalir Kuzhu.</p>
        <p style="margin-bottom: 0;">Regards,<br><strong>Magalir Kuzhu Management System</strong></p>
      </div>
      <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 14px; text-align: center; font-size: 12px; color: #6b7280;">
        Automated notification. Please do not reply directly to this email.
      </div>
    </div>
  `;

  return dispatchEmail({
    recipientEmail: memberEmail,
    recipientName: memberName,
    notificationType: 'LOAN_SANCTION',
    relatedLoanId: loan.id,
    subject,
    body,
    html
  });
}

// 2. Loan Disbursement Email
async function sendLoanDisbursementEmail(memberEmail, memberName, loan, disbursement) {
  const subject = 'Loan Disbursed – Magalir Kuzhu Management System';
  const body = `Dear ${memberName},

We are pleased to inform you that your sanctioned loan of ₹${disbursement.amount || loan.sanctioned_amount} has been disbursed successfully.

Disbursement Details:
- Loan Account Number: ${loan.loan_account_number || loan.id}
- Disbursed Amount: ₹${disbursement.amount || loan.sanctioned_amount}
- Disbursement Date: ${disbursement.date || new Date().toISOString().split('T')[0]}
- Payment Method: ${disbursement.method || 'Bank Transfer'}
- Transaction Reference: ${disbursement.reference || 'N/A'}
- Repayment Frequency: ${loan.repayment_frequency || 'Weekly'}
- First Instalment Due Date: ${loan.first_due_date || 'Next week'}
- Instalment Amount: ₹${loan.installment_amount || loan.emi || 'N/A'}

Your repayment schedule is now active. Please ensure repayments are completed as per the schedule.

Regards,
Magalir Kuzhu Management System`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #d1fae5; border-radius: 10px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #047857 0%, #059669 100%); color: #ffffff; padding: 24px; text-align: center;">
        <h2 style="margin: 0; font-size: 22px;">Magalir Kuzhu Management System</h2>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Loan Disbursement Confirmation</p>
      </div>
      <div style="padding: 24px 28px; color: #1f2937; line-height: 1.6;">
        <p>Dear <strong>${memberName}</strong>,</p>
        <p>Your sanctioned loan funds of <strong style="color: #047857; font-size: 18px;">₹${disbursement.amount || loan.sanctioned_amount}</strong> have been disbursed successfully.</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px 20px; margin: 18px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 4px 0; color: #4b5563;">Loan Account Number:</td><td style="font-weight: 600;">${loan.loan_account_number || loan.id}</td></tr>
            <tr><td style="padding: 4px 0; color: #4b5563;">Disbursed Amount:</td><td style="font-weight: 700; color: #047857;">₹${disbursement.amount || loan.sanctioned_amount}</td></tr>
            <tr><td style="padding: 4px 0; color: #4b5563;">Disbursement Date:</td><td style="font-weight: 600;">${disbursement.date || new Date().toISOString().split('T')[0]}</td></tr>
            <tr><td style="padding: 4px 0; color: #4b5563;">Disbursement Method:</td><td style="font-weight: 600;">${disbursement.method || 'Direct Transfer'}</td></tr>
            <tr><td style="padding: 4px 0; color: #4b5563;">Transaction Reference:</td><td style="font-weight: 600;">${disbursement.reference || 'N/A'}</td></tr>
            <tr><td style="padding: 4px 0; color: #4b5563;">First Instalment Due:</td><td style="font-weight: 700; color: #b45309;">${loan.first_due_date}</td></tr>
            <tr><td style="padding: 4px 0; color: #4b5563;">Instalment Amount (EMI):</td><td style="font-weight: 700;">₹${loan.installment_amount || loan.emi}</td></tr>
          </table>
        </div>

        <p>Your repayment schedule is now activated in your dashboard. You can review instalments and download official receipts anytime.</p>
        <p>Regards,<br><strong>Magalir Kuzhu Management System</strong></p>
      </div>
    </div>
  `;

  return dispatchEmail({
    recipientEmail: memberEmail,
    recipientName: memberName,
    notificationType: 'LOAN_DISBURSEMENT',
    relatedLoanId: loan.id,
    subject,
    body,
    html
  });
}

// 3. Cash Repayment Receipt Email
async function sendCashRepaymentEmail(memberEmail, memberName, receipt) {
  const subject = 'Cash Repayment Receipt – Magalir Kuzhu';
  const body = `Dear ${memberName},

Your cash repayment has been recorded successfully.

Payment Details:
- Receipt Number: ${receipt.receipt_number}
- Loan Account Number: ${receipt.loan_account_number}
- Amount Received: ₹${receipt.amount}
- Payment Method: CASH
- Payment Date: ${receipt.payment_date}
- Total Paid So Far: ₹${receipt.total_paid}
- Remaining Balance: ₹${receipt.remaining_balance}
- Next Due Date: ${receipt.remaining_balance <= 0 ? 'Fully Repaid' : receipt.next_due_date}

Please retain this email for your records.

Regards,
Magalir Kuzhu Management System`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff;">
      <div style="background-color: #0f766e; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">Magalir Kuzhu Management System</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Official Cash Repayment Receipt</p>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p>Dear <strong>${memberName}</strong>,</p>
        <p>Your cash repayment of <strong style="color: #0f766e; font-size: 17px;">₹${receipt.amount}</strong> has been recorded successfully.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 4px 0; color: #64748b;">Receipt Number:</td><td style="font-weight: 600;">${receipt.receipt_number}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Loan Account Number:</td><td style="font-weight: 600;">${receipt.loan_account_number}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Amount Received:</td><td style="font-weight: 700; color: #0f766e;">₹${receipt.amount}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Payment Method:</td><td style="font-weight: 600;">CASH</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Payment Date:</td><td style="font-weight: 600;">${receipt.payment_date}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Total Paid So Far:</td><td style="font-weight: 600;">₹${receipt.total_paid}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Remaining Balance:</td><td style="font-weight: 700; color: ${receipt.remaining_balance <= 0 ? '#16a34a' : '#b45309'};">₹${receipt.remaining_balance}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Next Due Date:</td><td style="font-weight: 600;">${receipt.remaining_balance <= 0 ? 'Fully Repaid 🎉' : receipt.next_due_date}</td></tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b;">Please retain this email as proof of payment.</p>
        <p>Regards,<br><strong>Magalir Kuzhu Management System</strong></p>
      </div>
    </div>
  `;

  return dispatchEmail({
    recipientEmail: memberEmail,
    recipientName: memberName,
    notificationType: 'CASH_REPAYMENT',
    relatedLoanId: receipt.loan_id,
    relatedTransactionId: receipt.id,
    subject,
    body,
    html
  });
}

// 4. UPI Repayment Receipt Email
async function sendUpiRepaymentEmail(memberEmail, memberName, receipt) {
  const subject = 'UPI Repayment Receipt – Magalir Kuzhu';
  const body = `Dear ${memberName},

Your UPI repayment has been recorded successfully.

Payment Details:
- Receipt Number: ${receipt.receipt_number}
- Loan Account Number: ${receipt.loan_account_number}
- Amount Received: ₹${receipt.amount}
- Payment Method: UPI (Recorded)
- UPI Reference: ${receipt.transaction_reference || 'Self-Reported'}
- Payment Date: ${receipt.payment_date}
- Total Paid So Far: ₹${receipt.total_paid}
- Remaining Balance: ₹${receipt.remaining_balance}
- Next Due Date: ${receipt.remaining_balance <= 0 ? 'Fully Repaid' : receipt.next_due_date}

Please retain this email for your records.

Regards,
Magalir Kuzhu Management System`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff;">
      <div style="background-color: #0f766e; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">Magalir Kuzhu Management System</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Official UPI Repayment Receipt</p>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p>Dear <strong>${memberName}</strong>,</p>
        <p>Your UPI repayment of <strong style="color: #0f766e; font-size: 17px;">₹${receipt.amount}</strong> has been recorded successfully.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 4px 0; color: #64748b;">Receipt Number:</td><td style="font-weight: 600;">${receipt.receipt_number}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Loan Account Number:</td><td style="font-weight: 600;">${receipt.loan_account_number}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Amount Received:</td><td style="font-weight: 700; color: #0f766e;">₹${receipt.amount}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Payment Method:</td><td style="font-weight: 600;">UPI (Recorded)</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">UPI Reference:</td><td style="font-weight: 600;">${receipt.transaction_reference || 'N/A'}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Payment Date:</td><td style="font-weight: 600;">${receipt.payment_date}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Total Paid So Far:</td><td style="font-weight: 600;">₹${receipt.total_paid}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Remaining Balance:</td><td style="font-weight: 700; color: ${receipt.remaining_balance <= 0 ? '#16a34a' : '#b45309'};">₹${receipt.remaining_balance}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Next Due Date:</td><td style="font-weight: 600;">${receipt.remaining_balance <= 0 ? 'Fully Repaid 🎉' : receipt.next_due_date}</td></tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b;">Please retain this email as proof of payment.</p>
        <p>Regards,<br><strong>Magalir Kuzhu Management System</strong></p>
      </div>
    </div>
  `;

  return dispatchEmail({
    recipientEmail: memberEmail,
    recipientName: memberName,
    notificationType: 'UPI_REPAYMENT',
    relatedLoanId: receipt.loan_id,
    relatedTransactionId: receipt.id,
    subject,
    body,
    html
  });
}

// 5. Loan Rejection Email
async function sendLoanRejectionEmail(memberEmail, memberName, loan, reason, stage) {
  const subject = 'Update on Your Magalir Kuzhu Loan Application';
  const body = `Dear ${memberName},

We regret to inform you that your loan application for ₹${loan.amount} has not been approved at the ${stage} review stage.

Reason for decision:
${reason || 'Criteria not met.'}

You may contact your Group Admin for guidance or submit a revised application in the next cycle.

Regards,
Magalir Kuzhu Management System`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 8px; overflow: hidden; background: #ffffff;">
      <div style="background-color: #991b1b; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">Magalir Kuzhu Management System</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Loan Application Decision Notice</p>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p>Dear <strong>${memberName}</strong>,</p>
        <p>Your loan application for ₹${loan.amount} was not approved at the <strong>${stage}</strong> stage.</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; border-radius: 4px; margin: 16px 0;">
          <strong style="color: #991b1b;">Recorded Reason:</strong>
          <p style="margin: 6px 0 0 0; color: #7f1d1d;">${reason || 'Application requirements or credit criteria were not satisfied.'}</p>
        </div>

        <p>You can consult your Group Admin to address these requirements and re-apply in the future.</p>
        <p>Regards,<br><strong>Magalir Kuzhu Management System</strong></p>
      </div>
    </div>
  `;

  return dispatchEmail({
    recipientEmail: memberEmail,
    recipientName: memberName,
    notificationType: 'LOAN_REJECTION',
    relatedLoanId: loan.id,
    subject,
    body,
    html
  });
}

// 6. Retry Failed Email from Outbox
async function retryEmail(emailId) {
  const outbox = readCollection('email_outbox');
  const index = outbox.findIndex(e => e.id === emailId);
  if (index === -1) {
    throw new Error('Email record not found in outbox.');
  }

  const record = outbox[index];
  record.attempt_count = (record.attempt_count || 1) + 1;

  const fromAddress = process.env.SMTP_FROM || '"Magalir Kuzhu Management" <notifications@magalirkuzhu.org>';
  try {
    const client = await getTransporter();
    const info = await client.sendMail({
      from: fromAddress,
      to: record.recipient_email,
      subject: record.subject,
      text: record.body,
      html: record.html
    });

    if (isEthereal && nodemailer.getTestMessageUrl) {
      record.preview_url = nodemailer.getTestMessageUrl(info) || null;
    }
    record.details = info.messageId || 'Delivered';
    record.delivery_status = 'SENT';
    record.sent_at = new Date().toISOString();
    record.last_error = null;
  } catch (err) {
    record.delivery_status = 'FAILED';
    record.last_error = err.message;
  }

  writeCollection('email_outbox', outbox);
  return record;
}

module.exports = {
  sendLoanSanctionEmail,
  sendLoanDisbursementEmail,
  sendCashRepaymentEmail,
  sendUpiRepaymentEmail,
  sendLoanRejectionEmail,
  retryEmail
};
