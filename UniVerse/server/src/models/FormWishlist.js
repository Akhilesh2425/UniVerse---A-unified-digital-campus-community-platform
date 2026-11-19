import mongoose from 'mongoose';

const formWishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentForm',
      required: [true, 'Form reference is required'],
      index: true,
    },
    reminderEnabled: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
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

formWishlistSchema.index({ user: 1, form: 1 }, { unique: true });

export const FormWishlist = mongoose.model('FormWishlist', formWishlistSchema);

