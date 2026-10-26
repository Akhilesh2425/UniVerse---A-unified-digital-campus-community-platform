import { User } from '../models/User.js';

/**
 * Get current user profile
 * GET /api/users/me
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 * PATCH /api/users/me
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, department, academicYear, interests, avatarUrl } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Full name cannot be empty.',
        });
      }
      updates.name = name.trim();
    }

    if (department !== undefined) {
      if (!department.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Department cannot be empty.',
        });
      }
      updates.department = department.trim();
    }

    if (academicYear !== undefined) {
      if (!academicYear.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Academic year cannot be empty.',
        });
      }
      updates.academicYear = academicYear.trim();
    }

    if (interests !== undefined) {
      if (Array.isArray(interests)) {
        updates.interests = interests.map((i) => String(i).trim()).filter(Boolean);
      } else if (typeof interests === 'string') {
        updates.interests = interests
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean);
      }
    }

    if (avatarUrl !== undefined) {
      updates.avatarUrl = avatarUrl.trim();
    }

    // Save updates
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
