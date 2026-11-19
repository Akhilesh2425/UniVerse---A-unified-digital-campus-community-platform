import mongoose from 'mongoose';

const issueFeedbackSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CampusIssue',
      required: [true, 'Issue reference is required'],
      unique: true,
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Satisfaction rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
    },
    wasResolved: {
      type: Boolean,
      required: [true, 'Please indicate if the issue was satisfactorily resolved'],
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

export const IssueFeedback = mongoose.model('IssueFeedback', issueFeedbackSchema);
