import mongoose from 'mongoose';

const issueSupportSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CampusIssue',
      required: [true, 'Issue reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

issueSupportSchema.index({ issue: 1, user: 1 }, { unique: true });

export const IssueSupport = mongoose.model('IssueSupport', issueSupportSchema);
