import mongoose from 'mongoose';
import { Group } from '../models/Group.js';
import { GroupMembership } from '../models/GroupMembership.js';
import { GroupJoinRequest } from '../models/GroupJoinRequest.js';
import { GroupPost } from '../models/GroupPost.js';
import { GroupComment } from '../models/GroupComment.js';
import {
  GROUP_CATEGORIES,
  GROUP_ROLES,
  GROUP_VISIBILITY,
  JOIN_REQUEST_STATUS,
  ROLES,
} from '../utils/constants.js';

// Helper: Check a user's membership and permissions in a group
const getUserGroupRole = async (groupId, userId) => {
  if (!userId) return null;
  const membership = await GroupMembership.findOne({ group: groupId, user: userId });
  return membership ? membership.role : null;
};

/**
 * Get all groups with search, category filtering, and sorting
 * GET /api/groups
 */
export const getGroups = async (req, res, next) => {
  try {
    const { search, category, sort = 'popular', visibility } = req.query;

    const query = {};

    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { shortDescription: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      if (GROUP_CATEGORIES.includes(category)) {
        query.category = category;
      }
    }

    // Visibility filter
    if (visibility && Object.values(GROUP_VISIBILITY).includes(visibility)) {
      query.visibility = visibility;
    }

    // Sorting
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

    // If user is authenticated, determine their membership & request status for each group
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

/**
 * Get single group details by ID
 * GET /api/groups/:id
 */
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

    // Content access: public group can be viewed by anyone; private group content restricted to members and admins
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

/**
 * Create a new group (Authenticated student)
 * POST /api/groups
 */
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

    // Process tags
    let processedTags = [];
    if (Array.isArray(tags)) {
      processedTags = tags.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      processedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    // Process rules
    let processedRules = [];
    if (Array.isArray(rules)) {
      processedRules = rules.map((r) => String(r).trim()).filter(Boolean);
    } else if (typeof rules === 'string' && rules.trim()) {
      processedRules = rules.split('\n').map((r) => r.trim()).filter(Boolean);
    }

    // Create group with authenticated user as owner
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
      memberCount: 1, // Starts with owner as member
      postCount: 0,
    });

    // Create initial owner membership
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

/**
 * Update group details (Owner or Moderator)
 * PATCH /api/groups/:id
 */
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

    // Check permissions
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

/**
 * Delete a group and cascade cleanup (Owner or Platform Admin)
 * DELETE /api/groups/:id
 */
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

    // Cascade delete associated memberships, join requests, posts, and comments
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

/**
 * Join a public group or request to join a private group
 * POST /api/groups/:id/join
 */
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

    // Check existing membership
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

    // Public group: join immediately
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

      // Clean up any historical join request
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

    // Private group: create or check join request
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

/**
 * Leave a group (Authenticated member)
 * DELETE /api/groups/:id/membership
 */
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

    // Owner protection rule: if user is the sole owner, prevent leaving without transfer/delete
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

/**
 * Get all groups for the authenticated user (My Groups)
 * GET /api/groups/my
 */
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

    // Also get pending join requests submitted by this student
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

/**
 * Get group members list
 * GET /api/groups/:id/members
 */
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

    // Access check: for private group, requester must be member or platform admin
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

    // Order: owner first, then moderators, then members
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

/**
 * Get pending join requests for a private group (Owner/Moderator only)
 * GET /api/groups/:id/join-requests
 */
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

/**
 * Approve or reject a join request (Owner/Moderator only)
 * PATCH /api/groups/:id/join-requests/:requestId
 */
export const reviewJoinRequest = async (req, res, next) => {
  try {
    const { id, requestId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

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
      // Check if user is already a member somehow
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

    return res.status(200).json({
      success: true,
      message: `Join request ${status} successfully.`,
      request: joinRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Promote or demote a group member's role (Owner only)
 * PATCH /api/groups/:id/members/:userId/role
 */
export const updateMemberRole = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body; // 'moderator' or 'member'

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

/**
 * Remove an ordinary member from group (Owner or Moderator)
 * DELETE /api/groups/:id/members/:userId
 */
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

    // Owner cannot be removed
    if (targetMembership.role === GROUP_ROLES.OWNER) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the group owner.',
      });
    }

    // Moderators cannot remove other moderators or owners (only owners or platform admin can remove moderators)
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

// ==========================================
// GROUP POSTS & DISCUSSIONS
// ==========================================

/**
 * Get posts for a group
 * GET /api/groups/:id/posts
 */
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

    // If private group, only members or platform admin can view posts
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

/**
 * Create a new post in a group (Members only)
 * POST /api/groups/:id/posts
 */
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

    // Must be a member to publish posts in any group
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

/**
 * Update a group post (Author only)
 * PATCH /api/groups/:id/posts/:postId
 */
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

/**
 * Delete a group post (Author, Owner, Moderator, or Platform Admin)
 * DELETE /api/groups/:id/posts/:postId
 */
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

    // Cascade delete comments for this post
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

// ==========================================
// COMMENTS ON GROUP POSTS
// ==========================================

/**
 * Get comments for a post
 * GET /api/groups/:id/posts/:postId/comments
 */
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

/**
 * Add a comment to a group post (Members only)
 * POST /api/groups/:id/posts/:postId/comments
 */
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

    // Must be member to comment
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

/**
 * Update a comment (Author only)
 * PATCH /api/groups/:id/posts/:postId/comments/:commentId
 */
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

/**
 * Delete a comment (Author, Owner, Moderator, or Platform Admin)
 * DELETE /api/groups/:id/posts/:postId/comments/:commentId
 */
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
