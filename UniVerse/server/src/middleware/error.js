/**
 * Centralized API error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for server diagnostics (masking sensitive data)
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error Handler] ${req.method} ${req.originalUrl}:`, err.message);
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format for field '${err.path}'`,
    });
  }

  // Handle Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    let customMessage = 'A resource with this identifier already exists.';
    if (field === 'email') {
      customMessage = 'An account with this email address already exists.';
    } else if (field === 'event') {
      customMessage = 'You are already registered for this event.';
    } else if (field === 'group' || field === 'user') {
      customMessage = 'You are already a member or have an active membership for this community.';
    }

    return res.status(409).json({
      success: false,
      message: customMessage,
      field,
    });
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. '),
      errors: messages,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid session token. Please log in again.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Session has expired. Please log in again.',
    });
  }

  // Default fallback internal error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
