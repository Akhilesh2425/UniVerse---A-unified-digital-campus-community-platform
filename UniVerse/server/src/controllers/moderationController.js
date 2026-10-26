import mongoose from 'mongoose';
import { ContentReport } from '../models/ContentReport.js';
import { DiscussionPost } from '../models/DiscussionPost.js';
import { DiscussionComment } from '../models/DiscussionComment.js';
import { DiscussionVote } from '../models/DiscussionVote.js';
import { SavedDiscussion } from '../models/SavedDiscussion.js';
import { REPORT_STATUS, DISCUSSION_STATUS } from '../utils/constants.js';

const USER_FIELDS = 'name email department role avatarUrl';

/**
 * GET /api/moderation/reports
 * Retrieve reports with target item previews for administrator moderation
 */
export const getReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status && Object.values(REPORT_STATUS).includes(req.query.status)) {
      query.status = req.query.status;
    }
    if (req.query.targetType && ['post', 'comment'].includes(req.query.targetType)) {
      query.targetType = req.query.targetType;
    }

    const [totalReports, reports] = await Promise.all([
      ContentReport.countDocuments(query),
      ContentReport.find(query)
        .populate('reporter', USER_FIELDS)
        .populate('reviewedBy', 'name role')
        .sort({ status: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Fetch previews of target items so moderators can inspect content immediately
    const postIds = reports
      .filter((r) => r.targetType === 'post')
      .map((r) => r.targetId);
    const commentIds = reports
      .filter((r) => r.targetType === 'comment')
      .map((r) => r.targetId);

    const [targetPosts, targetComments] = await Promise.all([
      postIds.length > 0
        ? DiscussionPost.find({ _id: { $in: postIds } })
            .select('title content type category status author')
            .populate('author', 'name email department')
            .lean()
        : [],
      commentIds.length > 0
        ? DiscussionComment.find({ _id: { $in: commentIds } })
            .select('content post status author createdAt')
            .populate('author', 'name email department')
            .populate('post', 'title')
            .lean()
        : [],
    ]);

    const postMap = new Map(targetPosts.map((p) => [p._id.toString(), p]));
    const commentMap = new Map(targetComments.map((c) => [c._id.toString(), c]));

    const enrichedReports = reports.map((r) => {
      const tId = r.targetId.toString();
      const targetContent =
        r.targetType === 'post' ? postMap.get(tId) || null : commentMap.get(tId) || null;

      return {
        ...r,
        id: r._id,
        targetContent,
        isContentDeleted: !targetContent,
      };
    });

    return res.status(200).json({
      success: true,
      count: enrichedReports.length,
      totalReports,
      totalPages: Math.ceil(totalReports / limit) || 1,
      currentPage: page,
      reports: enrichedReports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/moderation/reports/:reportId
 * Process and resolve a content moderation report
 */
export const resolveReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { status, resolution, resolutionNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format',
      });
    }

    const report = await ContentReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    if (status && Object.values(REPORT_STATUS).includes(status)) {
      report.status = status;
    } else {
      report.status = REPORT_STATUS.RESOLVED;
    }

    if (resolution && ['none', 'dismissed', 'hidden', 'deleted'].includes(resolution)) {
      report.resolution = resolution;
    }

    report.resolutionNotes = resolutionNotes ? resolutionNotes.trim() : report.resolutionNotes;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    // Perform moderation action on target content
    if (resolution === 'hidden') {
      if (report.targetType === 'post') {
        await DiscussionPost.findByIdAndUpdate(report.targetId, {
          status: DISCUSSION_STATUS.HIDDEN,
        });
      } else {
        await DiscussionComment.findByIdAndUpdate(report.targetId, {
          status: 'hidden',
        });
      }
    } else if (resolution === 'deleted') {
      if (report.targetType === 'post') {
        // Cascade delete post and all associations
        await Promise.all([
          DiscussionComment.deleteMany({ post: report.targetId }),
          DiscussionVote.deleteMany({ post: report.targetId }),
          SavedDiscussion.deleteMany({ post: report.targetId }),
          DiscussionPost.findByIdAndDelete(report.targetId),
        ]);
      } else {
        // Delete comment and decrement post comment count
        const comment = await DiscussionComment.findById(report.targetId);
        if (comment) {
          await Promise.all([
            DiscussionComment.findByIdAndDelete(report.targetId),
            DiscussionPost.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } }),
          ]);
        }
      }
    }

    await report.save();

    const updated = await ContentReport.findById(reportId)
      .populate('reporter', USER_FIELDS)
      .populate('reviewedBy', 'name role')
      .lean();

    return res.status(200).json({
      success: true,
      message: `Report resolved with action: ${report.resolution}`,
      report: {
        ...updated,
        id: updated._id,
      },
    });
  } catch (error) {
    next(error);
  }
};
