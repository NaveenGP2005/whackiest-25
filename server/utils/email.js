const nodemailer = require("nodemailer");

// Create transporter - use Gmail or any SMTP service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || "noreply@wanderforge.com",
    to: email,
    subject: "WanderForge - Email Verification OTP",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7); padding: 30px; border-radius: 16px; text-align: center;">
          <h1 style="color: white; font-size: 28px; margin: 0 0 10px 0;">WanderForge</h1>
          <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">AI-Powered Travel Planning</p>
        </div>

        <div style="background: #1a1a2e; padding: 40px 30px; border-radius: 16px; margin-top: -20px;">
          <h2 style="color: #e0e0e0; text-align: center; margin-bottom: 20px;">Verify Your Email</h2>
          <p style="color: #a0a0a0; text-align: center; margin-bottom: 30px;">
            Use the following OTP to complete your verification:
          </p>

          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; font-size: 42px; letter-spacing: 12px; margin: 0; font-family: monospace;">${otp}</h1>
          </div>

          <p style="color: #a0a0a0; text-align: center; font-size: 14px;">
            This OTP is valid for <strong style="color: #a855f7;">10 minutes</strong>.
          </p>
          <p style="color: #666; text-align: center; font-size: 12px; margin-top: 20px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>

        <p style="color: #666; text-align: center; font-size: 12px; margin-top: 20px;">
          &copy; 2024 WanderForge. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    // For development, log OTP to console if email fails
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return true; // Return true anyway for development
  }
};

module.exports = { generateOTP, sendOTPEmail };
