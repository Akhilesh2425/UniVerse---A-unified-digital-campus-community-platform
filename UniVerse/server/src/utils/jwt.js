import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }
  return secret;
};

/**
 * Generate a signed JWT token
 */
export const signToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '7d',
  });
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

/**
 * Attach HTTP-only cookie and return standard JSON response
 */
export const sendTokenResponse = (res, statusCode, user, message = 'Success') => {
  const token = signToken({
    id: user._id,
    role: user.role,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };

  res.cookie('token', token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    message,
    token, // Provided for Authorization header fallback
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      academicYear: user.academicYear,
      interests: user.interests,
      avatarUrl: user.avatarUrl,
    },
  });
};

/**
 * Clear the authentication cookie
 */
export const clearTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
};
