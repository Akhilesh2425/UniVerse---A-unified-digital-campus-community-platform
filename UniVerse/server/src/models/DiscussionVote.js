import mongoose from 'mongoose';

const discussionVoteSchema = new mongoose.Schema(
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

discussionVoteSchema.index({ post: 1, user: 1 }, { unique: true });

export const DiscussionVote = mongoose.model('DiscussionVote', discussionVoteSchema);
