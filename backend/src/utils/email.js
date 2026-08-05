import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('⚠️ Email not configured. SMTP settings missing.');
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
      from: process.env.EMAIL_FROM || 'noreply@shp.com',
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    });

    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Email send error:', error.message);
  }
};

export const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to SHP!',
    text: `Welcome ${user.username}!\n\nThank you for joining SHP (SubhanHostPanel). You've received a signup bonus of coins to get started.\n\nExplore our products and start your journey today!\n\nBest regards,\nThe SHP Team`,
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