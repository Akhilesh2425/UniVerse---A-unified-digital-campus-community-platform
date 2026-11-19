import mongoose from 'mongoose';

const issueAssignmentHistorySchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CampusIssue',
      required: [true, 'Issue reference is required'],
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned by user is required'],
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Instructions cannot exceed 1000 characters'],
    },
    targetDate: {
      type: Date,
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

issueAssignmentHistorySchema.index({ issue: 1, createdAt: 1 });

export const IssueAssignmentHistory = mongoose.model(
  'IssueAssignmentHistory',
  issueAssignmentHistorySchema
);
