import mongoose from 'mongoose';
import { CampusIssue } from '../models/CampusIssue.js';
import { IssueSupport } from '../models/IssueSupport.js';
import { IssueComment } from '../models/IssueComment.js';
import { IssueStatusHistory } from '../models/IssueStatusHistory.js';
import { IssueUpdate } from '../models/IssueUpdate.js';
import { IssueFeedback } from '../models/IssueFeedback.js';
import { ReopenRequest } from '../models/ReopenRequest.js';
import {
  ISSUE_CATEGORIES,
  ISSUE_PRIORITIES,
  ISSUE_STATUS,
  ISSUE_VISIBILITY,
  ROLES,
} from '../utils/constants.js';

const isUserAdmin = (user) =>
  Boolean(user && (user.role === 'admin' || user.role === 'main_admin' || user.role === ROLES.ADMIN || user.role === ROLES.MAIN_ADMIN));

const generateUniqueReferenceId = async () => {
  const currentYear = new Date().getFullYear();
  let isUnique = false;
  let referenceId = '';

  while (!isUnique) {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    referenceId = `ISS-${currentYear}-${randomSuffix}`;
    const existing = await CampusIssue.findOne({ referenceId });
    if (!existing) {
      isUnique = true;
    }
  }

  return referenceId;
};

const sanitizeReporter = (issue, currentUserId, isAdmin) => {
  const issueObj = issue.toObject ? issue.toObject() : { ...issue };

  if (issueObj.isAnonymousToPublic && issueObj.reporter) {
    const isReporter =
      currentUserId &&
      issueObj.reporter._id &&
      issueObj.reporter._id.toString() === currentUserId.toString();

    if (!isReporter && !isAdmin) {
      issueObj.reporter = {
        _id: issueObj.reporter._id,
        name: 'Campus Community Member',
        department: issueObj.reporter.department || 'Campus Student',
        avatarUrl: '',
        isAnonymous: true,
      };
    }
  }

  return issueObj;
};

export const createIssue = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      location,
      building = '',
      room = '',
      priority = 'medium',
      visibility = ISSUE_VISIBILITY.PUBLIC,
      isAnonymousToPublic = false,
      imageUrl = '',
      images = [],
    } = req.body;

    if (!title || title.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Title is required and must be at least 5 characters.',
      });
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Detailed description is required (minimum 10 characters).',
      });
    }

    if (!category || !ISSUE_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid campus issue category.',
      });
    }

    if (!location || location.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Campus location is required.',
      });
    }

    if (priority && !ISSUE_PRIORITIES.includes(priority.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority level.',
      });
    }

    if (
      visibility &&
      !Object.values(ISSUE_VISIBILITY).includes(visibility.toLowerCase())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visibility option. Choose public or private.',
      });
    }

    const referenceId = await generateUniqueReferenceId();

    const issueImages = Array.isArray(images) && images.length > 0 ? images : [];
    if (imageUrl && !issueImages.includes(imageUrl)) {
      issueImages.unshift(imageUrl);
    }

    const issue = await CampusIssue.create({
      referenceId,
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      building: building ? building.trim() : '',
      room: room ? room.trim() : '',
      priority: priority.toLowerCase(),
      visibility: visibility.toLowerCase(),
      reporter: req.user._id,
      isAnonymousToPublic: Boolean(isAnonymousToPublic),
      status: ISSUE_STATUS.SUBMITTED,
      imageUrl: imageUrl || (issueImages[0] || ''),
      images: issueImages,
    });

    await IssueStatusHistory.create({
      issue: issue._id,
      previousStatus: 'none',
      newStatus: ISSUE_STATUS.SUBMITTED,
      changedBy: req.user._id,
      explanation: 'Issue reported by student and logged into UniVerse campus registry.',
    });

    await IssueUpdate.create({
      issue: issue._id,
      content: `Issue reported and assigned reference ${issue.referenceId}. Awaiting administrative review.`,
      author: req.user._id,
      visibility: 'public',
      relatedStatus: ISSUE_STATUS.SUBMITTED,
    });

    const populatedIssue = await CampusIssue.findById(issue._id)
      .populate('reporter', 'name email department avatarUrl role')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Campus issue reported successfully.',
      referenceId: issue.referenceId,
      issue: populatedIssue,
    });
  } catch (error) {
    next(error);
  }
};

