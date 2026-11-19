import mongoose from 'mongoose';

const groupActivitySchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date and time is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date and time is required'],
    },
    location: {
      type: String,
      trim: true,
      default: 'Campus Location / Room',
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

groupActivitySchema.index({ group: 1, startDate: 1 });

export const GroupActivity = mongoose.model('GroupActivity', groupActivitySchema);

