import mongoose from 'mongoose';

const passwordResetOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '10m' }, 
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    verificationToken: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

passwordResetOtpSchema.index({ email: 1, isUsed: 1, expiresAt: 1 });

export const PasswordResetOtp = mongoose.model('PasswordResetOtp', passwordResetOtpSchema);