export const getIssues = async (req, res, next) => {
  try {
    const {
      search,
      category,
      status,
      priority,
      location,
      sort = 'newest',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {
      visibility: ISSUE_VISIBILITY.PUBLIC,
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (priority && priority !== 'All') {
      query.priority = priority.toLowerCase();
    }

    if (location && location.trim()) {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { building: searchRegex },
        { referenceId: searchRegex },
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'most-supported') {
      sortOptions = { supportCount: -1, createdAt: -1 };
    } else if (sort === 'priority') {
      sortOptions = { priority: 1, createdAt: -1 };
    }

    const [issues, total] = await Promise.all([
      CampusIssue.find(query)
        .populate('reporter', 'name email department avatarUrl role')
        .populate('assignedTo', 'name department avatarUrl')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CampusIssue.countDocuments(query),
    ]);

    let userSupportedIssueIds = new Set();
    const currentUserId = req.user ? req.user._id : null;
    const isAdmin = isUserAdmin(req.user);

    if (currentUserId && issues.length > 0) {
      const issueIds = issues.map((i) => i._id);
      const supports = await IssueSupport.find({
        user: currentUserId,
        issue: { $in: issueIds },
      })
        .select('issue')
        .lean();

      userSupportedIssueIds = new Set(supports.map((s) => s.issue.toString()));
    }

    const sanitizedIssues = issues.map((issue) => {
      const sanitized = sanitizeReporter(issue, currentUserId, isAdmin);
      sanitized.hasSupported = userSupportedIssueIds.has(issue._id.toString());
      sanitized.isReporter =
        currentUserId &&
        issue.reporter &&
        issue.reporter._id.toString() === currentUserId.toString();
      return sanitized;
    });

    return res.status(200).json({
      success: true,
      issues: sanitizedIssues,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

export const getIssueById = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(issueId)) {
      query = { _id: issueId };
    } else {
      query = { referenceId: issueId.toUpperCase() };
    }

    const issue = await CampusIssue.findOne(query)
      .populate('reporter', 'name email department avatarUrl role')
      .populate('assignedTo', 'name email department avatarUrl')
      .populate('resolution.resolvedBy', 'name role department avatarUrl');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Campus issue not found.',
      });
    }

    const currentUserId = req.user ? req.user._id : null;
    const isAdmin = isUserAdmin(req.user);
    const isReporter =
      currentUserId &&
      issue.reporter &&
      issue.reporter._id.toString() === currentUserId.toString();

    if (issue.visibility === ISSUE_VISIBILITY.PRIVATE) {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to view private issues.',
        });
      }

      if (!isReporter && !isAdmin) {
        return res.status(403).json({
          success: false,
          message:
            'Access denied. This is a private issue report visible only to its reporter and authorized campus administrators.',
        });
      }
    }

    const statusHistory = await IssueStatusHistory.find({ issue: issue._id })
      .populate('changedBy', 'name role department')
      .sort({ createdAt: 1 })
      .lean();

    const updateQuery = { issue: issue._id };
    if (!isAdmin) {
      updateQuery.visibility = 'public';
    }
    const updates = await IssueUpdate.find(updateQuery)
      .populate('author', 'name role department')
      .sort({ createdAt: -1 })
      .lean();

    const feedback = await IssueFeedback.findOne({ issue: issue._id })
      .populate('reporter', 'name')
      .lean();

    const reopenRequests = await ReopenRequest.find({ issue: issue._id })
      .populate('requestedBy', 'name department')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    let hasSupported = false;
    if (currentUserId && issue.visibility === ISSUE_VISIBILITY.PUBLIC) {
      const support = await IssueSupport.findOne({
        issue: issue._id,
        user: currentUserId,
      }).lean();
      hasSupported = Boolean(support);
    }

    const sanitized = sanitizeReporter(issue, currentUserId, isAdmin);
    sanitized.hasSupported = hasSupported;
    sanitized.isReporter = isReporter;
    sanitized.statusHistory = statusHistory;
    sanitized.updates = updates;
    sanitized.feedback = feedback;
    sanitized.reopenRequests = reopenRequests;

    return res.status(200).json({
      success: true,
      issue: sanitized,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReports = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const query = {
      reporter: req.user._id,
    };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { referenceId: searchRegex },
      ];
    }

    const issues = await CampusIssue.find(query)
      .populate('assignedTo', 'name department')
      .sort({ createdAt: -1 })
      .lean();

    const issueIds = issues.map((i) => i._id);
    const latestUpdates = await IssueUpdate.aggregate([
      { $match: { issue: { $in: issueIds }, visibility: 'public' } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$issue',
          latestUpdate: { $first: '$$ROOT' },
        },
      },
    ]);

    const updateMap = new Map();
    latestUpdates.forEach((item) => {
      updateMap.set(item._id.toString(), item.latestUpdate);
    });

    const enrichedIssues = issues.map((issue) => ({
      ...issue,
      latestPublicUpdate: updateMap.get(issue._id.toString()) || null,
      isReporter: true,
    }));

    return res.status(200).json({
      success: true,
      count: enrichedIssues.length,
      issues: enrichedIssues,
    });
  } catch (error) {
    next(error);
  }
};

