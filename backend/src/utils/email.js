import nodemailer from 'nodemailer';

const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('Email not configured. SMTP settings missing.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email not sent (SMTP not configured):', subject);
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    });
  } catch (error) {
    console.error('Email send error:', error.message);
  }
};

export const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Welcome',
    text: `Welcome ${user.username}!\n\nYour account is ready. Explore your dashboard to manage services and billing.`,
  });
};

export const sendOrderConfirmationEmail = async (user, order) => {
  await sendEmail({
    to: user.email,
    subject: 'Order Confirmation',
    text: `Thank you for your order!\n\nOrder ID: ${order.id}\nTotal: $${order.totalAmount}\nStatus: ${order.status}\n\nWe're processing your order now.`,
  });
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    text: `You requested a password reset.\n\nClick the link to reset your password:\n${process.env.FRONTEND_URL}/reset-password?token=${resetToken}\n\nIf you didn't request this, please ignore this email.`,
  });
};

export const sendServerDetailsEmail = async (user, server, panel = null) => {
  const panelUrl = panel?.url || '';
  await sendEmail({
    to: user.email,
    subject: `Your server "${server.name}" is ready`,
    html: `
      <h2>Your server is ready!</h2>
      <p>Hi <strong>${user.username}</strong>,</p>
      <p>Your server <strong>${server.name}</strong> has been provisioned successfully.</p>
      <ul>
        <li>RAM: ${server.ram}MB</li>
        <li>CPU: ${server.cpu}%</li>
        <li>Disk: ${server.disk}MB</li>
        <li>Expires: ${new Date(server.expiresAt).toLocaleDateString()}</li>
      </ul>
      ${panelUrl ? `<p>Manage it at: <a href="${panelUrl}">${panelUrl}</a></p>` : ''}
      <p>Thanks,<br/>The Team</p>
    `,
  });
};

export const sendCoinsCreditedEmail = async (user, amount, reason) => {
  await sendEmail({
    to: user.email,
    subject: `${amount} Coins added to your account`,
<<<<<<< HEAD
    text: `Hi ${user.username},\n\n${amount} coins have been added to your balance${reason ? ` (${reason})` : ''}.\n\nCurrent balance: ${user.coins} coins.`,
  });
};
=======
    text: `Hi ${user.username},\n\n${amount} SHP Coins have been added to your balance${reason ? ` (${reason})` : ''}.\n\nCurrent balance: ${user.coins} SHP Coins.`,
  });
};
>>>>>>> 2fcb765a8dff6dee639ecb4dfe2738a2ffff9cf3
