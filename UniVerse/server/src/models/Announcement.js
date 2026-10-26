import mongoose from 'mongoose';
import { ANNOUNCEMENT_CATEGORIES, ANNOUNCEMENT_PRIORITIES } from '../utils/constants.js';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Announcement category is required'],
      enum: {
        values: ANNOUNCEMENT_CATEGORIES,
        message: 'Invalid announcement category',
      },
    },
    priority: {
      type: String,
      enum: {
        values: ANNOUNCEMENT_PRIORITIES,
        message: 'Invalid announcement priority',
      },
      default: 'normal',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    publishedAt: {
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

// Indexes for student feed and category queries
announcementSchema.index({ isPublished: 1, publishedAt: -1 });
announcementSchema.index({ category: 1 });
announcementSchema.index({ title: 'text', content: 'text' });

export const Announcement = mongoose.model('Announcement', announcementSchema);
