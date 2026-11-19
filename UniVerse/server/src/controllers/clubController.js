import mongoose from 'mongoose';
import { CollegeClub } from '../models/CollegeClub.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { ClubProposal } from '../models/ClubProposal.js';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import {
  ROLES,
  CLUB_CATEGORIES,
  CLUB_STATUS,
  CLUB_POSITIONS,
  CLUB_PROPOSAL_STATUS,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
} from '../utils/constants.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { sendNewClubEmail } from '../services/emailService.js';

export const getClubs = async (req, res, next) => {
  try {
    const { search, category, sort = 'members' } = req.query;

    const query = { status: CLUB_STATUS.ACTIVE };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { description: regex }, { objectives: regex }];
    }

    if (category && category !== 'All' && CLUB_CATEGORIES.includes(category)) {
      query.category = category;
    }

    let sortOption = { memberCount: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'name') sortOption = { name: 1 };
    else if (sort === 'events') sortOption = { eventCount: -1 };

    const clubs = await CollegeClub.find(query)
      .populate('leadership.secretaryGeneral', 'name email avatarUrl department')
      .populate('facultyAdvisor.user', 'name email avatarUrl department')
      .sort(sortOption)
      .lean();

    if (req.user) {
      const userMemberships = await ClubMembership.find({ user: req.user._id });
      const membershipMap = new Map();
      userMemberships.forEach((m) => membershipMap.set(m.club.toString(), m));

      clubs.forEach((club) => {
        const mem = membershipMap.get(club._id.toString());
        club.isMember = !!mem;
        club.userPosition = mem ? mem.position : null;
      });
    }

    return res.status(200).json({ success: true, clubs });
  } catch (error) {
    next(error);
  }
};

export const getClubById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid club ID format.' });
    }

    const club = await CollegeClub.findById(id)
      .populate('leadership.secretaryGeneral', 'name email avatarUrl department')
      .populate('leadership.generalSecretary', 'name email avatarUrl department')
      .populate('leadership.jointSecretary', 'name email avatarUrl department')
      .populate('leadership.executiveMembers', 'name email avatarUrl department')
      .populate('leadership.coordinators', 'name email avatarUrl department')
      .populate('facultyAdvisor.user', 'name email avatarUrl department')
      .lean();

    if (!club) {
      return res.status(404).json({ success: false, message: 'College club not found.' });
    }

    let isMember = false;
    let userPosition = null;
    let canManageClub = false;

    if (req.user) {
      const isPlatformAdmin = req.user.role === ROLES.ADMIN || req.user.role === ROLES.MAIN_ADMIN;
      const membership = await ClubMembership.findOne({ club: id, user: req.user._id });

      if (membership) {
        isMember = true;
        userPosition = membership.position;
      }

      const isSecGen = club.leadership?.secretaryGeneral?._id?.toString() === req.user._id.toString();
      const isAdvisor = club.facultyAdvisor?.user?._id?.toString() === req.user._id.toString();

      canManageClub = isPlatformAdmin || isSecGen || isAdvisor;
    }

    return res.status(200).json({
      success: true,
      club: {
        ...club,
        isMember,
        userPosition,
        canManageClub,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitClubProposal = async (req, res, next) => {
  try {
    const {
      name,
      category,
      description,
      objectives,
      proposedFacultyAdvisor,
      proposedLeadership,
      proposedActivities = '',
      rules = [],
      contactEmail = '',
      logo = '',
      coverImage = '',
    } = req.body;

    const clubObjectives = objectives || req.body.tagline || description;
    const advisor = proposedFacultyAdvisor || req.body.facultyAdvisor;

    let leadership = proposedLeadership;
    if (!leadership && req.body.initialLeadership) {
      const secGen = Array.isArray(req.body.initialLeadership)
        ? req.body.initialLeadership.find(
            (l) =>
              l.role?.toLowerCase().includes('president') ||
              l.role?.toLowerCase().includes('secretary')
          )
        : null;
      leadership = {
        secretaryGeneralName: secGen?.name || req.user?.name || 'Student Head',
        secretaryGeneralEmail: secGen?.email || req.user?.email || 'head@universe.edu',
      };
    }
    if (!leadership) {
      leadership = {
        secretaryGeneralName: req.user?.name || 'Student Head',
        secretaryGeneralEmail: req.user?.email || 'head@universe.edu',
      };
    }

    if (!name || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Club name, category, and description are required.',
      });
    }

    if (!advisor || !advisor.name || !advisor.email) {
      return res.status(400).json({
        success: false,
        message: 'A proposed faculty advisor with name and email is required for official college clubs.',
      });
    }

    if (!leadership || !leadership.secretaryGeneralName) {
      return res.status(400).json({
        success: false,
        message: 'A proposed Secretary General (student head) nominee is required.',
      });
    }

    const existingClub = await CollegeClub.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (existingClub) {
      return res.status(409).json({
        success: false,
        message: 'An official college club with this name already exists.',
      });
    }

    const proposal = await ClubProposal.create({
      name: name.trim(),
      category,
      description: description.trim(),
      objectives: clubObjectives.trim(),
      proposedFacultyAdvisor: advisor,
      proposedLeadership: leadership,
      proposedActivities: typeof proposedActivities === 'string' ? proposedActivities.trim() : JSON.stringify(proposedActivities),
      rules: Array.isArray(rules) ? rules : [],
      contactEmail: contactEmail.trim(),
      logo: logo.trim(),
      coverImage: coverImage.trim(),
      submittedBy: req.user._id,
      status: CLUB_PROPOSAL_STATUS.PENDING,
    });

    const mainAdmins = await User.find({ role: { $in: [ROLES.MAIN_ADMIN, ROLES.ADMIN] } });
    for (const admin of mainAdmins) {
      await createNotification({
        recipient: admin._id,
        actor: req.user._id,
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'New College Club Proposal',
        message: `Student ${req.user.name} submitted a proposal to charter "${name}".`,
        entityType: 'ClubProposal',
        entityId: proposal._id,
        actionUrl: '/admin',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Official club proposal submitted successfully. Pending Main College Admin review.',
      proposal,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyClubProposals = async (req, res, next) => {
  try {
    const proposals = await ClubProposal.find({ submittedBy: req.user._id })
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, proposals });
  } catch (error) {
    next(error);
  }
};

export const getAllClubProposals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && Object.values(CLUB_PROPOSAL_STATUS).includes(status)) {
      query.status = status;
    }

    const proposals = await ClubProposal.find(query)
      .populate('submittedBy', 'name email department academicYear avatarUrl')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, proposals });
  } catch (error) {
    next(error);
  }
};

