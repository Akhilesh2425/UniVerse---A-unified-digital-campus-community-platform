import mongoose from 'mongoose';
import { StudentForm } from '../models/StudentForm.js';
import { FormWishlist } from '../models/FormWishlist.js';
import { FORM_CATEGORIES, FORM_STATUS, ROLES } from '../utils/constants.js';
import { runFormDeadlineReminders } from '../services/formReminderScheduler.js';

export const getForms = async (req, res, next) => {
  try {
    const { search, category, status = 'open', sort = 'deadline-asc' } = req.query;

    const query = {};

    if (status && status !== 'all') {
      if (status === 'expired') {
        query.deadline = { $lt: new Date() };
      } else if (status === 'open') {
        query.deadline = { $gte: new Date() };
        query.status = FORM_STATUS.OPEN;
      } else {
        query.status = status;
      }
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { description: regex }, { targetAudience: regex }];
    }

    if (category && category !== 'All' && FORM_CATEGORIES.includes(category)) {
      query.category = category;
    }

    let sortOption = { deadline: 1 }; 
    if (sort === 'deadline-desc') sortOption = { deadline: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'popular') sortOption = { wishlistCount: -1 };

    const forms = await StudentForm.find(query)
      .populate('publishedBy', 'name email role')
      .populate('club', 'name logo')
      .sort(sortOption)
      .lean();

    if (req.user) {
      const userWishlist = await FormWishlist.find({ user: req.user._id });
      const wishlistMap = new Map();
      userWishlist.forEach((w) => wishlistMap.set(w.form.toString(), w));

      forms.forEach((f) => {
        const item = wishlistMap.get(f._id.toString());
        f.isWishlisted = !!item;
        f.reminderEnabled = item ? item.reminderEnabled : false;
        f.wishlistNotes = item ? item.notes : '';
      });
    }

    return res.status(200).json({ success: true, forms });
  } catch (error) {
    next(error);
  }
};

export const getFormById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid form ID format.' });
    }

    const form = await StudentForm.findById(id)
      .populate('publishedBy', 'name email role department')
      .populate('club', 'name logo category')
      .lean();

    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found.' });
    }

    let isWishlisted = false;
    let reminderEnabled = false;

    if (req.user) {
      const item = await FormWishlist.findOne({ form: id, user: req.user._id });
      isWishlisted = !!item;
      reminderEnabled = item ? item.reminderEnabled : false;
    }

    return res.status(200).json({
      success: true,
      form: {
        ...form,
        isWishlisted,
        reminderEnabled,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createForm = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      formUrl,
      deadline,
      targetAudience = 'All Students',
      eligibleDepartments = [],
      clubId = null,
      attachmentUrl = '',
    } = req.body;

    const effectiveUrl = (formUrl || req.body.linkUrl || '').trim();

    if (!title || !description || !category || !effectiveUrl || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, form link, and deadline are required.',
      });
    }

    if (!/^https?:\/\/.+/.test(effectiveUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Form URL must be a valid web link starting with http:// or https://.',
      });
    }

    const newForm = await StudentForm.create({
      title: title.trim(),
      description: description.trim(),
      category: FORM_CATEGORIES.includes(category) ? category : 'Other',
      formUrl: effectiveUrl,
      deadline: new Date(deadline),
      targetAudience: targetAudience.trim(),
      eligibleDepartments: Array.isArray(eligibleDepartments) ? eligibleDepartments : [],
      publishedBy: req.user._id,
      club: clubId || null,
      attachmentUrl: attachmentUrl.trim(),
      status: FORM_STATUS.OPEN,
    });

    return res.status(201).json({
      success: true,
      message: 'Student opportunity form published successfully.',
      form: newForm,
    });
  } catch (error) {
    next(error);
  }
};

export const updateForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, formUrl, deadline, targetAudience, status } = req.body;

    const form = await StudentForm.findById(id);
    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found.' });
    }

    const isPlatformAdmin = req.user.role === ROLES.ADMIN || req.user.role === ROLES.MAIN_ADMIN;
    const isPublisher = form.publishedBy.toString() === req.user._id.toString();

    if (!isPlatformAdmin && !isPublisher) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    if (title) form.title = title.trim();
    if (description) form.description = description.trim();
    if (category) form.category = category;
    if (formUrl) form.formUrl = formUrl.trim();
    if (deadline) form.deadline = new Date(deadline);
    if (targetAudience) form.targetAudience = targetAudience.trim();
    if (status) form.status = status;

    await form.save();

    return res.status(200).json({
      success: true,
      message: 'Form updated successfully.',
      form,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteForm = async (req, res, next) => {
  try {
    const { id } = req.params;

    const form = await StudentForm.findById(id);
    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found.' });
    }

    const isPlatformAdmin = req.user.role === ROLES.ADMIN || req.user.role === ROLES.MAIN_ADMIN;
    if (!isPlatformAdmin && form.publishedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    await StudentForm.findByIdAndDelete(id);
    await FormWishlist.deleteMany({ form: id });

    return res.status(200).json({
      success: true,
      message: 'Form deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMyWishlist = async (req, res, next) => {
  try {
    const wishlistItems = await FormWishlist.find({ user: req.user._id })
      .populate({
        path: 'form',
        populate: [
          { path: 'publishedBy', select: 'name email role' },
          { path: 'club', select: 'name logo' },
        ],
      })
      .sort({ createdAt: -1 });

    const validItems = wishlistItems.filter((item) => item.form !== null);

    return res.status(200).json({
      success: true,
      wishlist: validItems,
    });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reminderEnabled = true, notes = '' } = req.body;

    const form = await StudentForm.findById(id);
    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found.' });
    }

    const existing = await FormWishlist.findOne({ user: req.user._id, form: id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This opportunity is already in your wishlist.',
      });
    }

    const item = await FormWishlist.create({
      user: req.user._id,
      form: id,
      reminderEnabled: Boolean(reminderEnabled),
      notes: notes.trim(),
    });

    await StudentForm.findByIdAndUpdate(id, { $inc: { wishlistCount: 1 } });

    return res.status(201).json({
      success: true,
      message: 'Opportunity saved to your wishlist! Daily reminders will notify you before deadline.',
      item,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await FormWishlist.findOneAndDelete({ user: req.user._id, form: id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in wishlist.' });
    }

    await StudentForm.findByIdAndUpdate(id, { $inc: { wishlistCount: -1 } });

    return res.status(200).json({
      success: true,
      message: 'Removed from wishlist.',
    });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlistReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reminderEnabled } = req.body;

    const item = await FormWishlist.findOne({ user: req.user._id, form: id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in wishlist.' });
    }

    item.reminderEnabled = Boolean(reminderEnabled);
    await item.save();

    return res.status(200).json({
      success: true,
      message: `Deadline reminders ${item.reminderEnabled ? 'enabled' : 'disabled'}.`,
      reminderEnabled: item.reminderEnabled,
    });
  } catch (error) {
    next(error);
  }
};

export const runRemindersManual = async (req, res, next) => {
  try {
    const results = await runFormDeadlineReminders();
    return res.status(200).json({
      success: true,
      message: 'Daily deadline reminders job executed successfully.',
      processed: results.processed,
      remindersSent: results.sent,
      skippedDuplicates: results.skippedDuplicates,
      results,
    });
  } catch (error) {
    next(error);
  }
};
