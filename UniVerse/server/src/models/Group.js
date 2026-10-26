import mongoose from 'mongoose';
import { GROUP_CATEGORIES, GROUP_VISIBILITY } from '../utils/constants.js';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: [3, 'Group name must be at least 3 characters'],
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [250, 'Short description cannot exceed 250 characters'],
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: GROUP_CATEGORIES,
        message: 'Invalid group category',
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    coverImage: {
      type: String,
      default: '',
      trim: true,
    },
    visibility: {
      type: String,
      enum: Object.values(GROUP_VISIBILITY),
      default: GROUP_VISIBILITY.PUBLIC,
    },
    rules: {
      type: [String],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Group owner reference is required'],
    },
    memberCount: {
      type: Number,
      default: 1,
      min: [0, 'Member count cannot be negative'],
    },
    postCount: {
      type: Number,
      default: 0,
      min: [0, 'Post count cannot be negative'],
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

// Indexes for search, category filtering, and sorting
groupSchema.index({ category: 1 });
groupSchema.index({ visibility: 1 });
groupSchema.index({ memberCount: -1 });
groupSchema.index({ createdAt: -1 });
groupSchema.index({ name: 'text', shortDescription: 'text', description: 'text', tags: 'text' });

export const Group = mongoose.model('Group', groupSchema);