export const reviewClubProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const { status, action, reviewReason = '', reviewNotes = '', facultyAdvisorUserId = null } = req.body;
    const effectiveStatus = (status || (action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action) || '').toLowerCase();
    const reason = reviewReason || reviewNotes;

    if (!['approved', 'rejected'].includes(effectiveStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "rejected".',
      });
    }

    const proposal = await ClubProposal.findById(proposalId).populate('submittedBy');
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found.' });
    }

    if (proposal.status !== CLUB_PROPOSAL_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Proposal has already been reviewed (${proposal.status}).`,
      });
    }

    proposal.status = effectiveStatus;
    proposal.reviewReason = reason;
    proposal.reviewNotes = reason;
    proposal.reviewedBy = req.user._id;
    proposal.reviewReason = reviewReason.trim();
    proposal.reviewedAt = new Date();
    await proposal.save();

    let createdClub = null;

    if (effectiveStatus === 'approved') {
      createdClub = await CollegeClub.create({
        name: proposal.name,
        category: proposal.category,
        description: proposal.description,
        objectives: proposal.objectives,
        logo: proposal.logo,
        coverImage: proposal.coverImage,
        rules: proposal.rules,
        contactEmail: proposal.contactEmail,
        facultyAdvisor: {
          user: facultyAdvisorUserId || null,
          name: proposal.proposedFacultyAdvisor.name,
          email: proposal.proposedFacultyAdvisor.email,
          department: proposal.proposedFacultyAdvisor.department,
          designation: proposal.proposedFacultyAdvisor.designation,
          confirmed: true,
        },
        leadership: {
          secretaryGeneral: proposal.submittedBy._id, 
          generalSecretary: null,
          jointSecretary: null,
          executiveMembers: [],
          coordinators: [],
          committeeMembers: [],
        },
        status: CLUB_STATUS.ACTIVE,
        createdBy: proposal.submittedBy._id,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        proposalId: proposal._id,
        memberCount: 1,
      });

      await ClubMembership.create({
        club: createdClub._id,
        user: proposal.submittedBy._id,
        position: CLUB_POSITIONS.SECRETARY_GENERAL,
        role: 'leader',
        status: 'active',
      });

      await logAudit({
        req,
        actorId: req.user._id,
        action: AUDIT_ACTIONS.CLUB_PROPOSAL_APPROVE,
        targetType: 'CollegeClub',
        targetId: createdClub._id,
        description: `Main Admin approved official college club "${createdClub.name}" (${createdClub.category}). Faculty Advisor: ${createdClub.facultyAdvisor.name}.`,
        metadata: { proposalId, clubId: createdClub._id, category: createdClub.category },
      });

      await createNotification({
        recipient: proposal.submittedBy._id,
        actor: req.user._id,
        type: NOTIFICATION_TYPES.CLUB_PROPOSAL_DECISION,
        title: 'Club Charter Approved! 🎉',
        message: `Congratulations! Your proposal for "${createdClub.name}" has been officially approved by the Main College Administration.`,
        entityType: 'CollegeClub',
        entityId: createdClub._id,
        actionUrl: `/clubs/${createdClub._id}`,
      });

      try {
        const optedInPrefs = await NotificationPreference.find({ emailNewClubs: true }).select('user');
        const userIds = optedInPrefs.map((p) => p.user);
        const recipients = await User.find({ _id: { $in: userIds }, status: 'active' }).select('email');

        for (const recipient of recipients) {
          sendNewClubEmail({
            to: recipient.email,
            recipientId: recipient._id,
            clubName: createdClub.name,
            category: createdClub.category,
            description: createdClub.description,
            advisorName: createdClub.facultyAdvisor.name,
            clubId: createdClub._id,
          }).catch(() => {});
        }
      } catch (err) {
        console.error('New club email broadcast error:', err.message);
      }
    } else {
      await logAudit({
        req,
        actorId: req.user._id,
        action: AUDIT_ACTIONS.CLUB_PROPOSAL_REJECT,
        targetType: 'ClubProposal',
        targetId: proposal._id,
        description: `Main Admin rejected club proposal "${proposal.name}". Reason: ${reviewReason || 'N/A'}.`,
        metadata: { proposalId, reason: reviewReason },
      });

      await createNotification({
        recipient: proposal.submittedBy._id,
        actor: req.user._id,
        type: NOTIFICATION_TYPES.CLUB_PROPOSAL_DECISION,
        title: 'Club Proposal Decision',
        message: `Your club proposal for "${proposal.name}" was not approved. ${reviewReason ? `Reason: ${reviewReason}` : ''}`,
        entityType: 'ClubProposal',
        entityId: proposal._id,
        actionUrl: '/clubs',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Club proposal has been ${effectiveStatus}.`,
      proposal,
      club: createdClub,
    });
  } catch (error) {
    next(error);
  }
};

