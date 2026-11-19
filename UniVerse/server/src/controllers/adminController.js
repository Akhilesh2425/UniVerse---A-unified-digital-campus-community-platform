import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { Announcement } from '../models/Announcement.js';
import { Group } from '../models/Group.js';
import { GroupMembership } from '../models/GroupMembership.js';
import { DiscussionPost } from '../models/DiscussionPost.js';
import { DiscussionComment } from '../models/DiscussionComment.js';
import { CampusIssue } from '../models/CampusIssue.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { CollegeClub } from '../models/CollegeClub.js';
import { ClubProposal } from '../models/ClubProposal.js';
import { StudentForm } from '../models/StudentForm.js';
import { FormWishlist } from '../models/FormWishlist.js';
import { ROLES, USER_STATUS, AUDIT_ACTIONS, NOTIFICATION_TYPES } from '../utils/constants.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

export const getDashboardOverview = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const now = new Date();

    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      activeUsers,
      suspendedUsers,
      deactivatedUsers,
      newUsersLast30Days,
      usersByDepartment,

      totalEvents,
      upcomingEvents,
      completedEvents,
      totalRegistrations,

      totalAnnouncements,
      publishedAnnouncements,
      draftAnnouncements,

      totalGroups,
      publicGroups,
      privateGroups,
      totalMemberships,

      totalDiscussions,
      questionDiscussions,
      resolvedDiscussions,
      totalDiscussionComments,

      totalIssues,
      submittedIssues,
      underReviewIssues,
      approvedIssues,
      assignedIssues,
      inProgressIssues,
      onHoldIssues,
      resolvedIssues,
      closedIssues,
      rejectedIssues,
      criticalIssues,

      totalClubs,
      pendingProposals,
      totalForms,
      openForms,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: ROLES.STUDENT }),
      User.countDocuments({ role: ROLES.ADMIN }),
      User.countDocuments({ status: USER_STATUS.ACTIVE }),
      User.countDocuments({ status: USER_STATUS.SUSPENDED }),
      User.countDocuments({ status: USER_STATUS.DEACTIVATED }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      Event.countDocuments(),
      Event.countDocuments({ startDate: { $gte: now } }),
      Event.countDocuments({ endDate: { $lt: now } }),
      EventRegistration.countDocuments({ status: 'registered' }),

      Announcement.countDocuments(),
      Announcement.countDocuments({ isPublished: true }),
      Announcement.countDocuments({ isPublished: false }),

      Group.countDocuments(),
      Group.countDocuments({ visibility: 'public' }),
      Group.countDocuments({ visibility: 'private' }),
      GroupMembership.countDocuments(),

      DiscussionPost.countDocuments(),
      DiscussionPost.countDocuments({ postType: 'question' }),
      DiscussionPost.countDocuments({ status: 'resolved' }),
      DiscussionComment.countDocuments(),

      CampusIssue.countDocuments(),
      CampusIssue.countDocuments({ status: 'submitted' }),
      CampusIssue.countDocuments({ status: 'under_review' }),
      CampusIssue.countDocuments({ status: 'approved' }),
      CampusIssue.countDocuments({ status: 'assigned' }),
      CampusIssue.countDocuments({ status: 'in_progress' }),
      CampusIssue.countDocuments({ status: 'on_hold' }),
      CampusIssue.countDocuments({ status: 'resolved' }),
      CampusIssue.countDocuments({ status: 'closed' }),
      CampusIssue.countDocuments({ status: 'rejected' }),
      CampusIssue.countDocuments({ priority: 'critical' }),

      CollegeClub.countDocuments({ status: 'active' }),
      ClubProposal.countDocuments({ status: 'pending' }),
      StudentForm.countDocuments(),
      StudentForm.countDocuments({ status: 'open', deadline: { $gte: now } }),
    ]);

    return res.status(200).json({
      success: true,
      statistics: {
        users: {
          total: totalUsers,
          students: totalStudents,
          admins: totalAdmins,
          active: activeUsers,
          suspended: suspendedUsers,
          deactivated: deactivatedUsers,
          newLast30Days: newUsersLast30Days,
          departmentDistribution: usersByDepartment.map((d) => ({
            department: d._id || 'Unassigned',
            count: d.count,
          })),
        },
        events: {
          total: totalEvents,
          upcoming: upcomingEvents,
          completed: completedEvents,
          totalRegistrations,
        },
        announcements: {
          total: totalAnnouncements,
          published: publishedAnnouncements,
          drafts: draftAnnouncements,
        },
        groups: {
          total: totalGroups,
          public: publicGroups,
          private: privateGroups,
          totalMemberships,
        },
        discussions: {
          total: totalDiscussions,
          questions: questionDiscussions,
          resolved: resolvedDiscussions,
          comments: totalDiscussionComments,
        },
        issues: {
          total: totalIssues,
          submitted: submittedIssues,
          underReview: underReviewIssues,
          approved: approvedIssues,
          assigned: assignedIssues,
          inProgress: inProgressIssues,
          onHold: onHoldIssues,
          resolved: resolvedIssues,
          closed: closedIssues,
          rejected: rejectedIssues,
          critical: criticalIssues,
        },
        clubs: {
          total: totalClubs,
          pendingProposals,
        },
        forms: {
          total: totalForms,
          open: openForms,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardActivity = async (req, res, next) => {
  try {
    const [
      recentAudits,
      recentUsers,
      recentEvents,
      recentGroups,
      recentDiscussions,
      recentPublicIssues,
    ] = await Promise.all([
      AdminAuditLog.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('actor', 'name role avatarUrl')
        .lean(),

      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role department createdAt')
        .lean(),

      Event.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title category startDate venue createdAt')
        .lean(),

      Group.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name category visibility memberCount createdAt')
        .lean(),

      DiscussionPost.find({ status: { $ne: 'hidden' } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('author', 'name department')
        .select('title category postType upvoteCount commentCount createdAt')
        .lean(),

      CampusIssue.find({ visibility: 'public' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('referenceId title category priority status createdAt')
        .lean(),
    ]);

    const activities = [
      ...recentAudits.map((a) => ({
        id: a._id,
        kind: 'audit',
        title: a.action.replace(/_/g, ' '),
        description: a.description,
        actor: a.actor?.name || 'Administrator',
        actorRole: a.actor?.role || 'admin',
        createdAt: a.createdAt,
        badgeColor: 'amber',
      })),
      ...recentUsers.map((u) => ({
        id: u._id,
        kind: 'user',
        title: 'New Student Registration',
        description: `${u.name} registered in ${u.department}`,
        actor: u.name,
        actorRole: u.role,
        createdAt: u.createdAt,
        badgeColor: 'blue',
      })),
      ...recentEvents.map((e) => ({
        id: e._id,
        kind: 'event',
        title: 'Campus Event Scheduled',
        description: `"${e.title}" at ${e.venue}`,
        actor: 'Campus Events',
        actorRole: 'admin',
        createdAt: e.createdAt,
        badgeColor: 'indigo',
      })),
      ...recentGroups.map((g) => ({
        id: g._id,
        kind: 'group',
        title: 'New Community Formed',
        description: `"${g.name}" (${g.category})`,
        actor: 'Student Community',
        actorRole: 'student',
        createdAt: g.createdAt,
        badgeColor: 'emerald',
      })),
      ...recentDiscussions.map((d) => ({
        id: d._id,
        kind: 'discussion',
        title: 'New Discussion Started',
        description: `"${d.title}" by ${d.author?.name || 'Student'}`,
        actor: d.author?.name || 'Student',
        actorRole: 'student',
        createdAt: d.createdAt,
        badgeColor: 'purple',
      })),
      ...recentPublicIssues.map((i) => ({
        id: i._id,
        kind: 'issue',
        title: 'Campus Issue Reported',
        description: `[${i.referenceId}] ${i.title} (${i.priority})`,
        actor: 'Student Reporter',
        actorRole: 'student',
        createdAt: i.createdAt,
        badgeColor: 'rose',
      })),
    ];

    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      activities: activities.slice(0, 20),
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const [
      registrationTrends,
      issueStatusDistribution,
      issuePriorityDistribution,
      departmentDistribution,
    ] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      CampusIssue.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      CampusIssue.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      User.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedTrends = registrationTrends.map((t) => ({
      period: `${monthNames[t._id.month - 1]} ${t._id.year}`,
      count: t.count,
    }));

    return res.status(200).json({
      success: true,
      analytics: {
        registrationTrends: formattedTrends,
        issueStatusDistribution: issueStatusDistribution.map((s) => ({
          status: s._id,
          count: s.count,
        })),
        issuePriorityDistribution: issuePriorityDistribution.map((p) => ({
          priority: p._id,
          count: p.count,
        })),
        departmentDistribution: departmentDistribution.map((d) => ({
          department: d._id || 'Unspecified',
          count: d.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const {
      q = '',
      role = '',
      status = '',
      department = '',
      academicYear = '',
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (q.trim()) {
      const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    if (role && Object.values(ROLES).includes(role)) {
      query.role = role;
    }

    if (status && Object.values(USER_STATUS).includes(status)) {
      query.status = status;
    }

    if (department.trim()) {
      query.department = department.trim();
    }

    if (academicYear.trim()) {
      query.academicYear = academicYear.trim();
    }

    const take = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * take;

    const sortOption = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(take)
        .populate('statusUpdatedBy', 'name email')
        .lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      users,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take) || 1,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    const user = await User.findById(userId).populate('statusUpdatedBy', 'name email role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const [
      eventRegistrationsCount,
      groupsCount,
      discussionsCount,
      issuesReportedCount,
    ] = await Promise.all([
      EventRegistration.countDocuments({ user: userId, status: 'registered' }),
      GroupMembership.countDocuments({ user: userId }),
      DiscussionPost.countDocuments({ author: userId }),
      CampusIssue.countDocuments({ reporter: userId }),
    ]);

    return res.status(200).json({
      success: true,
      user,
      activitySummary: {
        eventsRegistered: eventRegistrationsCount,
        groupsJoined: groupsCount,
        discussionsAuthored: discussionsCount,
        issuesReported: issuesReportedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, reason = '' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    if (!Object.values(USER_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Object.values(USER_STATUS).join(', ')}`,
      });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot change their own account status.',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const previousStatus = targetUser.status || USER_STATUS.ACTIVE;

    targetUser.status = status;
    targetUser.statusReason = reason.trim();
    targetUser.statusUpdatedBy = req.user._id;
    await targetUser.save();

    await logAudit({
      req,
      actorId: req.user._id,
      action: AUDIT_ACTIONS.USER_STATUS_CHANGE,
      targetType: 'User',
      targetId: targetUser._id,
      description: `Account status for ${targetUser.name} (${targetUser.email}) changed from "${previousStatus}" to "${status}". Reason: ${reason || 'N/A'}`,
      metadata: { previousStatus, newStatus: status, reason },
    });

    await createNotification({
      recipient: targetUser._id,
      actor: req.user._id,
      type: NOTIFICATION_TYPES.ACCOUNT_STATUS,
      title: 'Account Status Update',
      message: `Your campus account status has been updated to "${status}". ${reason ? `Reason: ${reason}` : ''}`,
      entityType: 'user',
      entityId: targetUser._id,
      actionUrl: '/dashboard',
    });

    return res.status(200).json({
      success: true,
      message: `User status updated to ${status} successfully.`,
      user: targetUser,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${Object.values(ROLES).join(', ')}`,
      });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot demote their own account.',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (role === ROLES.MAIN_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Main College Administrator role cannot be assigned via standard API. Bootstrap provisioning is required.',
      });
    }

    if ((role === ROLES.ADMIN || targetUser.role === ROLES.ADMIN) && req.user.role !== ROLES.MAIN_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only the Main College Administrator can manage administrator roles.',
      });
    }

    if (targetUser.role === ROLES.MAIN_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Main College Administrator account cannot be demoted.',
      });
    }

    if (targetUser.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
      const adminCount = await User.countDocuments({ role: { $in: [ROLES.ADMIN, ROLES.MAIN_ADMIN] } });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the only remaining administrator in the platform.',
        });
      }
    }

    const previousRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await logAudit({
      req,
      actorId: req.user._id,
      action: AUDIT_ACTIONS.USER_ROLE_CHANGE,
      targetType: 'User',
      targetId: targetUser._id,
      description: `Role for ${targetUser.name} (${targetUser.email}) changed from "${previousRole}" to "${role}".`,
      metadata: { previousRole, newRole: role },
    });

    await createNotification({
      recipient: targetUser._id,
      actor: req.user._id,
      type: NOTIFICATION_TYPES.ACCOUNT_ROLE,
      title: 'Platform Role Updated',
      message: `Your platform role has been updated to "${role}".`,
      entityType: 'user',
      entityId: targetUser._id,
      actionUrl: role === ROLES.ADMIN ? '/admin' : '/dashboard',
    });

    return res.status(200).json({
      success: true,
      message: `User role successfully updated to ${role}.`,
      user: targetUser,
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const {
      action = '',
      targetType = '',
      q = '',
      page = 1,
      limit = 25,
    } = req.query;

    const query = {};

    if (action.trim()) {
      query.action = action.trim();
    }

    if (targetType.trim()) {
      query.targetType = targetType.trim();
    }

    if (q.trim()) {
      const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.description = regex;
    }

    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * take;

    const [logs, total] = await Promise.all([
      AdminAuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .populate('actor', 'name email role department avatarUrl')
        .lean(),
      AdminAuditLog.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take) || 1,
    });
  } catch (error) {
    next(error);
  }
};
