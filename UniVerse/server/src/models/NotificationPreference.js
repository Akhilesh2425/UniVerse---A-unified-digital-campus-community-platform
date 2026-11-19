import mongoose from 'mongoose';

const notificationPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    eventUpdates: {
      type: Boolean,
      default: true,
    },
    announcements: {
      type: Boolean,
      default: true,
    },
    groupActivity: {
      type: Boolean,
      default: true,
    },
    membershipUpdates: {
      type: Boolean,
      default: true,
    },
    discussionActivity: {
      type: Boolean,
      default: true,
    },
    campusIssueUpdates: {
      type: Boolean,
      default: true,
    },
    clubUpdates: {
      type: Boolean,
      default: true,
    },
    formReminders: {
      type: Boolean,
      default: true,
    },
    emailAnnouncements: {
      type: Boolean,
      default: true,
    },
    emailNewClubs: {
      type: Boolean,
      default: true,
    },
    emailGroupActivity: {
      type: Boolean,
      default: true,
    },
    emailClubUpdates: {
      type: Boolean,
      default: true,
    },
    emailFormReminders: {
      type: Boolean,
      default: true,
    },
    emailEventUpdates: {
      type: Boolean,
      default: true,
    },
    emailDiscussionActivity: {
      type: Boolean,
      default: false,
    },
    essentialAccountNotices: {
      type: Boolean,
      default: true,
      immutable: true, 
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationPreference = mongoose.model(
  'NotificationPreference',
  notificationPreferenceSchema
);
