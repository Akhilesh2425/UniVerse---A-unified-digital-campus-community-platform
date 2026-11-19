
export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  MAIN_ADMIN: 'main_admin',
};

export const EVENT_CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Workshops',
  'Clubs',
  'Competitions',
  'Other',
];

export const ANNOUNCEMENT_CATEGORIES = [
  'Academic',
  'Events',
  'Administrative',
  'Campus Updates',
  'General',
];

export const ANNOUNCEMENT_PRIORITIES = [
  'normal',
  'important',
];

export const REGISTRATION_STATUS = {
  REGISTERED: 'registered',
  CANCELLED: 'cancelled',
};

export const GROUP_CATEGORIES = [
  'Technical',
  'Coding & Competitive Programming',
  'Artificial Intelligence & Machine Learning',
  'Academic & Research',
  'Cultural',
  'Sports & Fitness',
  'Entrepreneurship',
  'Arts & Photography',
  'Social Impact',
  'Other',
];

export const GROUP_ROLES = {
  OWNER: 'owner',
  MODERATOR: 'moderator',
  MEMBER: 'member',
};

export const GROUP_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
};

export const JOIN_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const DISCUSSION_CATEGORIES = [
  'Academics',
  'Programming & DSA',
  'Projects',
  'Placements & Internships',
  'Career Guidance',
  'Campus Life',
  'Technology',
  'Research',
  'Events',
  'General Discussion',
];

export const DISCUSSION_TYPES = {
  QUESTION: 'question',
  DISCUSSION: 'discussion',
  RESOURCE: 'resource',
  PROJECT: 'project',
};

export const DISCUSSION_STATUS = {
  OPEN: 'open',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  HIDDEN: 'hidden',
};

export const REPORT_REASONS = [
  'Spam',
  'Harassment',
  'Inappropriate content',
  'Misleading information',
  'Other',
];

export const REPORT_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  DISMISSED: 'dismissed',
  RESOLVED: 'resolved',
};

export const ISSUE_CATEGORIES = [
  'Infrastructure & Maintenance',
  'Electricity & Power',
  'Water Supply',
  'Internet & Wi-Fi',
  'Hostel Facilities',
  'Classroom & Laboratory',
  'Library Facilities',
  'Cleanliness & Sanitation',
  'Food & Canteen',
  'Transportation & Parking',
  'Safety & Security',
  'Accessibility',
  'Other',
];

export const ISSUE_PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const ISSUE_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  REJECTED: 'rejected',
  DUPLICATE: 'duplicate',
  REOPENED: 'reopened',
};

export const ISSUE_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
};

export const CAMPUS_DEPARTMENTS = [
  'Campus Administration',
  'Electrical Maintenance',
  'Civil Maintenance',
  'Plumbing & Water Supply',
  'IT Support',
  'Hostel Administration',
  'Library Administration',
  'Transport Department',
  'Food Services',
  'Security Department',
  'Sanitation & Housekeeping',
  'Other',
];

export const REOPEN_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
};

export const NOTIFICATION_TYPES = {
  EVENT_UPDATE: 'event_update',
  EVENT_CANCELLED: 'event_cancelled',
  ANNOUNCEMENT_PUBLISHED: 'announcement_published',
  GROUP_JOIN_REQUEST: 'group_join_request',
  GROUP_JOIN_DECISION: 'group_join_decision',
  GROUP_ROLE_UPDATE: 'group_role_update',
  GROUP_RESOURCE_ADDED: 'group_resource_added',
  GROUP_ACTIVITY_SCHEDULED: 'group_activity_scheduled',
  NEW_CLUB_PUBLISHED: 'new_club_published',
  CLUB_PROPOSAL_DECISION: 'club_proposal_decision',
  CLUB_EVENT_CREATED: 'club_event_created',
  DISCUSSION_COMMENT: 'discussion_comment',
  DISCUSSION_ACCEPTED_ANSWER: 'discussion_accepted_answer',
  CAMPUS_ISSUE_UPDATE: 'campus_issue_update',
  CAMPUS_ISSUE_RESOLVED: 'campus_issue_resolved',
  CAMPUS_ISSUE_REOPENED: 'campus_issue_reopened',
  FORM_DEADLINE_REMINDER: 'form_deadline_reminder',
  ACCOUNT_STATUS: 'account_status',
  ACCOUNT_ROLE: 'account_role',
  SYSTEM: 'system',
};

