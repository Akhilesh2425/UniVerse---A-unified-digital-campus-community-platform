import mongoose from 'mongoose';

const savedDiscussionSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiscussionPost',
      required: [true, 'Post reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
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

// Compound unique index prevents duplicate saved entries for same user and post
savedDiscussionSchema.index({ post: 1, user: 1 }, { unique: true });
savedDiscussionSchema.index({ user: 1, createdAt: -1 });

export const SavedDiscussion = mongoose.model('SavedDiscussion', savedDiscussionSchema);
