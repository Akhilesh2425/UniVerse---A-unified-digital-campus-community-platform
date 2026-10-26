import mongoose from 'mongoose';
import { DISCUSSION_CATEGORIES, DISCUSSION_TYPES, DISCUSSION_STATUS } from '../utils/constants.js';

const discussionPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Discussion title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Discussion content is required'],
      trim: true,
      minlength: [10, 'Content must be at least 10 characters'],
    },
    type: {
      type: String,
      enum: {
        values: Object.values(DISCUSSION_TYPES),
        message: 'Invalid discussion post type',
      },
      default: DISCUSSION_TYPES.DISCUSSION,
      index: true,
    },
    category: {
      type: String,
      enum: {
        values: DISCUSSION_CATEGORIES,
        message: 'Invalid discussion category',
      },
      required: [true, 'Category is required'],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      set: (tags) =>
        Array.isArray(tags)
          ? tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
          : [],
    },
    resourceUrl: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: Object.values(DISCUSSION_STATUS),
        message: 'Invalid discussion status',
      },
      default: DISCUSSION_STATUS.OPEN,
      index: true,
    },
    acceptedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiscussionComment',
      default: null,
    },
    upvoteCount: {
      type: Number,
      default: 0,
      min: [0, 'Upvote count cannot be negative'],
    },
    commentCount: {
      type: Number,
      default: 0,
      min: [0, 'Comment count cannot be negative'],
    },
    saveCount: {
      type: Number,
      default: 0,
      min: [0, 'Save count cannot be negative'],
    },
    views: {
      type: Number,
      default: 0,
      min: [0, 'Views count cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual helper for question resolved status
discussionPostSchema.virtual('isResolved').get(function () {
  return this.status === DISCUSSION_STATUS.RESOLVED || !!this.acceptedAnswer;
});

// Compound indexes for optimized query performance
discussionPostSchema.index({ createdAt: -1 });
discussionPostSchema.index({ category: 1, createdAt: -1 });
discussionPostSchema.index({ type: 1, createdAt: -1 });
discussionPostSchema.index({ upvoteCount: -1, createdAt: -1 });
discussionPostSchema.index({ status: 1, createdAt: -1 });
discussionPostSchema.index({ author: 1, createdAt: -1 });
discussionPostSchema.index({ tags: 1 });

// Full-text search index across title, content, and tags
discussionPostSchema.index(
  { title: 'text', content: 'text', tags: 'text' },
  { weights: { title: 5, tags: 3, content: 1 }, name: 'DiscussionTextIndex' }
);

export const DiscussionPost = mongoose.model('DiscussionPost', discussionPostSchema);