export const NOTIFICATION_CATEGORIES = [
  'eventUpdates',
  'announcements',
  'groupActivity',
  'membershipUpdates',
  'discussionActivity',
  'campusIssueUpdates',
  'essentialAccountNotices',
  'clubUpdates',
  'formReminders',
];

export const AUDIT_ACTIONS = {
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  USER_STATUS_CHANGE: 'USER_STATUS_CHANGE',
  EVENT_CREATE: 'EVENT_CREATE',
  EVENT_UPDATE: 'EVENT_UPDATE',
  EVENT_DELETE: 'EVENT_DELETE',
  ANNOUNCEMENT_PUBLISH: 'ANNOUNCEMENT_PUBLISH',
  ANNOUNCEMENT_UPDATE: 'ANNOUNCEMENT_UPDATE',
  ANNOUNCEMENT_DELETE: 'ANNOUNCEMENT_DELETE',
  GROUP_DELETE: 'GROUP_DELETE',
  CLUB_PROPOSAL_APPROVE: 'CLUB_PROPOSAL_APPROVE',
  CLUB_PROPOSAL_REJECT: 'CLUB_PROPOSAL_REJECT',
  CLUB_UPDATE: 'CLUB_UPDATE',
  CLUB_DELETE: 'CLUB_DELETE',
  FORM_CREATE: 'FORM_CREATE',
  FORM_UPDATE: 'FORM_UPDATE',
  FORM_DELETE: 'FORM_DELETE',
  DISCUSSION_MODERATE: 'DISCUSSION_MODERATE',
  ISSUE_STATUS_CHANGE: 'ISSUE_STATUS_CHANGE',
  ISSUE_ASSIGNMENT: 'ISSUE_ASSIGNMENT',
  ISSUE_UPDATE_PUBLISH: 'ISSUE_UPDATE_PUBLISH',
  ISSUE_RESOLVE: 'ISSUE_RESOLVE',
  ISSUE_CLOSE: 'ISSUE_CLOSE',
  REOPEN_REQUEST_REVIEW: 'REOPEN_REQUEST_REVIEW',
  PASSWORD_RESET: 'PASSWORD_RESET',
  SYSTEM_CONFIG: 'SYSTEM_CONFIG',
};

export const CLUB_CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Academic',
  'Arts & Media',
  'Social Impact',
  'Entrepreneurship',
  'Coding & Development',
  'Robotics & Automation',
  'Literary & Debate',
  'Arts & Photography',
  'Music & Band',
  'Dance & Performing Arts',
  'Entrepreneurship & Innovation',
  'Cultural & Heritage',
  'Sports & Athletics',
  'Technical & Engineering',
  'Social Impact & Volunteering',
  'Other',
];

export const CLUB_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
};

export const CLUB_POSITIONS = {
  SECRETARY_GENERAL: 'secretary_general',
  GENERAL_SECRETARY: 'general_secretary',
  JOINT_SECRETARY: 'joint_secretary',
  EXECUTIVE_MEMBER: 'executive_member',
  COORDINATOR: 'coordinator',
  COMMITTEE_MEMBER: 'committee_member',
  MEMBER: 'member',
  FACULTY_ADVISOR: 'faculty_advisor',
};

export const CLUB_PROPOSAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const FORM_CATEGORIES = [
  'Internship',
  'Placement',
  'Scholarship',
  'Workshop',
  'Competition',
  'Club Recruitment',
  'Project Submission',
  'Academic',
  'Other',
];

export const FORM_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
};

export const GROUP_EMAIL_PREFERENCES = {
  ALL: 'all',
  ANNOUNCEMENTS_ONLY: 'announcements_only',
  DIGEST: 'digest',
  MUTED: 'muted',
};

export const EMAIL_CATEGORIES = {
  OTP: 'otp',
  ANNOUNCEMENT: 'announcement',
  NEW_CLUB: 'new_club',
  GROUP_UPDATE: 'group_update',
  CLUB_UPDATE: 'club_update',
  FORM_REMINDER: 'form_reminder',
};

