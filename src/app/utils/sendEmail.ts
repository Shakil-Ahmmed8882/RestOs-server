
import nodemailer from 'nodemailer';
import config from '../config';

export const sendEmail = async (to: string, html: string) => {
  try {
    console.log('📧 Starting email send...');
    console.log('SMTP Config:', {
      host: config.smtp_host,
      port: config.smtp_port,
      user: config.smtp_user,
      NODE_ENV: config.NODE_ENV,
    });

    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.NODE_ENV === 'production',
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass,
      },
    });

    console.log('✅ Transporter created');

    const mailOptions = {
      from: config.smtp_user,
      to,
      subject: 'Reset your password within 10 minutes!',
      text: '',
      html,
    };

    console.log('📤 Sending email to:', to);
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.response);

    return result;
  } catch (error: any) {
    console.error('❌ Email sending failed:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};