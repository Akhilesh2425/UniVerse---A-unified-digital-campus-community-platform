import mongoose from 'mongoose';

const emailDeliveryLogSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['otp', 'announcement', 'new_club', 'group_update', 'club_update', 'form_reminder', 'system'],
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      default: '',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    deliveryStatus: {
      type: String,
      enum: ['sent', 'failed', 'simulated'],
      default: 'sent',
      index: true,
    },
    providerMessageId: {
      type: String,
      default: '',
    },
    errorMessage: {
      type: String,
      default: '',
    },
    attemptCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

emailDeliveryLogSchema.index({ createdAt: -1 });

export const EmailDeliveryLog = mongoose.model('EmailDeliveryLog', emailDeliveryLogSchema);