export const supportIssue = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    const issue = await CampusIssue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Campus issue not found.',
      });
    }

    if (issue.visibility !== ISSUE_VISIBILITY.PUBLIC) {
      return res.status(400).json({
        success: false,
        message: 'Private issues cannot receive community support.',
      });
    }

    if (issue.reporter.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot support your own reported issue.',
      });
    }

    try {
      await IssueSupport.create({
        issue: issue._id,
        user: req.user._id,
      });

      const updatedIssue = await CampusIssue.findByIdAndUpdate(
        issue._id,
        { $inc: { supportCount: 1 } },
        { new: true }
      ).select('supportCount');

      return res.status(200).json({
        success: true,
        message: 'Issue supported successfully.',
        hasSupported: true,
        supportCount: updatedIssue.supportCount,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(200).json({
          success: true,
          message: 'You have already supported this issue.',
          hasSupported: true,
          supportCount: issue.supportCount,
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

export const removeSupport = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    const deletedSupport = await IssueSupport.findOneAndDelete({
      issue: issueId,
      user: req.user._id,
    });

    if (deletedSupport) {
      const updated = await CampusIssue.findByIdAndUpdate(
        issueId,
        { $inc: { supportCount: -1 } },
        { new: true }
      ).select('supportCount');

      return res.status(200).json({
        success: true,
        message: 'Support removed.',
        hasSupported: false,
        supportCount: Math.max(0, updated ? updated.supportCount : 0),
      });
    }

    const current = await CampusIssue.findById(issueId).select('supportCount');
    return res.status(200).json({
      success: true,
      message: 'Support not found or already removed.',
      hasSupported: false,
      supportCount: current ? current.supportCount : 0,
    });
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    const issue = await CampusIssue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Campus issue not found.',
      });
    }

    if (issue.visibility === ISSUE_VISIBILITY.PRIVATE) {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to view private issue discussions.',
        });
      }
      const isReporter = issue.reporter.toString() === req.user._id.toString();
      const isAdmin = isUserAdmin(req.user);
      if (!isReporter && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to private issue comments.',
        });
      }
    }

    const comments = await IssueComment.find({ issue: issue._id })
      .populate('author', 'name department avatarUrl role')
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty.',
      });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 2000 characters.',
      });
    }

    const issue = await CampusIssue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Campus issue not found.',
      });
    }

    if (issue.visibility === ISSUE_VISIBILITY.PRIVATE) {
      const isReporter = issue.reporter.toString() === req.user._id.toString();
      const isAdmin = isUserAdmin(req.user);
      if (!isReporter && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to private issue discussion.',
        });
      }
    }

    const comment = await IssueComment.create({
      issue: issue._id,
      author: req.user._id,
      content: content.trim(),
    });

    await CampusIssue.findByIdAndUpdate(issue._id, {
      $inc: { commentCount: 1 },
    });

    const populated = await IssueComment.findById(comment._id)
      .populate('author', 'name department avatarUrl role')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully.',
      comment: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty.',
      });
    }

    const comment = await IssueComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments.',
      });
    }

    comment.content = content.trim();
    await comment.save();

    const populated = await IssueComment.findById(comment._id)
      .populate('author', 'name department avatarUrl role')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully.',
      comment: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { issueId, commentId } = req.params;

    const comment = await IssueComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin = isUserAdmin(req.user);

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment.',
      });
    }

    await IssueComment.findByIdAndDelete(commentId);

    await CampusIssue.findByIdAndUpdate(issueId, {
      $inc: { commentCount: -1 },
    });

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const submitFeedback = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { rating, feedback = '', wasResolved, requestReopen = false, reopenReason = '' } =
      req.body;

    const issue = await CampusIssue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Campus issue not found.',
      });
    }

    if (issue.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the original reporter can submit feedback on this issue.',
      });
    }

    if (
      issue.status !== ISSUE_STATUS.RESOLVED &&
      issue.status !== ISSUE_STATUS.CLOSED
    ) {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be provided for resolved or closed issues.',
      });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a satisfaction rating between 1 and 5 stars.',
      });
    }

    if (wasResolved === undefined || wasResolved === null) {
      return res.status(400).json({
        success: false,
        message: 'Please indicate whether the issue was satisfactorily resolved.',
      });
    }

    const feedbackDoc = await IssueFeedback.findOneAndUpdate(
      { issue: issue._id },
      {
        issue: issue._id,
        reporter: req.user._id,
        rating: ratingNum,
        feedback: feedback ? feedback.trim() : '',
        wasResolved: Boolean(wasResolved),
      },
      { upsert: true, new: true, runValidators: true }
    );

    let reopenDoc = null;
    if (!wasResolved && requestReopen && reopenReason && reopenReason.trim()) {
      const existingPending = await ReopenRequest.findOne({
        issue: issue._id,
        status: 'pending',
      });

      if (!existingPending) {
        reopenDoc = await ReopenRequest.create({
          issue: issue._id,
          requestedBy: req.user._id,
          reason: reopenReason.trim(),
          status: 'pending',
        });

        await IssueUpdate.create({
          issue: issue._id,
          content: `Reopen requested by student reporter following feedback: ${reopenReason.trim()}`,
          author: req.user._id,
          visibility: 'public',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Resolution feedback recorded successfully. Thank you for helping improve campus life!',
      feedback: feedbackDoc,
      reopenRequest: reopenDoc,
    });
  } catch (error) {
    next(error);
  }
};

export const createReopenRequest = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a clear justification for reopening this issue (minimum 5 characters).',
      });
    }

    const issue = await CampusIssue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Campus issue not found.',
      });
    }

    if (issue.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the original student reporter can request reopening this issue.',
      });
    }

    if (
      issue.status !== ISSUE_STATUS.RESOLVED &&
      issue.status !== ISSUE_STATUS.CLOSED
    ) {
      return res.status(400).json({
        success: false,
        message: 'Reopen requests can only be filed for resolved or closed issues.',
      });
    }

    const existingPending = await ReopenRequest.findOne({
      issue: issue._id,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'A reopen request is already pending review for this issue.',
      });
    }

    const reopenDoc = await ReopenRequest.create({
      issue: issue._id,
      requestedBy: req.user._id,
      reason: reason.trim(),
      status: 'pending',
    });

    await IssueUpdate.create({
      issue: issue._id,
      content: `Reopen requested by student reporter: "${reason.trim()}". Pending administrative review.`,
      author: req.user._id,
      visibility: 'public',
    });

    return res.status(201).json({
      success: true,
      message: 'Reopen request submitted successfully. Campus administrators have been notified.',
      reopenRequest: reopenDoc,
    });
  } catch (error) {
    next(error);
  }
};
