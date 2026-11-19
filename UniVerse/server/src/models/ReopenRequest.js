import mongoose from 'mongoose';
import { REOPEN_STATUS } from '../utils/constants.js';

const reopenRequestSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CampusIssue',
      required: [true, 'Issue reference is required'],
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason for reopening is required'],
      trim: true,
      minlength: [5, 'Reason must be at least 5 characters'],
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(REOPEN_STATUS),
        message: 'Invalid reopen request status',
      },
      default: REOPEN_STATUS.PENDING,
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewExplanation: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Review explanation cannot exceed 1000 characters'],
    },
    reviewedAt: {
      type: Date,
      default: null,
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

reopenRequestSchema.index({ issue: 1, status: 1 });

export const ReopenRequest = mongoose.model('ReopenRequest', reopenRequestSchema);
