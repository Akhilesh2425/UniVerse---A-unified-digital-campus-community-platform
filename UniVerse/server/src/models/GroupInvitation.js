import mongoose from 'mongoose';

const groupInvitationSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group reference is required'],
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    maxUses: {
      type: Number,
      default: null, 
    },
    useCount: {
      type: Number,
      default: 0,
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

groupInvitationSchema.methods.isValid = function () {
  if (this.revokedAt) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  if (this.maxUses !== null && this.useCount >= this.maxUses) return false;
  return true;
};

export const GroupInvitation = mongoose.model('GroupInvitation', groupInvitationSchema);

