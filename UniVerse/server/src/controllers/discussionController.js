import mongoose from 'mongoose';
import { DiscussionPost } from '../models/DiscussionPost.js';
import { DiscussionComment } from '../models/DiscussionComment.js';
import { DiscussionVote } from '../models/DiscussionVote.js';
import { SavedDiscussion } from '../models/SavedDiscussion.js';
import { ContentReport } from '../models/ContentReport.js';
import {
  DISCUSSION_CATEGORIES,
  DISCUSSION_TYPES,
  DISCUSSION_STATUS,
  REPORT_REASONS,
  ROLES,
} from '../utils/constants.js';

// Safe author projection to prevent sensitive leakage
const AUTHOR_FIELDS = 'name department academicYear avatarUrl role email';

/**
 * GET /api/discussions
 * Discovery feed with search, category/type filters, unanswered questions, sorting & pagination
 */
export const getDiscussions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, category, type, unanswered, resolved, tag, sort } = req.query;

    const query = {
      status: { $ne: DISCUSSION_STATUS.HIDDEN },
    };

    // Category filter
    if (category && category !== 'All') {
      if (DISCUSSION_CATEGORIES.includes(category)) {
        query.category = category;
      }
    }

    // Post type filter
    if (type && Object.values(DISCUSSION_TYPES).includes(type)) {
      query.type = type;
    }

    // Unanswered filter (questions with 0 comments)
    if (unanswered === 'true') {
      query.type = DISCUSSION_TYPES.QUESTION;
      query.commentCount = 0;
    }

    // Resolved filter for questions
    if (resolved === 'true') {
      query.type = DISCUSSION_TYPES.QUESTION;
      query.status = DISCUSSION_STATUS.RESOLVED;
    } else if (resolved === 'false') {
      query.type = DISCUSSION_TYPES.QUESTION;
      query.status = DISCUSSION_STATUS.OPEN;
    }

    // Tag filter
    if (tag) {
      query.tags = tag.trim().toLowerCase();
    }

    // Keyword Search
    if (search && search.trim()) {
      const keyword = search.trim();
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
        { tags: { $regex: keyword, $options: 'i' } },
      ];
    }

    // Sorting strategy
    let sortOption = { createdAt: -1 }; // default newest

    if (sort === 'trending') {
      // Trending: high upvotes and comments with recency
      sortOption = { upvoteCount: -1, commentCount: -1, createdAt: -1 };
    } else if (sort === 'top' || sort === 'most_upvoted') {
      sortOption = { upvoteCount: -1, createdAt: -1 };
    } else if (sort === 'most_answered' || sort === 'most_comments') {
      sortOption = { commentCount: -1, createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    const [totalPosts, discussions] = await Promise.all([
      DiscussionPost.countDocuments(query),
      DiscussionPost.find(query)
        .populate('author', AUTHOR_FIELDS)
        .populate({
          path: 'acceptedAnswer',
          select: 'content author createdAt',
          populate: { path: 'author', select: 'name avatarUrl' },
        })
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Check interaction states (upvoted & saved) for logged-in user
    let userVotedPostIds = new Set();
    let userSavedPostIds = new Set();

    if (req.user && req.user._id && discussions.length > 0) {
      const postIds = discussions.map((d) => d._id);
      const [votes, saves] = await Promise.all([
        DiscussionVote.find({ user: req.user._id, post: { $in: postIds } }).select('post').lean(),
        SavedDiscussion.find({ user: req.user._id, post: { $in: postIds } }).select('post').lean(),
      ]);

      userVotedPostIds = new Set(votes.map((v) => v.post.toString()));
      userSavedPostIds = new Set(saves.map((s) => s.post.toString()));
    }

    const enrichedDiscussions = discussions.map((doc) => {
      const pId = doc._id.toString();
      return {
        ...doc,
        id: doc._id,
        hasUpvoted: userVotedPostIds.has(pId),
        hasSaved: userSavedPostIds.has(pId),
        isResolved: doc.status === DISCUSSION_STATUS.RESOLVED || !!doc.acceptedAnswer,
      };
    });

    return res.status(200).json({
      success: true,
      count: enrichedDiscussions.length,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit) || 1,
      currentPage: page,
      discussions: enrichedDiscussions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/discussions/:postId
 * Full discussion detail with author, tags, interaction stats, and permissions
 */
export const getDiscussionById = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format',
      });
    }

    const post = await DiscussionPost.findByIdAndUpdate(
      postId,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', AUTHOR_FIELDS)
      .populate({
        path: 'acceptedAnswer',
        populate: { path: 'author', select: AUTHOR_FIELDS },
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found or has been removed',
      });
    }

    // If hidden, only author or admin can view
    const isAuthor = req.user && req.user._id.equals(post.author._id);
    const isAdmin = req.user && req.user.role === ROLES.ADMIN;

    if (post.status === DISCUSSION_STATUS.HIDDEN && !isAuthor && !isAdmin) {
      return res.status(404).json({
        success: false,
        message: 'This discussion is currently hidden by moderation',
      });
    }

    // Determine user interaction states
    let hasUpvoted = false;
    let hasSaved = false;

    if (req.user) {
      const [vote, save] = await Promise.all([
        DiscussionVote.findOne({ post: postId, user: req.user._id }).lean(),
        SavedDiscussion.findOne({ post: postId, user: req.user._id }).lean(),
      ]);
      hasUpvoted = !!vote;
      hasSaved = !!save;
    }

    const postObj = post.toObject();
    postObj.id = post._id;
    postObj.hasUpvoted = hasUpvoted;
    postObj.hasSaved = hasSaved;
    postObj.isAuthor = !!isAuthor;
    postObj.canEdit = isAuthor || isAdmin;
    postObj.canDelete = isAuthor || isAdmin;
    postObj.isResolved = post.status === DISCUSSION_STATUS.RESOLVED || !!post.acceptedAnswer;

    return res.status(200).json({
      success: true,
      discussion: postObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/discussions
 * Create a new discussion post (Question, Discussion, Resource, Project)
 */
export const createDiscussion = async (req, res, next) => {
  try {
    const { title, content, type, category, tags, resourceUrl, imageUrl } = req.body;

    if (!title || title.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Discussion title is required and must be at least 5 characters',
      });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot exceed 200 characters',
      });
    }

    if (!content || content.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Content is required and must be at least 10 characters',
      });
    }

    if (!category || !DISCUSSION_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid category from: ${DISCUSSION_CATEGORIES.join(', ')}`,
      });
    }

    const postType = type && Object.values(DISCUSSION_TYPES).includes(type)
      ? type
      : DISCUSSION_TYPES.DISCUSSION;

    // Validate resourceUrl if provided
    if (resourceUrl && resourceUrl.trim()) {
      try {
        new URL(resourceUrl.trim());
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Invalid resource URL format. Must be a valid HTTP/HTTPS URL.',
        });
      }
    }

    // Process tags
    let formattedTags = [];
    if (Array.isArray(tags)) {
      formattedTags = tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 8);
    } else if (typeof tags === 'string') {
      formattedTags = tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8);
    }

    const newPost = await DiscussionPost.create({
      author: req.user._id,
      title: title.trim(),
      content: content.trim(),
      type: postType,
      category,
      tags: formattedTags,
      resourceUrl: resourceUrl ? resourceUrl.trim() : '',
      imageUrl: imageUrl ? imageUrl.trim() : '',
      status: DISCUSSION_STATUS.OPEN,
    });

    const populatedPost = await DiscussionPost.findById(newPost._id)
      .populate('author', AUTHOR_FIELDS)
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Discussion created successfully',
      discussion: {
        ...populatedPost,
        id: populatedPost._id,
        hasUpvoted: false,
        hasSaved: false,
        isAuthor: true,
        canEdit: true,
        canDelete: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/discussions/:postId
 * Edit an authorized discussion post
 */
export const updateDiscussion = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { title, content, category, type, tags, resourceUrl, imageUrl, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format',
      });
    }

    const post = await DiscussionPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found',
      });
    }

    const isAuthor = req.user._id.equals(post.author);
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this discussion',
      });
    }

    if (title !== undefined) {
      if (title.trim().length < 5 || title.trim().length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Title must be between 5 and 200 characters',
        });
      }
      post.title = title.trim();
    }

    if (content !== undefined) {
      if (content.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Content must be at least 10 characters',
        });
      }
      post.content = content.trim();
    }

    if (category !== undefined) {
      if (!DISCUSSION_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category selected',
        });
      }
      post.category = category;
    }

    if (type !== undefined && Object.values(DISCUSSION_TYPES).includes(type)) {
      post.type = type;
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        post.tags = tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 8);
      } else if (typeof tags === 'string') {
        post.tags = tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 8);
      }
    }

    if (resourceUrl !== undefined) {
      if (resourceUrl && resourceUrl.trim()) {
        try {
          new URL(resourceUrl.trim());
          post.resourceUrl = resourceUrl.trim();
        } catch {
          return res.status(400).json({
            success: false,
            message: 'Invalid resource URL format',
          });
        }
      } else {
        post.resourceUrl = '';
      }
    }

    if (imageUrl !== undefined) {
      post.imageUrl = imageUrl.trim();
    }

    if (status !== undefined && Object.values(DISCUSSION_STATUS).includes(status)) {
      post.status = status;
    }

    await post.save();

    const updated = await DiscussionPost.findById(postId)
      .populate('author', AUTHOR_FIELDS)
      .populate({
        path: 'acceptedAnswer',
        populate: { path: 'author', select: AUTHOR_FIELDS },
      })
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Discussion updated successfully',
      discussion: {
        ...updated,
        id: updated._id,
        isAuthor: true,
        canEdit: true,
        canDelete: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/discussions/:postId
 * Delete discussion with cascading cleanup of comments, votes, bookmarks, and reports
 */
export const deleteDiscussion = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format',
      });
    }

    const post = await DiscussionPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found',
      });
    }

    const isAuthor = req.user._id.equals(post.author);
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this discussion',
      });
    }

    // Cascade delete associated records
    await Promise.all([
      DiscussionComment.deleteMany({ post: postId }),
      DiscussionVote.deleteMany({ post: postId }),
      SavedDiscussion.deleteMany({ post: postId }),
      ContentReport.deleteMany({ targetType: 'post', targetId: postId }),
      DiscussionPost.findByIdAndDelete(postId),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Discussion and all associated interactions deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/discussions/my-posts
 * Current authenticated user's discussion posts
 */
export const getMyDiscussions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { author: req.user._id };

    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }

    if (req.query.type && Object.values(DISCUSSION_TYPES).includes(req.query.type)) {
      query.type = req.query.type;
    }

    const [totalPosts, posts] = await Promise.all([
      DiscussionPost.countDocuments(query),
      DiscussionPost.find(query)
        .populate('author', AUTHOR_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      count: posts.length,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit) || 1,
      currentPage: page,
      discussions: posts.map((p) => ({
        ...p,
        id: p._id,
        isAuthor: true,
        canEdit: true,
        canDelete: true,
        isResolved: p.status === DISCUSSION_STATUS.RESOLVED || !!p.acceptedAnswer,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/discussions/:postId/comments
 * Fetch comments / answers with accepted answer prioritized
 */
export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format',
      });
    }

    const post = await DiscussionPost.findById(postId).select('status acceptedAnswer author');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Discussion post not found',
      });
    }

    const comments = await DiscussionComment.find({
      post: postId,
      status: { $ne: 'hidden' },
    })
      .populate('author', AUTHOR_FIELDS)
      .sort({ isAcceptedAnswer: -1, createdAt: 1 })
      .lean();

    const isPostAuthor = req.user && req.user._id.equals(post.author);
    const isAdmin = req.user && req.user.role === ROLES.ADMIN;

    const enrichedComments = comments.map((c) => {
      const isCommentAuthor = req.user && req.user._id.equals(c.author._id);
      return {
        ...c,
        id: c._id,
        isCommentAuthor,
        canEdit: isCommentAuthor || isAdmin,
        canDelete: isCommentAuthor || isAdmin,
        canMarkAccepted: isPostAuthor || isAdmin,
      };
    });

    return res.status(200).json({
      success: true,
      count: enrichedComments.length,
      comments: enrichedComments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/discussions/:postId/comments
 * Add a comment or answer to a discussion
 */
export const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format',
      });
    }

    if (!content || content.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required (minimum 2 characters)',
      });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 5000 characters',
      });
    }

    const post = await DiscussionPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Discussion post not found',
      });
    }

    if (post.status === DISCUSSION_STATUS.CLOSED) {
      return res.status(400).json({
        success: false,
        message: 'This discussion is closed for new replies',
      });
    }

    const newComment = await DiscussionComment.create({
      post: postId,
      author: req.user._id,
      content: content.trim(),
    });

    // Atomically increment comment count
    await DiscussionPost.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    const populated = await DiscussionComment.findById(newComment._id)
      .populate('author', AUTHOR_FIELDS)
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      comment: {
        ...populated,
        id: populated._id,
        isCommentAuthor: true,
        canEdit: true,
        canDelete: true,
        canMarkAccepted: req.user._id.equals(post.author) || req.user.role === ROLES.ADMIN,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/discussions/:postId/comments/:commentId
 * Edit an authorized comment
 */
export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID format',
      });
    }

    if (!content || content.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Comment content must be at least 2 characters',
      });
    }

    const comment = await DiscussionComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const isAuthor = req.user._id.equals(comment.author);
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this comment',
      });
    }

    comment.content = content.trim();
    await comment.save();

    const updated = await DiscussionComment.findById(commentId)
      .populate('author', AUTHOR_FIELDS)
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment: {
        ...updated,
        id: updated._id,
        isCommentAuthor: true,
        canEdit: true,
        canDelete: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/discussions/:postId/comments/:commentId
 * Delete an authorized comment and decrement comment count
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const comment = await DiscussionComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const isAuthor = req.user._id.equals(comment.author);
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment',
      });
    }

    // Check if this was accepted answer
    const post = await DiscussionPost.findById(postId);
    if (post && post.acceptedAnswer && post.acceptedAnswer.equals(commentId)) {
      post.acceptedAnswer = null;
      post.status = DISCUSSION_STATUS.OPEN;
      await post.save();
    }

    await Promise.all([
      DiscussionComment.findByIdAndDelete(commentId),
      ContentReport.deleteMany({ targetType: 'comment', targetId: commentId }),
      DiscussionPost.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/discussions/:postId/accepted-answer
 * Mark or unmark an answer as accepted for a Question post
 */
export const setAcceptedAnswer = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { commentId } = req.body; // commentId can be null to unmark

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format',
      });
    }

    const post = await DiscussionPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Discussion post not found',
      });
    }

    if (post.type !== DISCUSSION_TYPES.QUESTION) {
      return res.status(400).json({
        success: false,
        message: 'Only Question-type posts can have an accepted answer',
      });
    }

    const isAuthor = req.user._id.equals(post.author);
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the question author or an administrator can accept an answer',
      });
    }

    // Unmark case: commentId is explicitly null or empty
    if (!commentId) {
      if (post.acceptedAnswer) {
        await DiscussionComment.findByIdAndUpdate(post.acceptedAnswer, { isAcceptedAnswer: false });
      }
      post.acceptedAnswer = null;
      post.status = DISCUSSION_STATUS.OPEN;
      await post.save();

      return res.status(200).json({
        success: true,
        message: 'Accepted answer cleared',
        isResolved: false,
        acceptedAnswer: null,
      });
    }

    // Verify comment belongs to this post
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID format',
      });
    }

    const comment = await DiscussionComment.findOne({ _id: commentId, post: postId });
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Answer comment not found on this discussion',
      });
    }

    // Clear previous accepted answer if different
    if (post.acceptedAnswer && !post.acceptedAnswer.equals(commentId)) {
      await DiscussionComment.findByIdAndUpdate(post.acceptedAnswer, { isAcceptedAnswer: false });
    }

    // Mark current comment as accepted
    comment.isAcceptedAnswer = true;
    await comment.save();

    post.acceptedAnswer = commentId;
    post.status = DISCUSSION_STATUS.RESOLVED;
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Answer marked as accepted! Question marked as resolved.',
      isResolved: true,
      acceptedAnswer: commentId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/discussions/:postId/vote
 * Upvote a discussion post with atomic duplicate prevention
 */
export const voteDiscussion = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format',
      });
    }

    const post = await DiscussionPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Discussion post not found',
      });
    }

    try {
      // Create vote record. Compound unique index enforces 1 vote per user/post
      await DiscussionVote.create({
        post: postId,
        user: req.user._id,
      });

      // Atomically increment upvote count
      const updatedPost = await DiscussionPost.findByIdAndUpdate(
        postId,
        { $inc: { upvoteCount: 1 } },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Upvote recorded',
        hasUpvoted: true,
        upvoteCount: updatedPost.upvoteCount,
      });
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key: User has already voted
        return res.status(200).json({
          success: true,
          message: 'You have already upvoted this post',
          hasUpvoted: true,
          upvoteCount: post.upvoteCount,
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/discussions/:postId/vote
 * Remove upvote from a discussion post
 */
export const removeVoteDiscussion = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format',
      });
    }

    const deletedVote = await DiscussionVote.findOneAndDelete({
      post: postId,
      user: req.user._id,
    });

    if (deletedVote) {
      // Atomically decrement upvote count safely (min 0)
      const updatedPost = await DiscussionPost.findOneAndUpdate(
        { _id: postId, upvoteCount: { $gt: 0 } },
        { $inc: { upvoteCount: -1 } },
        { new: true }
      );

      const count = updatedPost ? updatedPost.upvoteCount : 0;

      return res.status(200).json({
        success: true,
        message: 'Upvote removed',
        hasUpvoted: false,
        upvoteCount: count,
      });
    }

    const currentPost = await DiscussionPost.findById(postId).select('upvoteCount');

    return res.status(200).json({
      success: true,
      message: 'Vote was not found',
      hasUpvoted: false,
      upvoteCount: currentPost ? currentPost.upvoteCount : 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/discussions/:postId/save
 * Save/bookmark a discussion post
 */
export const saveDiscussion = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format',
      });
    }

    const post = await DiscussionPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Discussion post not found',
      });
    }

    try {
      await SavedDiscussion.create({
        post: postId,
        user: req.user._id,
      });

      await DiscussionPost.findByIdAndUpdate(postId, { $inc: { saveCount: 1 } });

      return res.status(200).json({
        success: true,
        message: 'Discussion saved to your bookmarks',
        hasSaved: true,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(200).json({
          success: true,
          message: 'Discussion is already in your saved bookmarks',
          hasSaved: true,
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/discussions/:postId/save
 * Remove saved/bookmarked discussion
 */
export const unsaveDiscussion = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format',
      });
    }

    const deleted = await SavedDiscussion.findOneAndDelete({
      post: postId,
      user: req.user._id,
    });

    if (deleted) {
      await DiscussionPost.findOneAndUpdate(
        { _id: postId, saveCount: { $gt: 0 } },
        { $inc: { saveCount: -1 } }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Discussion removed from bookmarks',
      hasSaved: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/discussions/user/saved
 * Retrieve current user's saved discussions
 */
export const getSavedDiscussions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [totalSaved, savedDocs] = await Promise.all([
      SavedDiscussion.countDocuments({ user: req.user._id }),
      SavedDiscussion.find({ user: req.user._id })
        .populate({
          path: 'post',
          populate: { path: 'author', select: AUTHOR_FIELDS },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Filter out any orphaned saves where the post was deleted or hidden
    const validDiscussions = savedDocs
      .filter((s) => s.post && s.post.status !== DISCUSSION_STATUS.HIDDEN)
      .map((s) => ({
        ...s.post,
        id: s.post._id,
        savedAt: s.createdAt,
        hasSaved: true,
        isResolved: s.post.status === DISCUSSION_STATUS.RESOLVED || !!s.post.acceptedAnswer,
      }));

    return res.status(200).json({
      success: true,
      count: validDiscussions.length,
      totalSaved,
      totalPages: Math.ceil(totalSaved / limit) || 1,
      currentPage: page,
      discussions: validDiscussions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/discussions/:postId/report
 * Report a discussion post or comment for moderation review
 */
export const reportContent = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const { reason, details } = req.body;

    if (!reason || !REPORT_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid report reason: ${REPORT_REASONS.join(', ')}`,
      });
    }

    const targetType = commentId ? 'comment' : 'post';
    const targetId = commentId || postId;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target item ID format',
      });
    }

    // Verify target item exists
    if (targetType === 'post') {
      const post = await DiscussionPost.findById(targetId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'The discussion post you are reporting no longer exists',
        });
      }
    } else {
      const comment = await DiscussionComment.findById(targetId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'The comment you are reporting no longer exists',
        });
      }
    }

    try {
      await ContentReport.create({
        reporter: req.user._id,
        targetType,
        targetId,
        reason,
        details: details ? details.trim().slice(0, 1000) : '',
      });

      return res.status(201).json({
        success: true,
        message: 'Thank you for your report. Our campus moderation team has been notified.',
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(200).json({
          success: true,
          message: 'You have already submitted a report for this item. It is currently under review.',
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};