export const joinClub = async (req, res, next) => {
  try {
    const { id } = req.params;

    const club = await CollegeClub.findById(id);
    if (!club || club.status !== CLUB_STATUS.ACTIVE) {
      return res.status(404).json({ success: false, message: 'Active club not found.' });
    }

    const existing = await ClubMembership.findOne({ club: id, user: req.user._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You are already a member of this college club.',
      });
    }

    const newMembership = await ClubMembership.create({
      club: id,
      user: req.user._id,
      position: CLUB_POSITIONS.MEMBER,
      role: 'member',
      status: 'active',
    });

    await CollegeClub.findByIdAndUpdate(id, { $inc: { memberCount: 1 } });

    return res.status(201).json({
      success: true,
      message: `Successfully joined ${club.name}!`,
      membership: newMembership,
    });
  } catch (error) {
    next(error);
  }
};

export const leaveClub = async (req, res, next) => {
  try {
    const { id } = req.params;

    const membership = await ClubMembership.findOne({ club: id, user: req.user._id });
    if (!membership) {
      return res.status(404).json({ success: false, message: 'You are not a member of this club.' });
    }

    if (membership.position === CLUB_POSITIONS.SECRETARY_GENERAL) {
      return res.status(400).json({
        success: false,
        message: 'The Secretary General cannot leave the club without transferring leadership.',
      });
    }

    await ClubMembership.findByIdAndDelete(membership._id);
    await CollegeClub.findByIdAndUpdate(id, { $inc: { memberCount: -1 } });

    return res.status(200).json({
      success: true,
      message: 'You have left the club.',
    });
  } catch (error) {
    next(error);
  }
};

