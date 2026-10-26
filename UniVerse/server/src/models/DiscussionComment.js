import mongoose from 'mongoose';

const discussionCommentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiscussionPost',
      required: [true, 'Post reference is required'],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [2, 'Comment must be at least 2 characters'],
      maxlength: [5000, 'Comment cannot exceed 5000 characters'],
    },
    isAcceptedAnswer: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'hidden'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

discussionCommentSchema.index({ post: 1, isAcceptedAnswer: -1, createdAt: 1 });
discussionCommentSchema.index({ author: 1, createdAt: -1 });

export const DiscussionComment = mongoose.model('DiscussionComment', discussionCommentSchema);
