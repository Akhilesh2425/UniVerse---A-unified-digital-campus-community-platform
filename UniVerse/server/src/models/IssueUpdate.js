import mongoose from 'mongoose';

const issueUpdateSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CampusIssue',
      required: [true, 'Issue reference is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Update content is required'],
      trim: true,
      minlength: [2, 'Update must be at least 2 characters'],
      maxlength: [2000, 'Update cannot exceed 2000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
    },
    visibility: {
      type: String,
      enum: {
        values: ['public', 'internal'],
        message: 'Invalid update visibility',
      },
      default: 'public',
      index: true,
    },
    relatedStatus: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

issueUpdateSchema.index({ issue: 1, visibility: 1, createdAt: 1 });

export const IssueUpdate = mongoose.model('IssueUpdate', issueUpdateSchema);
