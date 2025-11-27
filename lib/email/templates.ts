
export const otpTemplate = (otp: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #30C3CD; text-align: center; margin: 20px 0; }
    .footer { font-size: 12px; color: #666; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>GIC Login Verification</h2>
    </div>
    <p>Hello,</p>
    <p>You requested a login code for the Government Information Center system.</p>
    <p>Please use the following OTP to complete your login:</p>
    
    <div class="otp-code">${otp}</div>
    
    <p>This code will expire in 10 minutes.</p>
    <p>If you did not request this code, please ignore this email.</p>
    
    <div class="footer">
      &copy; ${new Date().getFullYear()} Government Information Center. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
