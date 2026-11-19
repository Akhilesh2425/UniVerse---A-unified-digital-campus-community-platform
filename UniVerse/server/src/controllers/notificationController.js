import * as notificationService from '../services/notificationService.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const { isRead, type, page, limit } = req.query;
    const result = await notificationService.getUserNotifications(req.user._id, {
      isRead,
      type,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    return res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const notification = await notificationService.markAsRead(notificationId, req.user._id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const deleted = await notificationService.deleteNotification(notificationId, req.user._id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getPreferences = async (req, res, next) => {
  try {
    const preferences = await notificationService.getOrCreatePreferences(req.user._id);
    return res.status(200).json({
      success: true,
      preferences,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const preferences = await notificationService.updatePreferences(req.user._id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Notification preferences updated.',
      preferences,
    });
  } catch (error) {
    next(error);
  }
};
