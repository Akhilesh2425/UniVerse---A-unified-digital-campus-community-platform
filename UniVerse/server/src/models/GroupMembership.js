import mongoose from 'mongoose';
import { GROUP_ROLES } from '../utils/constants.js';

const groupMembershipSchema = new mongoose.Schema(
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
    role: {
      type: String,
      enum: Object.values(GROUP_ROLES),
      default: GROUP_ROLES.MEMBER,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
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

// Compound unique index preventing duplicate memberships for a user in a group
groupMembershipSchema.index({ group: 1, user: 1 }, { unique: true });
groupMembershipSchema.index({ user: 1, role: 1 });
groupMembershipSchema.index({ group: 1, role: 1 });

export const GroupMembership = mongoose.model('GroupMembership', groupMembershipSchema);
