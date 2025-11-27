
import nodemailer from 'nodemailer';
import { otpTemplate } from './templates';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendOtpEmail(email: string, otp: string) {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Your GIC Login Code',
            html: otpTemplate(otp),
        });
        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}
