import mongoose from 'mongoose';
import { CampusIssue } from '../models/CampusIssue.js';
import { IssueStatusHistory } from '../models/IssueStatusHistory.js';
import { IssueAssignmentHistory } from '../models/IssueAssignmentHistory.js';
import { IssueUpdate } from '../models/IssueUpdate.js';
import { IssueFeedback } from '../models/IssueFeedback.js';
import { ReopenRequest } from '../models/ReopenRequest.js';
import { IssueComment } from '../models/IssueComment.js';
import {
  ISSUE_CATEGORIES,
  ISSUE_PRIORITIES,
  ISSUE_STATUS,
  CAMPUS_DEPARTMENTS,
  REOPEN_STATUS,
  NOTIFICATION_TYPES,
  AUDIT_ACTIONS,
} from '../utils/constants.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

const ALLOWED_TRANSITIONS = {
  [ISSUE_STATUS.SUBMITTED]: [
    ISSUE_STATUS.UNDER_REVIEW,
    ISSUE_STATUS.REJECTED,
    ISSUE_STATUS.DUPLICATE,
  ],
  [ISSUE_STATUS.UNDER_REVIEW]: [
    ISSUE_STATUS.APPROVED,
    ISSUE_STATUS.ASSIGNED,
    ISSUE_STATUS.IN_PROGRESS,
    ISSUE_STATUS.REJECTED,
    ISSUE_STATUS.DUPLICATE,
  ],
  [ISSUE_STATUS.APPROVED]: [
    ISSUE_STATUS.ASSIGNED,
    ISSUE_STATUS.IN_PROGRESS,
    ISSUE_STATUS.ON_HOLD,
    ISSUE_STATUS.REJECTED,
  ],
  [ISSUE_STATUS.ASSIGNED]: [
    ISSUE_STATUS.IN_PROGRESS,
    ISSUE_STATUS.ON_HOLD,
    ISSUE_STATUS.APPROVED,
    ISSUE_STATUS.UNDER_REVIEW,
  ],
  [ISSUE_STATUS.IN_PROGRESS]: [
    ISSUE_STATUS.ON_HOLD,
    ISSUE_STATUS.RESOLVED,
  ],
  [ISSUE_STATUS.ON_HOLD]: [
    ISSUE_STATUS.IN_PROGRESS,
    ISSUE_STATUS.ASSIGNED,
  ],
  [ISSUE_STATUS.RESOLVED]: [
    ISSUE_STATUS.CLOSED,
    ISSUE_STATUS.REOPENED,
  ],
  [ISSUE_STATUS.CLOSED]: [
    ISSUE_STATUS.REOPENED,
  ],
  [ISSUE_STATUS.REOPENED]: [
    ISSUE_STATUS.UNDER_REVIEW,
    ISSUE_STATUS.ASSIGNED,
    ISSUE_STATUS.IN_PROGRESS,
  ],
  [ISSUE_STATUS.REJECTED]: [
    ISSUE_STATUS.UNDER_REVIEW,
    ISSUE_STATUS.REOPENED,
  ],
  [ISSUE_STATUS.DUPLICATE]: [
    ISSUE_STATUS.UNDER_REVIEW,
    ISSUE_STATUS.REOPENED,
  ],
};

