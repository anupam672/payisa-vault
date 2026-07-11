const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

// Verify the connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Error connecting to email server:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

/**
 * Wraps inner HTML content in the shared Payisa Vault email shell
 * (dark header bar, white card body, footer). Uses inline styles and a
 * table-based layout throughout because most email clients (Gmail,
 * Outlook) strip <style> blocks and have poor support for modern CSS.
 *
 * @param {string} bodyHtml - inner HTML for the card body
 * @param {string} [eyebrow] - small label shown above the heading, e.g. "TRANSACTION"
 */
function renderEmailShell(bodyHtml, eyebrow) {
    return `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#F7F5EF; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5EF; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#FFFFFF; border-radius:6px; overflow:hidden; border:1px solid #DCD8CC;">

            <!-- Header -->
            <tr>
              <td style="background-color:#0F1420; padding:24px 32px;">
                <span style="color:#2A7B73; font-size:20px; font-weight:bold; font-family: Georgia, serif;">&sect;</span>
                <span style="color:#F7F5EF; font-size:18px; font-weight:bold; font-family: Georgia, serif; margin-left:6px;">Payisa Vault</span>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                ${eyebrow ? `<p style="margin:0 0 12px 0; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#2A7B73; font-weight:bold;">${eyebrow}</p>` : ""}
                ${bodyHtml}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 32px; background-color:#F7F5EF; border-top:1px solid #DCD8CC;">
                <p style="margin:0; font-size:12px; color:#8C96A3;">
                  This is an automated message from Payisa Vault. Please do not reply to this email.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

// Function to send email
const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Payisa Vault" <${process.env.EMAIL_USER}>`, // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            html, // html body
        });

        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending email:', error);
    }
};


async function sendRegistrationEmail(userEmail, name) {
    const subject = 'Welcome to Payisa Vault!';
    const text = `Hello ${name},\n\nThank you for registering at Payisa Vault. We're excited to have you on board!\n\nBest regards,\nThe Payisa Vault Team`;

    const body = `
      <h1 style="margin:0 0 16px 0; font-size:24px; color:#0F1420; font-family: Georgia, serif;">Welcome, ${name}</h1>
      <p style="margin:0 0 24px 0; font-size:14px; line-height:1.6; color:#5B6B7A;">
        Thanks for creating a Payisa Vault account. Your account is ready to go — open your first
        account to receive a welcome credit and start sending funds right away.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background-color:#0F1420; border-radius:4px;">
            <a href="#" style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:bold; color:#F7F5EF; text-decoration:none;">
              Go to Dashboard
            </a>
          </td>
        </tr>
      </table>
    `;

    const html = renderEmailShell(body, "Welcome");

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Successful!';
    const text = `Hello ${name},\n\nYour transaction of Rs. ${amount} to account ${toAccount} was successful.\n\nBest regards,\nThe Payisa Vault Team`;

    const body = `
      <h1 style="margin:0 0 20px 0; font-size:22px; color:#0F1420; font-family: Georgia, serif;">Transfer complete</h1>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5EF; border-radius:4px; margin-bottom:20px;">
        <tr>
          <td style="padding:20px; text-align:center;">
            <p style="margin:0; font-family: 'Courier New', monospace; font-size:28px; font-weight:bold; color:#B3432B;">
              &minus; &#8377;${amount}
            </p>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0; font-size:13px; color:#5B6B7A;">Recipient</td>
          <td style="padding:8px 0; font-size:13px; color:#0F1420; font-family:'Courier New', monospace; text-align:right;">${toAccount}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; font-size:13px; color:#5B6B7A; border-top:1px solid #DCD8CC;">Status</td>
          <td style="padding:8px 0; font-size:13px; text-align:right; border-top:1px solid #DCD8CC;">
            <span style="background-color:#E8F3EC; color:#1C7C54; font-size:11px; font-weight:bold; padding:3px 8px; border-radius:2px; font-family:'Courier New', monospace;">COMPLETED</span>
          </td>
        </tr>
      </table>

      <p style="margin:24px 0 0 0; font-size:13px; line-height:1.6; color:#5B6B7A;">
        Hi ${name}, this confirms your transfer went through. If you didn't make this transaction, contact support immediately.
      </p>
    `;

    const html = renderEmailShell(body, "Transaction");

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Failed';
    const text = `Hello ${name},\n\nWe regret to inform you that your transaction of Rs. ${amount} to account ${toAccount} has failed. Please try again later.\n\nBest regards,\nThe Payisa Vault Team`;

    const body = `
      <h1 style="margin:0 0 20px 0; font-size:22px; color:#0F1420; font-family: Georgia, serif;">Transfer failed</h1>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FBEBE5; border-radius:4px; margin-bottom:20px;">
        <tr>
          <td style="padding:20px; text-align:center;">
            <p style="margin:0; font-family: 'Courier New', monospace; font-size:28px; font-weight:bold; color:#B3432B;">
              &#8377;${amount}
            </p>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0; font-size:13px; color:#5B6B7A;">Recipient</td>
          <td style="padding:8px 0; font-size:13px; color:#0F1420; font-family:'Courier New', monospace; text-align:right;">${toAccount}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; font-size:13px; color:#5B6B7A; border-top:1px solid #DCD8CC;">Status</td>
          <td style="padding:8px 0; font-size:13px; text-align:right; border-top:1px solid #DCD8CC;">
            <span style="background-color:#FBEBE5; color:#B3432B; font-size:11px; font-weight:bold; padding:3px 8px; border-radius:2px; font-family:'Courier New', monospace;">FAILED</span>
          </td>
        </tr>
      </table>

      <p style="margin:24px 0 0 0; font-size:13px; line-height:1.6; color:#5B6B7A;">
        Hi ${name}, we weren't able to complete this transfer. No funds were deducted. Please try again in a few minutes.
      </p>
    `;

    const html = renderEmailShell(body, "Transaction");

    await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
};