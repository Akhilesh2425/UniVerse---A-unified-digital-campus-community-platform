import { Notification } from '../models/Notification.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { NOTIFICATION_TYPES } from '../utils/constants.js';

const TYPE_TO_PREFERENCE = {
  [NOTIFICATION_TYPES.EVENT_UPDATE]: 'eventUpdates',
  [NOTIFICATION_TYPES.EVENT_CANCELLED]: 'eventUpdates',
  [NOTIFICATION_TYPES.ANNOUNCEMENT_PUBLISHED]: 'announcements',
  [NOTIFICATION_TYPES.GROUP_JOIN_REQUEST]: 'groupActivity',
  [NOTIFICATION_TYPES.GROUP_JOIN_DECISION]: 'membershipUpdates',
  [NOTIFICATION_TYPES.GROUP_ROLE_UPDATE]: 'membershipUpdates',
  [NOTIFICATION_TYPES.DISCUSSION_COMMENT]: 'discussionActivity',
  [NOTIFICATION_TYPES.DISCUSSION_ACCEPTED_ANSWER]: 'discussionActivity',
  [NOTIFICATION_TYPES.CAMPUS_ISSUE_UPDATE]: 'campusIssueUpdates',
  [NOTIFICATION_TYPES.CAMPUS_ISSUE_RESOLVED]: 'campusIssueUpdates',
  [NOTIFICATION_TYPES.CAMPUS_ISSUE_REOPENED]: 'campusIssueUpdates',
  [NOTIFICATION_TYPES.ACCOUNT_STATUS]: 'essentialAccountNotices',
  [NOTIFICATION_TYPES.ACCOUNT_ROLE]: 'essentialAccountNotices',
  [NOTIFICATION_TYPES.SYSTEM]: 'essentialAccountNotices',
};

export const getOrCreatePreferences = async (userId) => {
  let prefs = await NotificationPreference.findOne({ user: userId });
  if (!prefs) {
    prefs = await NotificationPreference.create({
      user: userId,
      eventUpdates: true,
      announcements: true,
      groupActivity: true,
      membershipUpdates: true,
      discussionActivity: true,
      campusIssueUpdates: true,
      essentialAccountNotices: true,
    });
  }
  return prefs;
};

export const createNotification = async ({
  recipient,
  actor = null,
  type,
  title,
  message,
  entityType,
  entityId = null,
  actionUrl,
  metadata = {},
}) => {
  try {
    if (!recipient) return null;

    if (actor && recipient.toString() === actor.toString()) {
      return null;
    }

    const prefField = TYPE_TO_PREFERENCE[type] || 'essentialAccountNotices';

    if (prefField !== 'essentialAccountNotices') {
      const prefs = await getOrCreatePreferences(recipient);
      if (prefs && prefs[prefField] === false) {
        return null; 
      }
    }

    const notification = await Notification.create({
      recipient,
      actor,
      type,
      title,
      message,
      entityType,
      entityId,
      actionUrl,
      metadata,
    });

    return notification;
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error.message);
    return null;
  }
};

export const createBulkNotifications = async ({
  recipients = [],
  actor = null,
  type,
  title,
  message,
  entityType,
  entityId = null,
  actionUrl,
  metadata = {},
}) => {
  try {
    if (!Array.isArray(recipients) || recipients.length === 0) return [];

    const actorStr = actor ? actor.toString() : null;
    const uniqueRecipientIds = [
      ...new Set(recipients.map((r) => r.toString())),
    ].filter((id) => id !== actorStr);

    if (uniqueRecipientIds.length === 0) return [];

    const prefField = TYPE_TO_PREFERENCE[type] || 'essentialAccountNotices';

    let eligibleIds = uniqueRecipientIds;

    if (prefField !== 'essentialAccountNotices') {
      const disabledPrefs = await NotificationPreference.find({
        user: { $in: uniqueRecipientIds },
        [prefField]: false,
      }).select('user');

      const disabledUserIds = new Set(disabledPrefs.map((p) => p.user.toString()));
      eligibleIds = uniqueRecipientIds.filter((id) => !disabledUserIds.has(id));
    }

    if (eligibleIds.length === 0) return [];

    const docs = eligibleIds.map((recipientId) => ({
      recipient: recipientId,
      actor,
      type,
      title,
      message,
      entityType,
      entityId,
      actionUrl,
      metadata,
      isRead: false,
    }));

    const result = await Notification.insertMany(docs, { ordered: false });
    return result;
  } catch (error) {
    console.error('[NotificationService] Error in bulk notifications:', error.message);
    return [];
  }
};

export const getUserNotifications = async (userId, options = {}) => {
  const { isRead, type, page = 1, limit = 20 } = options;

  const query = { recipient: userId };

  if (typeof isRead === 'boolean' || isRead === 'true' || isRead === 'false') {
    query.isRead = isRead === true || isRead === 'true';
  }

  if (type) {
    query.type = type;
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, Math.max(1, parseInt(limit, 10)));
  const take = Math.min(50, Math.max(1, parseInt(limit, 10)));

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take)
      .populate('actor', 'name avatarUrl department role')
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / take) || 1,
  };
};

export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, isRead: false });
};

export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
  return notification;
};

export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return result;
};

export const deleteNotification = async (notificationId, userId) => {
  const result = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });
  return result;
};

export const updatePreferences = async (userId, updateData) => {
  const allowedFields = [
    'eventUpdates',
    'announcements',
    'groupActivity',
    'membershipUpdates',
    'discussionActivity',
    'campusIssueUpdates',
    'emailAnnouncements',
    'emailNewClubs',
    'emailGroupActivity',
    'emailClubUpdates',
    'emailFormReminders',
    'emailEventUpdates',
    'emailDiscussionActivity',
  ];

  const update = {};
  allowedFields.forEach((field) => {
    if (typeof updateData[field] === 'boolean') {
      update[field] = updateData[field];
    }
  });

  const prefs = await NotificationPreference.findOneAndUpdate(
    { user: userId },
    { $set: update },
    { new: true, upsert: true }
  );

  return prefs;
};