export const getClubMembers = async (req, res, next) => {
  try {
    const { id } = req.params;

    const members = await ClubMembership.find({ club: id, status: 'active' })
      .populate('user', 'name avatarUrl department academicYear')
      .sort({ position: 1, joinedAt: 1 })
      .lean();

    return res.status(200).json({ success: true, members });
  } catch (error) {
    next(error);
  }
};

export const updateMemberPosition = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const position = req.body.position || req.body.role;

    if (!Object.values(CLUB_POSITIONS).includes(position)) {
      return res.status(400).json({
        success: false,
        message: `Invalid position. Must be one of: ${Object.values(CLUB_POSITIONS).join(', ')}`,
      });
    }

    const club = await CollegeClub.findById(id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }

    const isPlatformAdmin = req.user.role === ROLES.ADMIN || req.user.role === ROLES.MAIN_ADMIN;
    const isSecGen = club.leadership?.secretaryGeneral?.toString() === req.user._id.toString();

    if (!isPlatformAdmin && !isSecGen) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only the Secretary General or College Administrators can manage club leadership positions.',
      });
    }

    const membership = await ClubMembership.findOne({ club: id, user: userId });
    if (!membership) {
      return res.status(404).json({ success: false, message: 'Member not found in this club.' });
    }

    membership.position = position;
    membership.role = position === CLUB_POSITIONS.MEMBER ? 'member' : 'leader';
    await membership.save();

    if (position === CLUB_POSITIONS.GENERAL_SECRETARY) {
      club.leadership.generalSecretary = userId;
    } else if (position === CLUB_POSITIONS.JOINT_SECRETARY) {
      club.leadership.jointSecretary = userId;
    } else if (position === CLUB_POSITIONS.EXECUTIVE_MEMBER) {
      if (!club.leadership.executiveMembers.includes(userId)) {
        club.leadership.executiveMembers.push(userId);
      }
    }
    await club.save();

    await createNotification({
      recipient: userId,
      actor: req.user._id,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Club Leadership Appointment',
      message: `You have been appointed as ${position.replace(/_/g, ' ')} for ${club.name}.`,
      entityType: 'CollegeClub',
      entityId: club._id,
      actionUrl: `/clubs/${club._id}`,
    });

    return res.status(200).json({
      success: true,
      message: `Member position updated to ${position}.`,
      membership,
    });
  } catch (error) {
    next(error);
  }
};

export const createClubEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      venue,
      startDate,
      endDate,
      registrationDeadline,
      maxCapacity,
      posterUrl,
    } = req.body;

    const club = await CollegeClub.findById(id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }

    const isPlatformAdmin = req.user.role === ROLES.ADMIN || req.user.role === ROLES.MAIN_ADMIN;
    const membership = await ClubMembership.findOne({ club: id, user: req.user._id });
    const isLeader = membership && (membership.role === 'leader' || membership.position === CLUB_POSITIONS.SECRETARY_GENERAL);

    if (!isPlatformAdmin && !isLeader) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only authorized club leaders can publish official club events.',
      });
    }

    const effectiveStart = startDate || req.body.date;
    const effectiveEnd =
      endDate ||
      (effectiveStart ? new Date(new Date(effectiveStart).getTime() + 2 * 60 * 60 * 1000) : null);

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      category: category || 'Clubs',
      venue: (venue || 'Campus').trim(),
      startDate: new Date(effectiveStart),
      endDate: new Date(effectiveEnd),
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      maxCapacity: maxCapacity || req.body.capacity ? parseInt(maxCapacity || req.body.capacity, 10) : null,
      posterUrl: posterUrl || club.coverImage || '',
      createdBy: req.user._id,
      club: club._id,
      isClubEvent: true,
    });

    await CollegeClub.findByIdAndUpdate(id, { $inc: { eventCount: 1 } });

    return res.status(201).json({
      success: true,
      message: `Club event "${event.title}" published successfully!`,
      event,
    });
  } catch (error) {
    next(error);
  }
};

export const getClubEvents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const events = await Event.find({ club: id })
      .populate('createdBy', 'name email avatarUrl')
      .sort({ startDate: 1 });

    return res.status(200).json({ success: true, events });
  } catch (error) {
    next(error);
  }
};
