import crypto from 'crypto';
import mongoose from 'mongoose';
import QRCode from 'qrcode';
import { Group } from '../models/Group.js';
import { GroupMembership } from '../models/GroupMembership.js';
import { GroupJoinRequest } from '../models/GroupJoinRequest.js';
import { GroupPost } from '../models/GroupPost.js';
import { GroupComment } from '../models/GroupComment.js';
import { GroupInvitation } from '../models/GroupInvitation.js';
import { GroupResource } from '../models/GroupResource.js';
import { GroupActivity } from '../models/GroupActivity.js';
import {
  GROUP_CATEGORIES,
  GROUP_ROLES,
  GROUP_VISIBILITY,
  JOIN_REQUEST_STATUS,
  ROLES,
  NOTIFICATION_TYPES,
} from '../utils/constants.js';
import { createNotification } from '../services/notificationService.js';

const getUserGroupRole = async (groupId, userId) => {
  if (!userId) return null;
  const membership = await GroupMembership.findOne({ group: groupId, user: userId });
  return membership ? membership.role : null;
};

export const getGroups = async (req, res, next) => {
  try {
    const { search, category, sort = 'popular', visibility } = req.query;

    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { shortDescription: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    if (category && category !== 'All') {
      if (GROUP_CATEGORIES.includes(category)) {
        query.category = category;
      }
    }

    if (visibility && Object.values(GROUP_VISIBILITY).includes(visibility)) {
      query.visibility = visibility;
    }

    let sortOption = { memberCount: -1 };
    if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'alphabetical') {
      sortOption = { name: 1 };
    }

    const groups = await Group.find(query)
      .populate('owner', 'name email avatarUrl department')
      .sort(sortOption)
      .lean();

    let userMembershipMap = new Map();
    let userPendingRequestSet = new Set();

    if (req.user) {
      const memberships = await GroupMembership.find({ user: req.user._id }).select('group role');
      memberships.forEach((m) => userMembershipMap.set(m.group.toString(), m.role));

      const pendingRequests = await GroupJoinRequest.find({
        user: req.user._id,
        status: JOIN_REQUEST_STATUS.PENDING,
      }).select('group');
      pendingRequests.forEach((r) => userPendingRequestSet.add(r.group.toString()));
    }

    const enhancedGroups = groups.map((g) => {
      const userRole = userMembershipMap.get(g._id.toString()) || null;
      const isMember = !!userRole;
      const hasPendingRequest = userPendingRequestSet.has(g._id.toString());

      let membershipStatus = 'none';
      if (userRole === GROUP_ROLES.OWNER) membershipStatus = 'owner';
      else if (userRole === GROUP_ROLES.MODERATOR) membershipStatus = 'moderator';
      else if (userRole === GROUP_ROLES.MEMBER) membershipStatus = 'member';
      else if (hasPendingRequest) membershipStatus = 'requested';

      return {
        ...g,
        membershipStatus,
        userRole,
        isMember,
        hasPendingRequest,
      };
    });

    return res.status(200).json({
      success: true,
      count: enhancedGroups.length,
      groups: enhancedGroups,
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await Group.findById(id).populate('owner', 'name email avatarUrl department');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group community not found' });
    }

    let userRole = null;
    let hasPendingRequest = false;

    if (req.user) {
      const membership = await GroupMembership.findOne({ group: id, user: req.user._id });
      userRole = membership ? membership.role : null;

      if (!userRole) {
        const pendingRequest = await GroupJoinRequest.findOne({
          group: id,
          user: req.user._id,
          status: JOIN_REQUEST_STATUS.PENDING,
        });
        hasPendingRequest = !!pendingRequest;
      }
    }

    const isMember = !!userRole;
    const isPlatformAdmin = req.user && req.user.role === ROLES.ADMIN;
    const isOwner = userRole === GROUP_ROLES.OWNER || (req.user && req.user._id.toString() === group.owner._id.toString());
    const isModerator = userRole === GROUP_ROLES.MODERATOR;
    const canManageGroup = isOwner || isModerator || isPlatformAdmin;

    const canAccessDiscussions = group.visibility === GROUP_VISIBILITY.PUBLIC || isMember || isPlatformAdmin;

    return res.status(200).json({
      success: true,
      group: {
        ...group.toJSON(),
        userRole,
        isMember,
        isOwner,
        isModerator,
        canManageGroup,
        hasPendingRequest,
        canAccessDiscussions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    const {
      name,
      shortDescription,
      description,
      category,
      tags,
      coverImage,
      visibility = GROUP_VISIBILITY.PUBLIC,
      rules,
    } = req.body;

    if (!name || !shortDescription || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, short description, detailed description, and category.',
      });
    }

    if (!GROUP_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${GROUP_CATEGORIES.join(', ')}`,
      });
    }

    if (!Object.values(GROUP_VISIBILITY).includes(visibility)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visibility setting. Must be public or private.',
      });
    }

    let processedTags = [];
    if (Array.isArray(tags)) {
      processedTags = tags.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      processedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    let processedRules = [];
    if (Array.isArray(rules)) {
      processedRules = rules.map((r) => String(r).trim()).filter(Boolean);
    } else if (typeof rules === 'string' && rules.trim()) {
      processedRules = rules.split('\n').map((r) => r.trim()).filter(Boolean);
    }

    const newGroup = await Group.create({
      name: name.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      category,
      tags: processedTags,
      coverImage: coverImage ? coverImage.trim() : '',
      visibility,
      rules: processedRules,
      owner: req.user._id,
      memberCount: 1, 
      postCount: 0,
    });

    await GroupMembership.create({
      group: newGroup._id,
      user: req.user._id,
      role: GROUP_ROLES.OWNER,
      joinedAt: new Date(),
    });

    const populatedGroup = await Group.findById(newGroup._id).populate('owner', 'name email avatarUrl department');

    return res.status(201).json({
      success: true,
      message: 'Campus community created successfully!',
      group: populatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const userRole = await getUserGroupRole(id, req.user._id);
    const isPlatformAdmin = req.user.role === ROLES.ADMIN;
    if (userRole !== GROUP_ROLES.OWNER && userRole !== GROUP_ROLES.MODERATOR && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: You must be an owner or moderator to edit this group.',
      });
    }

    const {
      name,
      shortDescription,
      description,
      category,
      tags,
      coverImage,
      visibility,
      rules,
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (shortDescription !== undefined) updates.shortDescription = shortDescription.trim();
    if (description !== undefined) updates.description = description.trim();
    if (coverImage !== undefined) updates.coverImage = coverImage.trim();

    if (category !== undefined) {
      if (!GROUP_CATEGORIES.includes(category)) {
        return res.status(400).json({ success: false, message: 'Invalid category' });
      }
      updates.category = category;
    }

    if (visibility !== undefined) {
      if (!Object.values(GROUP_VISIBILITY).includes(visibility)) {
        return res.status(400).json({ success: false, message: 'Invalid visibility' });
      }
      updates.visibility = visibility;
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        updates.tags = tags.map((t) => String(t).trim()).filter(Boolean);
      } else if (typeof tags === 'string') {
        updates.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    if (rules !== undefined) {
      if (Array.isArray(rules)) {
        updates.rules = rules.map((r) => String(r).trim()).filter(Boolean);
      } else if (typeof rules === 'string') {
        updates.rules = rules.split('\n').map((r) => r.trim()).filter(Boolean);
      }
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('owner', 'name email avatarUrl department');

    return res.status(200).json({
      success: true,
      message: 'Group updated successfully.',
      group: updatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const userRole = await getUserGroupRole(id, req.user._id);
    const isPlatformAdmin = req.user.role === ROLES.ADMIN;
    if (userRole !== GROUP_ROLES.OWNER && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only the group owner can delete this community.',
      });
    }

    await Promise.all([
      GroupMembership.deleteMany({ group: id }),
      GroupJoinRequest.deleteMany({ group: id }),
      GroupPost.deleteMany({ group: id }),
      GroupComment.deleteMany({ group: id }),
      Group.findByIdAndDelete(id),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Group community and all associated content deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const existingMembership = await GroupMembership.findOne({
      group: id,
      user: req.user._id,
    });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message: 'You are already a member of this community.',
        role: existingMembership.role,
      });
    }

    if (group.visibility === GROUP_VISIBILITY.PUBLIC) {
      const membership = await GroupMembership.create({
        group: id,
        user: req.user._id,
        role: GROUP_ROLES.MEMBER,
        joinedAt: new Date(),
      });

      const updatedGroup = await Group.findByIdAndUpdate(
        id,
        { $inc: { memberCount: 1 } },
        { new: true }
      );

      await GroupJoinRequest.deleteMany({ group: id, user: req.user._id });

      return res.status(201).json({
        success: true,
        message: `Welcome! You have successfully joined ${group.name}.`,
        status: 'joined',
        role: GROUP_ROLES.MEMBER,
        memberCount: updatedGroup.memberCount,
        membership,
      });
    }

    const existingRequest = await GroupJoinRequest.findOne({
      group: id,
      user: req.user._id,
      status: JOIN_REQUEST_STATUS.PENDING,
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a pending request to join this private community.',
      });
    }

    const request = await GroupJoinRequest.create({
      group: id,
      user: req.user._id,
      status: JOIN_REQUEST_STATUS.PENDING,
    });

    if (group.owner && group.owner.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: group.owner,
        actor: req.user._id,
        type: NOTIFICATION_TYPES.GROUP_JOIN_REQUEST,
        title: 'New Community Join Request',
        message: `${req.user.name} requested to join "${group.name}".`,
        entityType: 'group',
        entityId: group._id,
        actionUrl: `/groups/${group._id}`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Join request submitted! An administrator or moderator will review your request.',
      status: 'requested',
      request,
    });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const membership = await GroupMembership.findOne({ group: id, user: req.user._id });
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'You are not currently an active member of this group.',
      });
    }

    if (membership.role === GROUP_ROLES.OWNER) {
      const ownerCount = await GroupMembership.countDocuments({
        group: id,
        role: GROUP_ROLES.OWNER,
      });

      if (ownerCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot leave group as the sole owner. Please transfer ownership to another member or delete the group.',
        });
      }
    }

    await GroupMembership.findByIdAndDelete(membership._id);
    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      { $inc: { memberCount: -1 } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'You have left the group community.',
      memberCount: updatedGroup ? updatedGroup.memberCount : 0,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyGroups = async (req, res, next) => {
  try {
    const memberships = await GroupMembership.find({ user: req.user._id })
      .populate({
        path: 'group',
        populate: { path: 'owner', select: 'name email avatarUrl department' },
      })
      .sort({ joinedAt: -1 })
      .lean();

    const validMemberships = memberships
      .filter((m) => m.group !== null)
      .map((m) => ({
        membershipId: m._id,
        role: m.role,
        joinedAt: m.joinedAt,
        group: m.group,
      }));

    const pendingRequests = await GroupJoinRequest.find({
      user: req.user._id,
      status: JOIN_REQUEST_STATUS.PENDING,
    })
      .populate('group')
      .sort({ createdAt: -1 })
      .lean();

    const validRequests = pendingRequests
      .filter((r) => r.group !== null)
      .map((r) => ({
        requestId: r._id,
        status: r.status,
        createdAt: r.createdAt,
        group: r.group,
      }));

    return res.status(200).json({
      success: true,
      count: validMemberships.length,
      groups: validMemberships,
      pendingRequests: validRequests,
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupMembers = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.visibility === GROUP_VISIBILITY.PRIVATE) {
      const userRole = await getUserGroupRole(id, req.user?._id);
      const isPlatformAdmin = req.user?.role === ROLES.ADMIN;
      if (!userRole && !isPlatformAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: Only members can view the member roster of this private group.',
        });
      }
    }

    const memberships = await GroupMembership.find({ group: id })
      .populate('user', 'name email department academicYear avatarUrl')
      .sort({ joinedAt: 1 })
      .lean();

    const roleWeight = { owner: 1, moderator: 2, member: 3 };
    const sortedMembers = memberships
      .filter((m) => m.user !== null)
      .sort((a, b) => (roleWeight[a.role] || 9) - (roleWeight[b.role] || 9))
      .map((m) => ({
        membershipId: m._id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      }));

    return res.status(200).json({
      success: true,
      count: sortedMembers.length,
      members: sortedMembers,
    });
  } catch (error) {
    next(error);
  }
};

export const getJoinRequests = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const userRole = await getUserGroupRole(id, req.user._id);
    const isPlatformAdmin = req.user.role === ROLES.ADMIN;
    if (userRole !== GROUP_ROLES.OWNER && userRole !== GROUP_ROLES.MODERATOR && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only group owners and moderators can view join requests.',
      });
    }

    const requests = await GroupJoinRequest.find({
      group: id,
      status: JOIN_REQUEST_STATUS.PENDING,
    })
      .populate('user', 'name email department academicYear avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests: requests.filter((r) => r.user !== null),
    });
  } catch (error) {
    next(error);
  }
};

export const reviewJoinRequest = async (req, res, next) => {
  try {
    const { id, requestId } = req.params;
    const { status } = req.body; 

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'approved' or 'rejected'.",
      });
    }

    const userRole = await getUserGroupRole(id, req.user._id);
    const isPlatformAdmin = req.user.role === ROLES.ADMIN;
    if (userRole !== GROUP_ROLES.OWNER && userRole !== GROUP_ROLES.MODERATOR && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only group owners and moderators can review join requests.',
      });
    }

    const joinRequest = await GroupJoinRequest.findOne({ _id: requestId, group: id });
    if (!joinRequest) {
      return res.status(404).json({ success: false, message: 'Join request not found.' });
    }

    if (joinRequest.status !== JOIN_REQUEST_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `This join request has already been ${joinRequest.status}.`,
      });
    }

    joinRequest.status = status;
    joinRequest.reviewedBy = req.user._id;
    joinRequest.reviewedAt = new Date();
    await joinRequest.save();

    if (status === 'approved') {
      const existing = await GroupMembership.findOne({ group: id, user: joinRequest.user });
      if (!existing) {
        await GroupMembership.create({
          group: id,
          user: joinRequest.user,
          role: GROUP_ROLES.MEMBER,
          joinedAt: new Date(),
        });
        await Group.findByIdAndUpdate(id, { $inc: { memberCount: 1 } });
      }
    }

    const targetGroup = await Group.findById(id).select('name');
    await createNotification({
      recipient: joinRequest.user,
      actor: req.user._id,
      type: NOTIFICATION_TYPES.GROUP_JOIN_DECISION,
      title: `Community Join Request ${status.toUpperCase()}`,
      message: `Your request to join "${targetGroup ? targetGroup.name : 'the community'}" has been ${status}.`,
      entityType: 'group',
      entityId: id,
      actionUrl: `/groups/${id}`,
    });

    return res.status(200).json({
      success: true,
      message: `Join request ${status} successfully.`,
      request: joinRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body; 

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    if (![GROUP_ROLES.MODERATOR, GROUP_ROLES.MEMBER].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Target role must be 'moderator' or 'member'.",
      });
    }

    const callerRole = await getUserGroupRole(id, req.user._id);
    const isPlatformAdmin = req.user.role === ROLES.ADMIN;
    if (callerRole !== GROUP_ROLES.OWNER && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only the group owner can promote or demote roles.',
      });
    }

    const targetMembership = await GroupMembership.findOne({ group: id, user: userId });
    if (!targetMembership) {
      return res.status(404).json({ success: false, message: 'Member not found in this group.' });
    }

    if (targetMembership.role === GROUP_ROLES.OWNER) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify the owner role through this endpoint.',
      });
    }

    targetMembership.role = role;
    await targetMembership.save();

    return res.status(200).json({
      success: true,
      message: `Member role updated to ${role}.`,
      membership: targetMembership,
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const callerRole = await getUserGroupRole(id, req.user._id);
    const isPlatformAdmin = req.user.role === ROLES.ADMIN;

    if (callerRole !== GROUP_ROLES.OWNER && callerRole !== GROUP_ROLES.MODERATOR && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only owners and moderators can remove members.',
      });
    }

    const targetMembership = await GroupMembership.findOne({ group: id, user: userId });
    if (!targetMembership) {
      return res.status(404).json({ success: false, message: 'Member not found in this group.' });
    }

    if (targetMembership.role === GROUP_ROLES.OWNER) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the group owner.',
      });
    }

    if (callerRole === GROUP_ROLES.MODERATOR && targetMembership.role === GROUP_ROLES.MODERATOR) {
      return res.status(403).json({
        success: false,
        message: 'Moderators cannot remove other moderators.',
      });
    }

    await GroupMembership.findByIdAndDelete(targetMembership._id);
    await Group.findByIdAndUpdate(id, { $inc: { memberCount: -1 } });

    return res.status(200).json({
      success: true,
      message: 'Member removed from group successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupPosts = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.visibility === GROUP_VISIBILITY.PRIVATE) {
      const userRole = await getUserGroupRole(id, req.user?._id);
      const isPlatformAdmin = req.user?.role === ROLES.ADMIN;
      if (!userRole && !isPlatformAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: Only members can view discussions in this private community.',
        });
      }
    }

    const posts = await GroupPost.find({ group: id })
      .populate('author', 'name email avatarUrl department academicYear')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

export const createGroupPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, imageUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Post content cannot be empty.' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const userRole = await getUserGroupRole(id, req.user._id);
    const isPlatformAdmin = req.user.role === ROLES.ADMIN;
    if (!userRole && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You must join this community before participating in discussions.',
      });
    }

    const newPost = await GroupPost.create({
      group: id,
      author: req.user._id,
      title: title ? title.trim() : '',
      content: content.trim(),
      imageUrl: imageUrl ? imageUrl.trim() : '',
      commentCount: 0,
    });

    await Group.findByIdAndUpdate(id, { $inc: { postCount: 1 } });

    const populatedPost = await GroupPost.findById(newPost._id).populate(
      'author',
      'name email avatarUrl department academicYear'
    );

    return res.status(201).json({
      success: true,
      message: 'Post published successfully!',
      post: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGroupPost = async (req, res, next) => {
  try {
    const { id, postId } = req.params;
    const { title, content, imageUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const post = await GroupPost.findOne({ _id: postId, group: id });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: You can only edit your own posts.',
      });
    }

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content.trim();
    if (imageUrl !== undefined) updates.imageUrl = imageUrl.trim();

    const updated = await GroupPost.findByIdAndUpdate(
      postId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('author', 'name email avatarUrl department academicYear');

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully.',
      post: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGroupPost = async (req, res, next) => {
  try {
    const { id, postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const post = await GroupPost.findOne({ _id: postId, group: id });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const userRole = await getUserGroupRole(id, req.user._id);
    const isPlatformAdmin = req.user.role === ROLES.ADMIN;
    const isAuthor = post.author.toString() === req.user._id.toString();
    const canModerate = userRole === GROUP_ROLES.OWNER || userRole === GROUP_ROLES.MODERATOR;

    if (!isAuthor && !canModerate && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: You are not authorized to delete this post.',
      });
    }

    await GroupComment.deleteMany({ post: postId });
    await GroupPost.findByIdAndDelete(postId);
    await Group.findByIdAndUpdate(id, { $inc: { postCount: -1 } });

    return res.status(200).json({
      success: true,
      message: 'Post and associated comments deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getPostComments = async (req, res, next) => {
  try {
    const { id, postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    if (group.visibility === GROUP_VISIBILITY.PRIVATE) {
      const userRole = await getUserGroupRole(id, req.user?._id);
      const isPlatformAdmin = req.user?.role === ROLES.ADMIN;
      if (!userRole && !isPlatformAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: Only members can view comments in this private group.',
        });
      }
    }

    const comments = await GroupComment.find({ post: postId, group: id })
      .populate('author', 'name email avatarUrl department academicYear')
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

export const createPostComment = async (req, res, next) => {
  try {
    const { id, postId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    }

    const post = await GroupPost.findOne({ _id: postId, group: id });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const userRole = await getUserGroupRole(id, req.user._id);
    const isPlatformAdmin = req.user.role === ROLES.ADMIN;
    if (!userRole && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You must join this community before adding comments.',
      });
    }

    const comment = await GroupComment.create({
      post: postId,
      group: id,
      author: req.user._id,
      content: content.trim(),
    });

    await GroupPost.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    const populatedComment = await GroupComment.findById(comment._id).populate(
      'author',
      'name email avatarUrl department academicYear'
    );

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      comment: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePostComment = async (req, res, next) => {
  try {
    const { id, postId, commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    }

    const comment = await GroupComment.findOne({ _id: commentId, post: postId, group: id });
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: You can only edit your own comments.',
      });
    }

    comment.content = content.trim();
    await comment.save();

    const populated = await GroupComment.findById(comment._id).populate(
      'author',
      'name email avatarUrl department academicYear'
    );

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully.',
      comment: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePostComment = async (req, res, next) => {
  try {
    const { id, postId, commentId } = req.params;

    const comment = await GroupComment.findOne({ _id: commentId, post: postId, group: id });
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    const userRole = await getUserGroupRole(id, req.user._id);
    const isPlatformAdmin = req.user.role === ROLES.ADMIN;
    const isAuthor = comment.author.toString() === req.user._id.toString();
    const canModerate = userRole === GROUP_ROLES.OWNER || userRole === GROUP_ROLES.MODERATOR;

    if (!isAuthor && !canModerate && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: You are not authorized to delete this comment.',
      });
    }

    await GroupComment.findByIdAndDelete(commentId);
    await GroupPost.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } });

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const generateGroupInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { expiryDays = 7, maxUses = null } = req.body;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const userRole = await getUserGroupRole(id, req.user._id);
    const canManage = userRole === GROUP_ROLES.OWNER || userRole === GROUP_ROLES.MODERATOR || req.user.role === ROLES.ADMIN || req.user.role === ROLES.MAIN_ADMIN;

    if (!canManage) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only group owners or moderators can create invitation links.',
      });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + parseInt(expiryDays, 10) * 24 * 60 * 60 * 1000);

    const invitation = await GroupInvitation.create({
      group: id,
      token,
      createdBy: req.user._id,
      expiresAt,
      maxUses: maxUses ? parseInt(maxUses, 10) : null,
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteUrl = `${clientUrl}/groups/join/qr/${token}`;

    const qrCodeDataUrl = await QRCode.toDataURL(inviteUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0b1728',
        light: '#ffffff',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'QR Invitation generated successfully.',
      qrCodeDataUrl,
      inviteUrl,
      invitation: {
        id: invitation._id,
        token: invitation.token,
        inviteUrl,
        qrCodeDataUrl,
        expiresAt: invitation.expiresAt,
        maxUses: invitation.maxUses,
        useCount: invitation.useCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupInvitations = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invitation = await GroupInvitation.findOne({
      group: id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!invitation) {
      return res.status(200).json({ success: true, invitation: null });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteUrl = `${clientUrl}/groups/join/qr/${invitation.token}`;
    const qrCodeDataUrl = await QRCode.toDataURL(inviteUrl, {
      width: 320,
      margin: 2,
      color: { dark: '#0b1728', light: '#ffffff' },
    });

    return res.status(200).json({
      success: true,
      invitation: {
        id: invitation._id,
        token: invitation.token,
        inviteUrl,
        qrCodeDataUrl,
        expiresAt: invitation.expiresAt,
        maxUses: invitation.maxUses,
        useCount: invitation.useCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const revokeGroupInvitation = async (req, res, next) => {
  try {
    const { id, inviteId } = req.params;

    const userRole = await getUserGroupRole(id, req.user._id);
    const canManage = userRole === GROUP_ROLES.OWNER || userRole === GROUP_ROLES.MODERATOR || req.user.role === ROLES.ADMIN || req.user.role === ROLES.MAIN_ADMIN;

    if (!canManage) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    const invitation = await GroupInvitation.findOneAndUpdate(
      { _id: inviteId, group: id },
      { revokedAt: new Date() },
      { new: true }
    );

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Invitation successfully revoked.',
    });
  } catch (error) {
    next(error);
  }
};

export const inspectQrInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await GroupInvitation.findOne({ token }).populate('group');
    if (!invitation || !invitation.isValid()) {
      return res.status(404).json({
        success: false,
        message: 'This invitation link has expired, been revoked, or is invalid.',
      });
    }

    const group = invitation.group;
    let isMember = false;
    let hasPendingRequest = false;

    if (req.user) {
      const existing = await GroupMembership.findOne({ group: group._id, user: req.user._id });
      isMember = !!existing;

      const pending = await GroupJoinRequest.findOne({
        group: group._id,
        user: req.user._id,
        status: JOIN_REQUEST_STATUS.PENDING,
      });
      hasPendingRequest = !!pending;
    }

    return res.status(200).json({
      success: true,
      group: {
        _id: group._id,
        name: group.name,
        shortDescription: group.shortDescription,
        category: group.category,
        visibility: group.visibility,
        memberCount: group.memberCount,
        coverImage: group.coverImage,
      },
      invitation: {
        token: invitation.token,
        expiresAt: invitation.expiresAt,
      },
      isMember,
      hasPendingRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const joinViaQrInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await GroupInvitation.findOne({ token }).populate('group');
    if (!invitation || !invitation.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'This invitation link is invalid, expired, or has reached its usage limit.',
      });
    }

    const group = invitation.group;

    const existing = await GroupMembership.findOne({ group: group._id, user: req.user._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You are already a member of this community.',
      });
    }

    const isDirectJoin = group.visibility === GROUP_VISIBILITY.PUBLIC && !group.membershipApprovalRequired;

    if (isDirectJoin) {
      await GroupMembership.create({
        group: group._id,
        user: req.user._id,
        role: GROUP_ROLES.MEMBER,
      });

      await Group.findByIdAndUpdate(group._id, { $inc: { memberCount: 1 } });
      invitation.useCount += 1;
      await invitation.save();

      return res.status(201).json({
        success: true,
        joined: true,
        message: `Welcome to ${group.name}! You are now an official member.`,
        groupId: group._id,
      });
    } else {
      const existingRequest = await GroupJoinRequest.findOne({
        group: group._id,
        user: req.user._id,
        status: JOIN_REQUEST_STATUS.PENDING,
      });

      if (existingRequest) {
        return res.status(409).json({
          success: false,
          message: 'You already have a pending membership request for this group.',
        });
      }

      await GroupJoinRequest.create({
        group: group._id,
        user: req.user._id,
        message: 'Joined via invitation QR code.',
        status: JOIN_REQUEST_STATUS.PENDING,
      });

      invitation.useCount += 1;
      await invitation.save();

      await createNotification({
        recipient: group.owner,
        actor: req.user._id,
        type: NOTIFICATION_TYPES.GROUP_JOIN_REQUEST,
        title: 'New Member Request via QR Code',
        message: `${req.user.name} scanned your QR code and requested to join "${group.name}".`,
        entityType: 'group',
        entityId: group._id,
        actionUrl: `/groups/${group._id}`,
      });

      return res.status(200).json({
        success: true,
        joined: false,
        pendingApproval: true,
        message: 'Membership request submitted! The group owner has been notified.',
        groupId: group._id,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getGroupResources = async (req, res, next) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    if (group.visibility === GROUP_VISIBILITY.PRIVATE) {
      const userRole = await getUserGroupRole(id, req.user?._id);
      const isPlatformAdmin = req.user?.role === ROLES.ADMIN || req.user?.role === ROLES.MAIN_ADMIN;

      if (!userRole && !isPlatformAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: Only verified community members can view resources of private groups.',
        });
      }
    }

    const resources = await GroupResource.find({ group: id })
      .populate('uploadedBy', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, resources });
  } catch (error) {
    next(error);
  }
};

export const createGroupResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description = '', fileUrl, fileType = 'document', fileSize = '' } = req.body;

    if (!title || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Resource title and file URL/link are required.',
      });
    }

    const userRole = await getUserGroupRole(id, req.user._id);
    const isPlatformAdmin = req.user.role === ROLES.ADMIN || req.user.role === ROLES.MAIN_ADMIN;

    if (!userRole && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this community to upload study resources.',
      });
    }

    const resource = await GroupResource.create({
      group: id,
      title: title.trim(),
      description: description.trim(),
      fileUrl: fileUrl.trim(),
      fileType,
      fileSize,
      uploadedBy: req.user._id,
    });

    await resource.populate('uploadedBy', 'name email avatarUrl');

    return res.status(201).json({
      success: true,
      message: 'Study note / resource shared successfully.',
      resource,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGroupResource = async (req, res, next) => {
  try {
    const { id, resourceId } = req.params;

    const resource = await GroupResource.findOne({ _id: resourceId, group: id });
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const userRole = await getUserGroupRole(id, req.user._id);
    const isUploader = resource.uploadedBy.toString() === req.user._id.toString();
    const canManage = userRole === GROUP_ROLES.OWNER || userRole === GROUP_ROLES.MODERATOR;
    const isPlatformAdmin = req.user.role === ROLES.ADMIN || req.user.role === ROLES.MAIN_ADMIN;

    if (!isUploader && !canManage && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: You are not authorized to delete this resource.',
      });
    }

    await GroupResource.findByIdAndDelete(resourceId);

    return res.status(200).json({
      success: true,
      message: 'Resource deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupActivities = async (req, res, next) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    if (group.visibility === GROUP_VISIBILITY.PRIVATE) {
      const userRole = await getUserGroupRole(id, req.user?._id);
      const isPlatformAdmin = req.user?.role === ROLES.ADMIN || req.user?.role === ROLES.MAIN_ADMIN;

      if (!userRole && !isPlatformAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: Only community members can view activities of private groups.',
        });
      }
    }

    const activities = await GroupActivity.find({ group: id })
      .populate('createdBy', 'name email avatarUrl')
      .sort({ startDate: 1 });

    return res.status(200).json({ success: true, activities });
  } catch (error) {
    next(error);
  }
};

export const createGroupActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description = '',
      startDate,
      endDate,
      location = 'Campus Location',
      meetingLink = '',
      isOnline = false,
    } = req.body;

    const effectiveStart = req.body.startDate || req.body.startTime;
    const effectiveEnd =
      req.body.endDate ||
      req.body.endTime ||
      (effectiveStart ? new Date(new Date(effectiveStart).getTime() + 60 * 60 * 1000) : null);

    if (!title || !effectiveStart) {
      return res.status(400).json({
        success: false,
        message: 'Title and scheduled time are required.',
      });
    }

    const userRole = await getUserGroupRole(id, req.user._id);
    const canManage = userRole === GROUP_ROLES.OWNER || userRole === GROUP_ROLES.MODERATOR || req.user.role === ROLES.ADMIN || req.user.role === ROLES.MAIN_ADMIN;

    if (!canManage) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only group owners or moderators can schedule activities.',
      });
    }

    const activity = await GroupActivity.create({
      group: id,
      title: title.trim(),
      description: description.trim(),
      startDate: new Date(effectiveStart),
      endDate: new Date(effectiveEnd),
      location: location.trim(),
      meetingLink: meetingLink.trim(),
      isOnline: Boolean(isOnline),
      createdBy: req.user._id,
    });

    await activity.populate('createdBy', 'name email avatarUrl');

    return res.status(201).json({
      success: true,
      message: 'Group activity scheduled successfully.',
      activity,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGroupActivity = async (req, res, next) => {
  try {
    const { id, activityId } = req.params;
    const { title, description, startDate, endDate, location, meetingLink, isOnline, isCancelled } = req.body;

    const activity = await GroupActivity.findOne({ _id: activityId, group: id });
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found.' });
    }

    const userRole = await getUserGroupRole(id, req.user._id);
    const canManage = userRole === GROUP_ROLES.OWNER || userRole === GROUP_ROLES.MODERATOR || req.user.role === ROLES.ADMIN || req.user.role === ROLES.MAIN_ADMIN;

    if (!canManage) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    if (title) activity.title = title.trim();
    if (description !== undefined) activity.description = description.trim();
    if (startDate) activity.startDate = new Date(startDate);
    if (endDate) activity.endDate = new Date(endDate);
    if (location !== undefined) activity.location = location.trim();
    if (meetingLink !== undefined) activity.meetingLink = meetingLink.trim();
    if (isOnline !== undefined) activity.isOnline = Boolean(isOnline);
    if (isCancelled !== undefined) activity.isCancelled = Boolean(isCancelled);

    await activity.save();

    return res.status(200).json({
      success: true,
      message: 'Activity updated successfully.',
      activity,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGroupActivity = async (req, res, next) => {
  try {
    const { id, activityId } = req.params;

    const activity = await GroupActivity.findOne({ _id: activityId, group: id });
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found.' });
    }

    const userRole = await getUserGroupRole(id, req.user._id);
    const canManage = userRole === GROUP_ROLES.OWNER || userRole === GROUP_ROLES.MODERATOR || req.user.role === ROLES.ADMIN || req.user.role === ROLES.MAIN_ADMIN;

    if (!canManage) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    await GroupActivity.findByIdAndDelete(activityId);

    return res.status(200).json({
      success: true,
      message: 'Activity deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const transferGroupOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newOwnerId } = req.body;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    if (group.owner.toString() !== req.user._id.toString() && req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.MAIN_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only the current group owner can transfer ownership of this community.',
      });
    }

    if (group.owner.toString() === newOwnerId) {
      return res.status(400).json({
        success: false,
        message: 'Selected user is already the group owner.',
      });
    }

    const newOwnerMembership = await GroupMembership.findOne({ group: id, user: newOwnerId });
    if (!newOwnerMembership) {
      return res.status(400).json({
        success: false,
        message: 'New owner must be an existing member of this community.',
      });
    }

    const previousOwnerId = group.owner;
    group.owner = newOwnerId;
    await group.save();

    newOwnerMembership.role = GROUP_ROLES.OWNER;
    await newOwnerMembership.save();

    await GroupMembership.findOneAndUpdate(
      { group: id, user: previousOwnerId },
      { role: GROUP_ROLES.MODERATOR }
    );

    return res.status(200).json({
      success: true,
      message: 'Group ownership transferred successfully.',
      group,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGroupEmailPreference = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { emailPreference } = req.body;

    if (!['all', 'announcements_only', 'digest', 'muted'].includes(emailPreference)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email preference. Must be all, announcements_only, digest, or muted.',
      });
    }

    const membership = await GroupMembership.findOne({ group: id, user: req.user._id });
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'You are not a member of this community.',
      });
    }

    membership.emailPreference = emailPreference;
    await membership.save();

    return res.status(200).json({
      success: true,
      message: `Group email preference set to "${emailPreference}".`,
      emailPreference,
      membership,
    });
  } catch (error) {
    next(error);
  }
};
