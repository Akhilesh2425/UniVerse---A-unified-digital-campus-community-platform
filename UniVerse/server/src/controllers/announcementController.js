import mongoose from 'mongoose';
import { Announcement } from '../models/Announcement.js';
import { ANNOUNCEMENT_CATEGORIES, ANNOUNCEMENT_PRIORITIES, ROLES } from '../utils/constants.js';

/**
 * Get all announcements with category, search, and publication filtering
 * GET /api/announcements
 */
export const getAnnouncements = async (req, res, next) => {
  try {
    const { category, search, priority, includeDrafts } = req.query;

    const query = {};

    // Security check: only administrators can view drafts / unpublished announcements
    const isAdmin = req.user && req.user.role === ROLES.ADMIN;
    if (!isAdmin || includeDrafts !== 'true') {
      query.isPublished = true;
    }

    // Category filter
    if (category && category !== 'All') {
      if (ANNOUNCEMENT_CATEGORIES.includes(category)) {
        query.category = category;
      }
    }

    // Priority filter
    if (priority && ANNOUNCEMENT_PRIORITIES.includes(priority)) {
      query.priority = priority;
    }

    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
      ];
    }

    const announcements = await Announcement.find(query)
      .populate('author', 'name email role')
      .sort({ priority: -1, publishedAt: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single announcement by ID
 * GET /api/announcements/:id
 */
export const getAnnouncementById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid announcement ID format.',
      });
    }

    const announcement = await Announcement.findById(id).populate('author', 'name email role');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.',
      });
    }

    // Security check: non-admins cannot view unpublished draft announcements
    const isAdmin = req.user && req.user.role === ROLES.ADMIN;
    if (!announcement.isPublished && !isAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found or has been unpublished.',
      });
    }

    return res.status(200).json({
      success: true,
      announcement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new announcement (Admin only)
 * POST /api/announcements
 */
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, category, priority = 'normal', isPublished = true } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, content, and category.',
      });
    }

    if (!ANNOUNCEMENT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${ANNOUNCEMENT_CATEGORIES.join(', ')}`,
      });
    }

    if (!ANNOUNCEMENT_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Must be one of: ${ANNOUNCEMENT_PRIORITIES.join(', ')}`,
      });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      isPublished: Boolean(isPublished),
      publishedAt: isPublished ? new Date() : null,
      author: req.user._id,
    });

    const populated = await Announcement.findById(announcement._id).populate('author', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Announcement created successfully.',
      announcement: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an announcement (Admin only)
 * PATCH /api/announcements/:id
 */
export const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid announcement ID format.',
      });
    }

    const existing = await Announcement.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.',
      });
    }

    const { title, content, category, priority, isPublished } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content.trim();

    if (category !== undefined) {
      if (!ANNOUNCEMENT_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${ANNOUNCEMENT_CATEGORIES.join(', ')}`,
        });
      }
      updates.category = category;
    }

    if (priority !== undefined) {
      if (!ANNOUNCEMENT_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority. Must be one of: ${ANNOUNCEMENT_PRIORITIES.join(', ')}`,
        });
      }
      updates.priority = priority;
    }

    if (isPublished !== undefined) {
      const willPublish = Boolean(isPublished);
      updates.isPublished = willPublish;
      if (willPublish && !existing.publishedAt) {
        updates.publishedAt = new Date();
      }
    }

    const updated = await Announcement.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('author', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Announcement updated successfully.',
      announcement: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an announcement (Admin only)
 * DELETE /api/announcements/:id
 */
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid announcement ID format.',
      });
    }

    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
