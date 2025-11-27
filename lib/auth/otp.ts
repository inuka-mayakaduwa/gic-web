
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export function generateOtp() {
    // Generate a 6-digit OTP
    return crypto.randomInt(100000, 999999).toString();
}

export async function hashOtp(otp: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
}

export async function verifyOtp(otp: string, hashedOtp: string) {
    return bcrypt.compare(otp, hashedOtp);
}
