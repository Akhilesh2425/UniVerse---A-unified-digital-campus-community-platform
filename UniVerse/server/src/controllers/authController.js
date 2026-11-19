import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { PasswordResetOtp } from '../models/PasswordResetOtp.js';
import { sendOtpEmail, sendEmail } from '../services/emailService.js';
import { sendTokenResponse, clearTokenCookie } from '../utils/jwt.js';
import { ROLES, USER_STATUS } from '../utils/constants.js';

export const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      department,
      academicYear,
      interests,
    } = req.body;

    if (!name || !email || !password || !department || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, department, and academic year.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: ROLES.STUDENT,
      department: department.trim(),
      academicYear: academicYear.trim(),
      interests: Array.isArray(interests) ? interests : [],
    });

    return sendTokenResponse(res, 201, newUser, 'Account registered successfully.');
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    if (user.status && user.status !== USER_STATUS.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: `Your account is currently ${user.status}. Reason: ${user.statusReason || 'Please contact campus administration.'}`,
      });
    }

    user.lastLogin = new Date();
    await user.save();

    return sendTokenResponse(res, 200, user, 'Logged in successfully.');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    clearTokenCookie(res);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        academicYear: req.user.academicYear,
        interests: req.user.interests,
        avatarUrl: req.user.avatarUrl,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    let { email } = req.body;

    if (typeof email === 'object' && email !== null) {
      email = email.email || '';
    }

    const normalizedEmail = (email || '').toString().toLowerCase().trim();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid registered email address.',
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account is associated with this email, a 6-digit verification code has been dispatched.',
      });
    }

    const recentOtp = await PasswordResetOtp.findOne({
      email: normalizedEmail,
      isUsed: false,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });

    if (recentOtp) {
      return res.status(429).json({
        success: false,
        message: 'Please wait at least 60 seconds before requesting another code.',
      });
    }

    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    await PasswordResetOtp.create({
      email: normalizedEmail,
      user: user._id,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const emailResult = await sendOtpEmail(normalizedEmail, rawOtp, user.name);

    console.log(`\n==================================================`);
    console.log(`[AUTH OTP DISPATCHED]`);
    console.log(`To: ${normalizedEmail}`);
    console.log(`OTP Code: ${rawOtp} (Valid for 5 minutes)`);
    console.log(`Delivery Mode: ${emailResult?.simulated ? 'SIMULATED (No SMTP credentials in server/.env)' : 'LIVE SMTP EMAIL'}`);
    console.log(`==================================================\n`);

    return res.status(200).json({
      success: true,
      simulated: Boolean(emailResult?.simulated),
      simulatedOtp: emailResult?.simulated ? rawOtp : undefined,
      message: emailResult?.simulated
        ? 'A 6-digit verification code has been generated in local simulation mode.'
        : 'A 6-digit verification code has been dispatched to your email address.',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    let { email, otp } = req.body;

    if (typeof email === 'object' && email !== null) {
      otp = otp || email.otp;
      email = email.email || '';
    }

    const normalizedEmail = (email || '').toString().toLowerCase().trim();
    const cleanOtp = (otp || '').toString().trim();

    if (!normalizedEmail || !cleanOtp) {
      return res.status(400).json({
        success: false,
        message: 'Email and 6-digit verification code are required.',
      });
    }

    const otpDoc = await PasswordResetOtp.findOne({
      email: normalizedEmail,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'The verification code has expired or is invalid. Please request a new code.',
      });
    }

    if (otpDoc.attempts >= 5) {
      otpDoc.isUsed = true;
      await otpDoc.save();
      return res.status(400).json({
        success: false,
        message: 'Too many failed verification attempts. Please request a new code.',
      });
    }

    const isMatch = await bcrypt.compare(cleanOtp, otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({
        success: false,
        message: `Invalid code. ${5 - otpDoc.attempts} attempt(s) remaining.`,
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    otpDoc.verificationToken = verificationToken;
    await otpDoc.save();

    return res.status(200).json({
      success: true,
      message: 'Code verified successfully. You may now set your new password.',
      verificationToken,
      resetToken: verificationToken,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    let { email, verificationToken, newPassword, confirmPassword, resetToken } = req.body;

    if (typeof email === 'object' && email !== null) {
      verificationToken = verificationToken || email.verificationToken;
      resetToken = resetToken || email.resetToken;
      newPassword = newPassword || email.newPassword;
      confirmPassword = confirmPassword || email.confirmPassword;
      email = email.email || '';
    }

    const effectiveToken = verificationToken || resetToken;
    const normalizedEmail = (email || '').toString().toLowerCase().trim();

    if (!normalizedEmail || !effectiveToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, verification token, and new password are required.',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const otpDoc = await PasswordResetOtp.findOne({
      email: normalizedEmail,
      verificationToken: effectiveToken,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is invalid or expired. Please start the process again.',
      });
    }

    const user = await User.findById(otpDoc.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    user.password = newPassword;
    await user.save();

    otpDoc.isUsed = true;
    otpDoc.verificationToken = '';
    await otpDoc.save();

    sendEmail({
      to: normalizedEmail,
      recipientId: user._id,
      subject: 'Your UniVerse Password Has Been Reset',
      html: `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;">
          <h2 style="color: #0b1728;">Password Successfully Updated</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>The password for your UniVerse account (${normalizedEmail}) has been successfully updated.</p>
          <p>If you did not make this change, please contact campus administration immediately.</p>
        </div>
      `,
      category: 'system',
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new credentials.',
    });
  } catch (error) {
    next(error);
  }
};
