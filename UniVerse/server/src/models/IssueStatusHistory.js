import mongoose from 'mongoose';

const issueStatusHistorySchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CampusIssue',
      required: [true, 'Issue reference is required'],
      index: true,
    },
    previousStatus: {
      type: String,
      required: true,
    },
    newStatus: {
      type: String,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Explanation cannot exceed 1000 characters'],
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

issueStatusHistorySchema.index({ issue: 1, createdAt: 1 });

export const IssueStatusHistory = mongoose.model(
  'IssueStatusHistory',
  issueStatusHistorySchema
);
