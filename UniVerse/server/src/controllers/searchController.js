import { Event } from '../models/Event.js';
import { Announcement } from '../models/Announcement.js';
import { Group } from '../models/Group.js';
import { DiscussionPost } from '../models/DiscussionPost.js';
import { CampusIssue } from '../models/CampusIssue.js';

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const searchGlobal = async (req, res, next) => {
  try {
    const { q = '', type = 'all', category = '', page = 1, limit = 15 } = req.query;

    const trimmedQuery = q.trim();
    if (!trimmedQuery) {
      return res.status(200).json({
        success: true,
        query: '',
        counts: { all: 0, events: 0, announcements: 0, groups: 0, discussions: 0, issues: 0 },
        results: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
    }

    const regex = new RegExp(escapeRegex(trimmedQuery), 'i');

    const eventQuery = {
      $or: [{ title: regex }, { description: regex }, { venue: regex }],
    };
    if (category) eventQuery.category = category;

    const announcementQuery = {
      isPublished: true, 
      $or: [{ title: regex }, { content: regex }],
    };
    if (category) announcementQuery.category = category;

    const groupQuery = {
      visibility: 'public', 
      $or: [{ name: regex }, { shortDescription: regex }, { description: regex }, { tags: regex }],
    };
    if (category) groupQuery.category = category;

    const discussionQuery = {
      status: { $ne: 'hidden' }, 
      $or: [{ title: regex }, { content: regex }, { tags: regex }],
    };
    if (category) discussionQuery.category = category;

    const issueQuery = {
      visibility: 'public', 
      $or: [
        { title: regex },
        { description: regex },
        { location: regex },
        { referenceId: regex },
      ],
    };
    if (category) issueQuery.category = category;

    const [
      eventCount,
      announcementCount,
      groupCount,
      discussionCount,
      issueCount,
    ] = await Promise.all([
      Event.countDocuments(eventQuery),
      Announcement.countDocuments(announcementQuery),
      Group.countDocuments(groupQuery),
      DiscussionPost.countDocuments(discussionQuery),
      CampusIssue.countDocuments(issueQuery),
    ]);

    const counts = {
      all: eventCount + announcementCount + groupCount + discussionCount + issueCount,
      events: eventCount,
      announcements: announcementCount,
      groups: groupCount,
      discussions: discussionCount,
      issues: issueCount,
    };

    const takeLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skipOffset = (Math.max(1, parseInt(page, 10)) - 1) * takeLimit;

    let items = [];

    if (type === 'events') {
      const rawEvents = await Event.find(eventQuery)
        .sort({ startDate: -1 })
        .skip(skipOffset)
        .limit(takeLimit)
        .lean();
      items = rawEvents.map((e) => ({
        id: e._id,
        type: 'event',
        title: e.title,
        description: e.description,
        category: e.category,
        date: e.startDate,
        url: `/events/${e._id}`,
        imageUrl: e.posterUrl,
        extra: {
          venue: e.venue,
          maxParticipants: e.maxParticipants,
          registeredCount: e.registeredCount,
        },
      }));
    } else if (type === 'announcements') {
      const rawAnnouncements = await Announcement.find(announcementQuery)
        .sort({ createdAt: -1 })
        .skip(skipOffset)
        .limit(takeLimit)
        .lean();
      items = rawAnnouncements.map((a) => ({
        id: a._id,
        type: 'announcement',
        title: a.title,
        description: a.content,
        category: a.category,
        date: a.createdAt,
        url: `/announcements`,
        extra: { priority: a.priority },
      }));
    } else if (type === 'groups') {
      const rawGroups = await Group.find(groupQuery)
        .sort({ memberCount: -1 })
        .skip(skipOffset)
        .limit(takeLimit)
        .lean();
      items = rawGroups.map((g) => ({
        id: g._id,
        type: 'group',
        title: g.name,
        description: g.shortDescription || g.description,
        category: g.category,
        date: g.createdAt,
        url: `/groups/${g._id}`,
        imageUrl: g.bannerUrl,
        extra: { memberCount: g.memberCount, visibility: g.visibility },
      }));
    } else if (type === 'discussions') {
      const rawDiscussions = await DiscussionPost.find(discussionQuery)
        .sort({ createdAt: -1 })
        .skip(skipOffset)
        .limit(takeLimit)
        .populate('author', 'name department avatarUrl')
        .lean();
      items = rawDiscussions.map((d) => ({
        id: d._id,
        type: 'discussion',
        title: d.title,
        description: d.content,
        category: d.category,
        date: d.createdAt,
        url: `/discussions/${d._id}`,
        extra: {
          postType: d.postType,
          upvoteCount: d.upvoteCount,
          commentCount: d.commentCount,
          authorName: d.author?.name,
        },
      }));
    } else if (type === 'issues') {
      const rawIssues = await CampusIssue.find(issueQuery)
        .sort({ createdAt: -1 })
        .skip(skipOffset)
        .limit(takeLimit)
        .lean();
      items = rawIssues.map((i) => ({
        id: i._id,
        type: 'issue',
        title: i.title,
        description: i.description,
        category: i.category,
        date: i.createdAt,
        url: `/issues/${i._id}`,
        extra: {
          referenceId: i.referenceId,
          status: i.status,
          priority: i.priority,
          location: i.location,
          supportCount: i.supportCount,
        },
      }));
    } else {
      const perCatLimit = Math.ceil(takeLimit / 4);
      const [events, announcements, groups, discussions, issues] = await Promise.all([
        Event.find(eventQuery).sort({ startDate: -1 }).limit(perCatLimit).lean(),
        Announcement.find(announcementQuery).sort({ createdAt: -1 }).limit(perCatLimit).lean(),
        Group.find(groupQuery).sort({ memberCount: -1 }).limit(perCatLimit).lean(),
        DiscussionPost.find(discussionQuery)
          .sort({ createdAt: -1 })
          .limit(perCatLimit)
          .populate('author', 'name department')
          .lean(),
        CampusIssue.find(issueQuery).sort({ createdAt: -1 }).limit(perCatLimit).lean(),
      ]);

      const formattedEvents = events.map((e) => ({
        id: e._id,
        type: 'event',
        title: e.title,
        description: e.description,
        category: e.category,
        date: e.startDate,
        url: `/events/${e._id}`,
        imageUrl: e.posterUrl,
        extra: { venue: e.venue },
      }));

      const formattedAnnounce = announcements.map((a) => ({
        id: a._id,
        type: 'announcement',
        title: a.title,
        description: a.content,
        category: a.category,
        date: a.createdAt,
        url: `/announcements`,
        extra: { priority: a.priority },
      }));

      const formattedGroups = groups.map((g) => ({
        id: g._id,
        type: 'group',
        title: g.name,
        description: g.shortDescription || g.description,
        category: g.category,
        date: g.createdAt,
        url: `/groups/${g._id}`,
        imageUrl: g.bannerUrl,
        extra: { memberCount: g.memberCount },
      }));

      const formattedDiscussions = discussions.map((d) => ({
        id: d._id,
        type: 'discussion',
        title: d.title,
        description: d.content,
        category: d.category,
        date: d.createdAt,
        url: `/discussions/${d._id}`,
        extra: {
          postType: d.postType,
          upvoteCount: d.upvoteCount,
          commentCount: d.commentCount,
          authorName: d.author?.name,
        },
      }));

      const formattedIssues = issues.map((i) => ({
        id: i._id,
        type: 'issue',
        title: i.title,
        description: i.description,
        category: i.category,
        date: i.createdAt,
        url: `/issues/${i._id}`,
        extra: {
          referenceId: i.referenceId,
          status: i.status,
          priority: i.priority,
          supportCount: i.supportCount,
        },
      }));

      items = [
        ...formattedEvents,
        ...formattedAnnounce,
        ...formattedGroups,
        ...formattedDiscussions,
        ...formattedIssues,
      ];
    }

    const currentTotal = type === 'all' ? counts.all : counts[type] || 0;

    return res.status(200).json({
      success: true,
      query: trimmedQuery,
      activeType: type,
      counts,
      results: items,
      total: currentTotal,
      page: parseInt(page, 10),
      totalPages: Math.ceil(currentTotal / takeLimit) || 1,
    });
  } catch (error) {
    next(error);
  }
};
