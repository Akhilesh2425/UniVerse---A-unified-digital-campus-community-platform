import mongoose from 'mongoose';
import { EVENT_CATEGORIES } from '../utils/constants.js';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Event category is required'],
      enum: {
        values: EVENT_CATEGORIES,
        message: 'Invalid event category',
      },
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
      maxlength: [100, 'Venue cannot exceed 100 characters'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date and time are required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date and time are required'],
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: 'End date and time must be after start date and time',
      },
    },
    registrationDeadline: {
      type: Date,
      default: null,
    },
    maxCapacity: {
      type: Number,
      default: null, 
      min: [1, 'Maximum capacity must be at least 1 if specified'],
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: [0, 'Registered count cannot be negative'],
    },
    posterUrl: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required'],
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollegeClub',
      default: null,
      index: true,
    },
    isClubEvent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

eventSchema.virtual('isRegistrationOpen').get(function () {
  const now = new Date();
  if (this.registrationDeadline && now > this.registrationDeadline) {
    return false;
  }
  if (this.startDate && now > this.startDate) {
    return false;
  }
  if (this.maxCapacity && this.registeredCount >= this.maxCapacity) {
    return false;
  }
  return true;
});

eventSchema.virtual('remainingSpots').get(function () {
  if (this.maxCapacity === null || this.maxCapacity === undefined) {
    return null; 
  }
  return Math.max(0, this.maxCapacity - this.registeredCount);
});

eventSchema.index({ startDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ title: 'text', description: 'text' });

export const Event = mongoose.model('Event', eventSchema);
