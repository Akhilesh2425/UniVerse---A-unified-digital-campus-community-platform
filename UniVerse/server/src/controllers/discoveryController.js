import { Event } from '../models/Event.js';
import { Announcement } from '../models/Announcement.js';
import { Group } from '../models/Group.js';
import { DiscussionPost } from '../models/DiscussionPost.js';
import { CampusIssue } from '../models/CampusIssue.js';

export const getCampusDiscovery = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      upcomingEvents,
      latestAnnouncements,
      popularGroups,
      trendingDiscussions,
      supportedIssues,
    ] = await Promise.all([
      Event.find({ startDate: { $gte: now } })
        .sort({ startDate: 1 })
        .limit(6)
        .select('title description category venue startDate endDate posterUrl registeredCount maxParticipants')
        .lean(),

      Announcement.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title content category priority createdAt')
        .lean(),

      Group.find({ visibility: 'public' })
        .sort({ memberCount: -1, createdAt: -1 })
        .limit(6)
        .select('name shortDescription description category bannerUrl memberCount visibility')
        .lean(),

      DiscussionPost.find({ status: { $ne: 'hidden' } })
        .sort({ upvoteCount: -1, commentCount: -1, createdAt: -1 })
        .limit(6)
        .populate('author', 'name department avatarUrl')
        .select('title content category postType upvoteCount commentCount status createdAt author tags')
        .lean(),

      CampusIssue.find({ visibility: 'public' })
        .sort({ supportCount: -1, createdAt: -1 })
        .limit(6)
        .select('referenceId title description category priority status location supportCount commentCount createdAt')
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      discovery: {
        upcomingEvents,
        latestAnnouncements,
        popularGroups,
        trendingDiscussions,
        supportedIssues,
      },
    });
  } catch (error) {
    next(error);
  }
};
