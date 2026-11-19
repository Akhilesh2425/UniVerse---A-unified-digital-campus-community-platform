import mongoose from 'mongoose';
import { CLUB_POSITIONS } from '../utils/constants.js';

const clubMembershipSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollegeClub',
      required: [true, 'College club reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    position: {
      type: String,
      enum: Object.values(CLUB_POSITIONS),
      default: CLUB_POSITIONS.MEMBER,
    },
    role: {
      type: String,
      enum: ['leader', 'member', 'advisor'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['active', 'alumni'],
      default: 'active',
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

clubMembershipSchema.index({ club: 1, user: 1 }, { unique: true });
clubMembershipSchema.index({ club: 1, position: 1 });

export const ClubMembership = mongoose.model('ClubMembership', clubMembershipSchema);