export const getAdminIssues = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      category,
      department,
      visibility,
      search,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (priority && priority !== 'All') {
      query.priority = priority.toLowerCase();
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (department && department !== 'All') {
      query.assignedDepartment = department;
    }

    if (visibility && visibility !== 'All') {
      query.visibility = visibility.toLowerCase();
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
        .populate('assignedTo', 'name email department')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CampusIssue.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      issues,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminStatistics = async (req, res, next) => {
  try {
    const [
      total,
      submitted,
      underReview,
      approved,
      assigned,
      inProgress,
      onHold,
      resolved,
      closed,
      rejected,
      duplicate,
      reopened,
      critical,
      high,
      feedbacks,
      pendingReopenCount,
      departmentStats,
    ] = await Promise.all([
      CampusIssue.countDocuments({}),
      CampusIssue.countDocuments({ status: ISSUE_STATUS.SUBMITTED }),
      CampusIssue.countDocuments({ status: ISSUE_STATUS.UNDER_REVIEW }),
      CampusIssue.countDocuments({ status: ISSUE_STATUS.APPROVED }),
      CampusIssue.countDocuments({ status: ISSUE_STATUS.ASSIGNED }),
      CampusIssue.countDocuments({ status: ISSUE_STATUS.IN_PROGRESS }),
      CampusIssue.countDocuments({ status: ISSUE_STATUS.ON_HOLD }),
      CampusIssue.countDocuments({ status: ISSUE_STATUS.RESOLVED }),
      CampusIssue.countDocuments({ status: ISSUE_STATUS.CLOSED }),
      CampusIssue.countDocuments({ status: ISSUE_STATUS.REJECTED }),
      CampusIssue.countDocuments({ status: ISSUE_STATUS.DUPLICATE }),
      CampusIssue.countDocuments({ status: ISSUE_STATUS.REOPENED }),
      CampusIssue.countDocuments({ priority: 'critical' }),
      CampusIssue.countDocuments({ priority: 'high' }),
      IssueFeedback.find({}).select('rating wasResolved').lean(),
      ReopenRequest.countDocuments({ status: REOPEN_STATUS.PENDING }),
      CampusIssue.aggregate([
        { $match: { assignedDepartment: { $ne: null } } },
        { $group: { _id: '$assignedDepartment', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    let totalRatings = 0;
    let resolvedCount = 0;
    feedbacks.forEach((fb) => {
      totalRatings += fb.rating;
      if (fb.wasResolved) resolvedCount++;
    });

    const averageRating =
      feedbacks.length > 0 ? (totalRatings / feedbacks.length).toFixed(1) : 0;
    const satisfactionRate =
      feedbacks.length > 0
        ? Math.round((resolvedCount / feedbacks.length) * 100)
        : 100;

    return res.status(200).json({
      success: true,
      statistics: {
        total,
        submitted,
        underReview,
        approved,
        assigned,
        inProgress,
        onHold,
        resolved,
        closed,
        rejected,
        duplicate,
        reopened,
        critical,
        high,
        pendingReopens: pendingReopenCount,
        feedback: {
          totalCount: feedbacks.length,
          averageRating: parseFloat(averageRating),
          satisfactionRate,
        },
        departmentDistribution: departmentStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateIssueStatus = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { status, explanation = '' } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'New status is required.',
      });
    }

    const issue = await CampusIssue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Campus issue not found.',
      });
    }

    const previousStatus = issue.status;
    const newStatus = status.toLowerCase();

    const validTransitions = ALLOWED_TRANSITIONS[previousStatus] || [];
    if (!validTransitions.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition: Cannot transition from "${previousStatus}" to "${newStatus}".`,
      });
    }

    if (
      (newStatus === ISSUE_STATUS.REJECTED || newStatus === ISSUE_STATUS.DUPLICATE) &&
      (!explanation || explanation.trim().length < 5)
    ) {
      return res.status(400).json({
        success: false,
        message: `An explanation of at least 5 characters is required when marking an issue as ${newStatus}.`,
      });
    }

    issue.status = newStatus;
    if (newStatus === ISSUE_STATUS.CLOSED) {
      issue.closedAt = new Date();
    }
    await issue.save();

    await IssueStatusHistory.create({
      issue: issue._id,
      previousStatus,
      newStatus,
      changedBy: req.user._id,
      explanation: explanation ? explanation.trim() : `Status transitioned from ${previousStatus} to ${newStatus}.`,
    });

    const statusLabels = {
      under_review: 'Issue is now under active administrative review.',
      approved: 'Issue approved by campus administration for action.',
      assigned: 'Issue assigned to maintenance team for execution.',
      in_progress: 'Repair/resolution work has commenced.',
      on_hold: `Work placed on hold. Reason: ${explanation || 'Awaiting materials/clearance'}`,
      resolved: 'Issue reported resolved by campus operations.',
      closed: 'Issue lifecycle completed and closed.',
      rejected: `Issue report declined. Reason: ${explanation}`,
      duplicate: `Issue marked as duplicate of an existing report. Note: ${explanation}`,
      reopened: `Issue reopened for further administrative action. Reason: ${explanation || 'Student report verified unresolved.'}`,
    };

    await IssueUpdate.create({
      issue: issue._id,
      content: statusLabels[newStatus] || `Status updated to ${newStatus}.`,
      author: req.user._id,
      visibility: 'public',
      relatedStatus: newStatus,
    });

    await logAudit({
      req,
      actorId: req.user._id,
      action: AUDIT_ACTIONS.ISSUE_STATUS_CHANGE,
      targetType: 'CampusIssue',
      targetId: issue._id,
      description: `Issue [${issue.referenceId}] "${issue.title}" status transitioned from "${previousStatus}" to "${newStatus}".`,
      metadata: { previousStatus, newStatus, referenceId: issue.referenceId },
    });

    await createNotification({
      recipient: issue.reporter,
      actor: req.user._id,
      type: NOTIFICATION_TYPES.CAMPUS_ISSUE_UPDATE,
      title: `Campus Issue ${newStatus.replace(/_/g, ' ').toUpperCase()}`,
      message: `Your campus report "${issue.title}" (${issue.referenceId}) is now ${newStatus.replace(/_/g, ' ')}.`,
      entityType: 'issue',
      entityId: issue._id,
      actionUrl: `/issues/${issue._id}`,
    });

    const updatedIssue = await CampusIssue.findById(issue._id)
      .populate('reporter', 'name email department avatarUrl role')
      .populate('assignedTo', 'name email department')
      .lean();

    return res.status(200).json({
      success: true,
      message: `Issue status updated to ${newStatus}.`,
      issue: updatedIssue,
    });
  } catch (error) {
    next(error);
  }
};

export const updateIssuePriority = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { priority } = req.body;

    if (!priority || !ISSUE_PRIORITIES.includes(priority.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority level. Choose low, medium, high, or critical.',
      });
    }

    const issue = await CampusIssue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Campus issue not found.',
      });
    }

    const oldPriority = issue.priority;
    issue.priority = priority.toLowerCase();
    await issue.save();

    await IssueUpdate.create({
      issue: issue._id,
      content: `Priority level adjusted by administrator from "${oldPriority}" to "${issue.priority}".`,
      author: req.user._id,
      visibility: 'public',
    });

    return res.status(200).json({
      success: true,
      message: `Priority updated to ${issue.priority}.`,
      priority: issue.priority,
    });
  } catch (error) {
    next(error);
  }
};

export const assignDepartment = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const {
      department,
      assignedTo = null,
      targetResolutionDate = null,
      instructions = '',
    } = req.body;

    if (!department || !CAMPUS_DEPARTMENTS.includes(department)) {
      return res.status(400).json({
        success: false,
        message: 'Please specify a valid campus department.',
      });
    }

    const issue = await CampusIssue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Campus issue not found.',
      });
    }

    issue.assignedDepartment = department;
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      issue.assignedTo = assignedTo;
    }
    if (targetResolutionDate) {
      issue.targetResolutionDate = new Date(targetResolutionDate);
    }

    if (
      issue.status === ISSUE_STATUS.SUBMITTED ||
      issue.status === ISSUE_STATUS.UNDER_REVIEW ||
      issue.status === ISSUE_STATUS.APPROVED
    ) {
      const prevStatus = issue.status;
      issue.status = ISSUE_STATUS.ASSIGNED;
      await IssueStatusHistory.create({
        issue: issue._id,
        previousStatus: prevStatus,
        newStatus: ISSUE_STATUS.ASSIGNED,
        changedBy: req.user._id,
        explanation: `Assigned to ${department} for action.`,
      });
    }

    await issue.save();

    await IssueAssignmentHistory.create({
      issue: issue._id,
      department,
      assignedTo: issue.assignedTo,
      assignedBy: req.user._id,
      instructions: instructions ? instructions.trim() : '',
      targetDate: issue.targetResolutionDate,
    });

    await IssueUpdate.create({
      issue: issue._id,
      content: `Assigned to ${department} for resolution${
        targetResolutionDate
          ? ` (Target date: ${new Date(targetResolutionDate).toLocaleDateString()})`
          : ''
      }.${instructions ? ` Instructions: ${instructions}` : ''}`,
      author: req.user._id,
      visibility: 'public',
      relatedStatus: ISSUE_STATUS.ASSIGNED,
    });

    await logAudit({
      req,
      actorId: req.user._id,
      action: AUDIT_ACTIONS.ISSUE_ASSIGNMENT,
      targetType: 'CampusIssue',
      targetId: issue._id,
      description: `Issue [${issue.referenceId}] "${issue.title}" assigned to ${department}.`,
      metadata: { department, assignedTo: issue.assignedTo, referenceId: issue.referenceId },
    });

    await createNotification({
      recipient: issue.reporter,
      actor: req.user._id,
      type: NOTIFICATION_TYPES.CAMPUS_ISSUE_UPDATE,
      title: 'Issue Assigned to Department',
      message: `Your campus report "${issue.title}" (${issue.referenceId}) has been assigned to ${department}.`,
      entityType: 'issue',
      entityId: issue._id,
      actionUrl: `/issues/${issue._id}`,
    });

    const updatedIssue = await CampusIssue.findById(issue._id)
      .populate('reporter', 'name email department avatarUrl role')
      .populate('assignedTo', 'name email department')
      .lean();

    return res.status(200).json({
      success: true,
      message: `Issue assigned to ${department}.`,
      issue: updatedIssue,
    });
  } catch (error) {
    next(error);
  }
};

export const addIssueUpdate = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { content, visibility = 'public', relatedStatus = null } = req.body;

    if (!content || content.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Update content must be at least 2 characters.',
      });
    }

    const issue = await CampusIssue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Campus issue not found.',
      });
    }

    const update = await IssueUpdate.create({
      issue: issue._id,
      content: content.trim(),
      author: req.user._id,
      visibility: visibility === 'internal' ? 'internal' : 'public',
      relatedStatus: relatedStatus || issue.status,
    });

    const populated = await IssueUpdate.findById(update._id)
      .populate('author', 'name role department')
      .lean();

    return res.status(201).json({
      success: true,
      message: `${
        visibility === 'internal' ? 'Internal note' : 'Public progress update'
      } recorded successfully.`,
      update: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const resolveIssue = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { summary, actionTaken, evidenceUrl = '' } = req.body;

    if (!summary || summary.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Resolution summary is required (minimum 5 characters).',
      });
    }

    if (!actionTaken || actionTaken.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Description of the action taken is required (minimum 5 characters).',
      });
    }

    const issue = await CampusIssue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Campus issue not found.',
      });
    }

    const previousStatus = issue.status;

    issue.resolution = {
      summary: summary.trim(),
      actionTaken: actionTaken.trim(),
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
      evidenceUrl: evidenceUrl ? evidenceUrl.trim() : '',
    };
    issue.status = ISSUE_STATUS.RESOLVED;
    await issue.save();

    await IssueStatusHistory.create({
      issue: issue._id,
      previousStatus,
      newStatus: ISSUE_STATUS.RESOLVED,
      changedBy: req.user._id,
      explanation: `Issue resolved: ${summary.trim()}`,
    });

    await IssueUpdate.create({
      issue: issue._id,
      content: `Issue resolved: ${summary.trim()}. Action taken: ${actionTaken.trim()}`,
      author: req.user._id,
      visibility: 'public',
      relatedStatus: ISSUE_STATUS.RESOLVED,
    });

    await logAudit({
      req,
      actorId: req.user._id,
      action: AUDIT_ACTIONS.ISSUE_RESOLVE,
      targetType: 'CampusIssue',
      targetId: issue._id,
      description: `Issue [${issue.referenceId}] "${issue.title}" marked resolved. Summary: ${summary.trim()}`,
      metadata: { referenceId: issue.referenceId, summary: summary.trim() },
    });

    await createNotification({
      recipient: issue.reporter,
      actor: req.user._id,
      type: NOTIFICATION_TYPES.CAMPUS_ISSUE_RESOLVED,
      title: 'Campus Issue Resolved',
      message: `Your report "${issue.title}" (${issue.referenceId}) has been resolved. Please review the resolution and leave feedback.`,
      entityType: 'issue',
      entityId: issue._id,
      actionUrl: `/issues/${issue._id}`,
    });

    const updatedIssue = await CampusIssue.findById(issue._id)
      .populate('reporter', 'name email department avatarUrl role')
      .populate('resolution.resolvedBy', 'name role department')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Issue marked as resolved.',
      issue: updatedIssue,
    });
  } catch (error) {
    next(error);
  }
};

export const closeIssue = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { explanation = 'Issue officially closed following resolution.' } =
      req.body;

    const issue = await CampusIssue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Campus issue not found.',
      });
    }

    if (
      issue.status !== ISSUE_STATUS.RESOLVED &&
      issue.status !== ISSUE_STATUS.REJECTED &&
      issue.status !== ISSUE_STATUS.DUPLICATE
    ) {
      return res.status(400).json({
        success: false,
        message: 'Only resolved, rejected, or duplicate issues can be closed.',
      });
    }

    const previousStatus = issue.status;
    issue.status = ISSUE_STATUS.CLOSED;
    issue.closedAt = new Date();
    await issue.save();

    await IssueStatusHistory.create({
      issue: issue._id,
      previousStatus,
      newStatus: ISSUE_STATUS.CLOSED,
      changedBy: req.user._id,
      explanation: explanation.trim(),
    });

    await IssueUpdate.create({
      issue: issue._id,
      content: `Issue closed: ${explanation.trim()}`,
      author: req.user._id,
      visibility: 'public',
      relatedStatus: ISSUE_STATUS.CLOSED,
    });

    return res.status(200).json({
      success: true,
      message: 'Issue successfully closed.',
      issue,
    });
  } catch (error) {
    next(error);
  }
};

export const getReopenRequests = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const requests = await ReopenRequest.find(query)
      .populate('issue', 'referenceId title status category location priority')
      .populate('requestedBy', 'name email department avatarUrl')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewReopenRequest = async (req, res, next) => {
  try {
    const { issueId, requestId } = req.params;
    const { decision, reviewExplanation = '' } = req.body;

    if (!decision || !['approved', 'rejected'].includes(decision.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be either "approved" or "rejected".',
      });
    }

    const reopenReq = await ReopenRequest.findById(requestId);
    if (!reopenReq) {
      return res.status(404).json({
        success: false,
        message: 'Reopen request not found.',
      });
    }

    const issue = await CampusIssue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Campus issue not found.',
      });
    }

    reopenReq.status = decision.toLowerCase();
    reopenReq.reviewedBy = req.user._id;
    reopenReq.reviewExplanation = reviewExplanation.trim();
    reopenReq.reviewedAt = new Date();
    await reopenReq.save();

    if (decision.toLowerCase() === 'approved') {
      const previousStatus = issue.status;
      issue.status = ISSUE_STATUS.REOPENED;
      await issue.save();

      await IssueStatusHistory.create({
        issue: issue._id,
        previousStatus,
        newStatus: ISSUE_STATUS.REOPENED,
        changedBy: req.user._id,
        explanation: `Reopen request approved: ${reviewExplanation.trim() || reopenReq.reason}`,
      });

      await IssueUpdate.create({
        issue: issue._id,
        content: `Reopen request approved by administration. Issue returned to active resolution pipeline. Note: ${
          reviewExplanation || reopenReq.reason
        }`,
        author: req.user._id,
        visibility: 'public',
        relatedStatus: ISSUE_STATUS.REOPENED,
      });
    } else {
      await IssueUpdate.create({
        issue: issue._id,
        content: `Reopen request reviewed and dismissed. Reason: ${
          reviewExplanation || 'Resolution verified by campus administration.'
        }`,
        author: req.user._id,
        visibility: 'public',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Reopen request ${decision.toLowerCase()}.`,
      request: reopenReq,
      issueStatus: issue.status,
    });
  } catch (error) {
    next(error);
  }
};

export const getIssueAuditHistory = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    const [statusHistory, assignmentHistory, updates, comments] =
      await Promise.all([
        IssueStatusHistory.find({ issue: issueId })
          .populate('changedBy', 'name role department')
          .sort({ createdAt: 1 })
          .lean(),
        IssueAssignmentHistory.find({ issue: issueId })
          .populate('assignedBy', 'name role')
          .populate('assignedTo', 'name email department')
          .sort({ createdAt: 1 })
          .lean(),
        IssueUpdate.find({ issue: issueId })
          .populate('author', 'name role department')
          .sort({ createdAt: -1 })
          .lean(),
        IssueComment.find({ issue: issueId })
          .populate('author', 'name role department avatarUrl')
          .sort({ createdAt: 1 })
          .lean(),
      ]);

    return res.status(200).json({
      success: true,
      audit: {
        statusHistory,
        assignmentHistory,
        updates, 
        comments,
      },
    });
  } catch (error) {
    next(error);
  }
};
