import mongoose from 'mongoose';
import { JOIN_REQUEST_STATUS } from '../utils/constants.js';

const groupJoinRequestSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    status: {
      type: String,
      enum: Object.values(JOIN_REQUEST_STATUS),
      default: JOIN_REQUEST_STATUS.PENDING,
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

// Indexes to quickly find pending requests and prevent duplicate pending requests
groupJoinRequestSchema.index({ group: 1, user: 1 });
groupJoinRequestSchema.index({ group: 1, status: 1 });
groupJoinRequestSchema.index({ user: 1, status: 1 });

export const GroupJoinRequest = mongoose.model('GroupJoinRequest', groupJoinRequestSchema);
