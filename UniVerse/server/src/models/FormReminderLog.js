import mongoose from 'mongoose';

const formReminderLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentForm',
      required: true,
      index: true,
    },
    reminderDate: {
      type: String, 
      required: true,
      index: true,
    },
    daysRemaining: {
      type: Number,
      required: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['sent', 'failed', 'simulated'],
      default: 'sent',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

formReminderLogSchema.index({ user: 1, form: 1, reminderDate: 1 }, { unique: true });

export const FormReminderLog = mongoose.model('FormReminderLog', formReminderLogSchema);

