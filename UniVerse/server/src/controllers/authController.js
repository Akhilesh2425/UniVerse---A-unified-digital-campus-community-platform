import { User } from '../models/User.js';
import { sendTokenResponse, clearTokenCookie } from '../utils/jwt.js';
import { ROLES } from '../utils/constants.js';

/**
 * Register a new student account
 * POST /api/auth/register
 */
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

    // Field presence checks
    if (!name || !email || !password || !department || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, department, and academic year.',
      });
    }

    // Password confirmation check
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    // Password length enforcement
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Duplicate email check
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Create user - strictly enforce STUDENT role (cannot be overridden by client)
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

/**
 * Log in to existing account
 * POST /api/auth/login
 */
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

    // Find user including password hash
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    return sendTokenResponse(res, 200, user, 'Logged in successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Log out from current session
 * POST /api/auth/logout
 */
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

/**
 * Get current authenticated user (session restoration)
 * GET /api/auth/me
 */
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
