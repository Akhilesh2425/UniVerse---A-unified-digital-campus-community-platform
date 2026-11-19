import mongoose from 'mongoose';
import { FORM_CATEGORIES, FORM_STATUS } from '../utils/constants.js';

const studentFormSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Form / opportunity title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Form description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Form category is required'],
      enum: {
        values: FORM_CATEGORIES,
        message: 'Invalid form category',
      },
    },
    formUrl: {
      type: String,
      required: [true, 'Form URL or registration link is required'],
      trim: true,
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Form URL must be a valid http or https web address',
      },
    },
    deadline: {
      type: Date,
      required: [true, 'Application / submission deadline is required'],
    },
    targetAudience: {
      type: String,
      default: 'All Students',
      trim: true,
    },
    eligibleDepartments: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(FORM_STATUS),
      default: FORM_STATUS.OPEN,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Publisher reference is required'],
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollegeClub',
      default: null,
    },
    attachmentUrl: {
      type: String,
      default: '',
      trim: true,
    },
    wishlistCount: {
      type: Number,
      default: 0,
      min: 0,
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

studentFormSchema.virtual('daysRemaining').get(function () {
  if (!this.deadline) return 0;
  const now = new Date();
  const diffTime = new Date(this.deadline).getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

studentFormSchema.virtual('isExpired').get(function () {
  if (!this.deadline) return false;
  return new Date() > new Date(this.deadline);
});

studentFormSchema.index({ deadline: 1 });
studentFormSchema.index({ status: 1 });
studentFormSchema.index({ category: 1 });
studentFormSchema.index({ title: 'text', description: 'text' });

export const StudentForm = mongoose.model('StudentForm', studentFormSchema);

