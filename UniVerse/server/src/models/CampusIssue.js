import mongoose from 'mongoose';
import {
  ISSUE_CATEGORIES,
  ISSUE_PRIORITIES,
  ISSUE_STATUS,
  ISSUE_VISIBILITY,
  CAMPUS_DEPARTMENTS,
} from '../utils/constants.js';

const campusIssueSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: [true, 'Reference ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      enum: {
        values: ISSUE_CATEGORIES,
        message: 'Invalid issue category',
      },
      required: [true, 'Category is required'],
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Campus location is required'],
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters'],
    },
    building: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Building cannot exceed 100 characters'],
    },
    room: {
      type: String,
      trim: true,
      default: '',
      maxlength: [50, 'Room cannot exceed 50 characters'],
    },
    priority: {
      type: String,
      enum: {
        values: ISSUE_PRIORITIES,
        message: 'Invalid priority level',
      },
      default: 'medium',
      index: true,
    },
    visibility: {
      type: String,
      enum: {
        values: Object.values(ISSUE_VISIBILITY),
        message: 'Invalid visibility level',
      },
      default: ISSUE_VISIBILITY.PUBLIC,
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required'],
      index: true,
    },
    isAnonymousToPublic: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(ISSUE_STATUS),
        message: 'Invalid issue status',
      },
      default: ISSUE_STATUS.SUBMITTED,
      index: true,
    },
    assignedDepartment: {
      type: String,
      enum: {
        values: [...CAMPUS_DEPARTMENTS, null],
        message: 'Invalid campus department',
      },
      default: null,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetResolutionDate: {
      type: Date,
      default: null,
    },
    resolution: {
      summary: {
        type: String,
        trim: true,
        default: '',
      },
      actionTaken: {
        type: String,
        trim: true,
        default: '',
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      resolvedAt: {
        type: Date,
        default: null,
      },
      evidenceUrl: {
        type: String,
        trim: true,
        default: '',
      },
    },
    closedAt: {
      type: Date,
      default: null,
    },
    supportCount: {
      type: Number,
      default: 0,
      min: [0, 'Support count cannot be negative'],
    },
    commentCount: {
      type: Number,
      default: 0,
      min: [0, 'Comment count cannot be negative'],
    },
    images: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
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
    toObject: { virtuals: true },
  }
);

campusIssueSchema.index({ visibility: 1, status: 1, createdAt: -1 });
campusIssueSchema.index({ visibility: 1, category: 1, createdAt: -1 });
campusIssueSchema.index({ visibility: 1, priority: 1, createdAt: -1 });
campusIssueSchema.index({ visibility: 1, supportCount: -1, createdAt: -1 });
campusIssueSchema.index({ reporter: 1, createdAt: -1 });
campusIssueSchema.index({ assignedDepartment: 1, status: 1 });

campusIssueSchema.index(
  {
    title: 'text',
    description: 'text',
    location: 'text',
    building: 'text',
    referenceId: 'text',
  },
  {
    weights: {
      referenceId: 10,
      title: 5,
      location: 3,
      building: 2,
      description: 1,
    },
    name: 'CampusIssueTextIndex',
  }
);

export const CampusIssue = mongoose.model('CampusIssue', campusIssueSchema);
