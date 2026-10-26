import mongoose from 'mongoose';

const groupPostSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group reference is required'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    commentCount: {
      type: Number,
      default: 0,
      min: [0, 'Comment count cannot be negative'],
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

groupPostSchema.index({ group: 1, createdAt: -1 });

export const GroupPost = mongoose.model('GroupPost', groupPostSchema);
