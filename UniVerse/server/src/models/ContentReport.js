import mongoose from 'mongoose';
import { REPORT_REASONS, REPORT_STATUS } from '../utils/constants.js';

const contentReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required'],
      index: true,
    },
    targetType: {
      type: String,
      enum: {
        values: ['post', 'comment'],
        message: 'Target type must be either post or comment',
      },
      required: [true, 'Target type is required'],
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
      index: true,
    },
    reason: {
      type: String,
      enum: {
        values: REPORT_REASONS,
        message: 'Invalid report reason',
      },
      required: [true, 'Report reason is required'],
    },
    details: {
      type: String,
      trim: true,
      maxlength: [1000, 'Details cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: Object.values(REPORT_STATUS),
        message: 'Invalid report status',
      },
      default: REPORT_STATUS.PENDING,
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    resolution: {
      type: String,
      enum: ['none', 'dismissed', 'hidden', 'deleted'],
      default: 'none',
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: '',
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

// Compound unique index prevents same user reporting same item multiple times
contentReportSchema.index({ reporter: 1, targetType: 1, targetId: 1 }, { unique: true });
contentReportSchema.index({ status: 1, createdAt: -1 });

export const ContentReport = mongoose.model('ContentReport', contentReportSchema);
