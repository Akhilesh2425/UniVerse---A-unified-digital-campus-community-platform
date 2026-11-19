import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import app from '../app.js';
import { connectDB, closeDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { CampusIssue } from '../models/CampusIssue.js';
import { Event } from '../models/Event.js';
import { Group } from '../models/Group.js';
import { DiscussionPost } from '../models/DiscussionPost.js';
import { Announcement } from '../models/Announcement.js';
import { ROLES, USER_STATUS, NOTIFICATION_TYPES } from '../utils/constants.js';

let server;
let baseUrl;

const request = async (endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  const text = await response.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
  };
};

const runAllTests = async () => {
  console.log('\n========================================');
  console.log('   UniVerse Module 6 Backend Test Suite  ');
  console.log('   Admin, Notifications & Discovery     ');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  const test = (name, fn) => {
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    [Assertion Error]: ${err.message}`);
      failed++;
    }
  };

  try {
    await connectDB();

    server = app.listen(0);
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
    console.log(`[Test Suite] Server running on ${baseUrl}\n`);

    const student1Email = 'mod6_student1@universe.edu';
    const student2Email = 'mod6_student2@universe.edu';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@universe.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecure2026!';

    await User.deleteMany({ email: { $in: [student1Email, student2Email] } });
    await Notification.deleteMany({});
    await NotificationPreference.deleteMany({});
    await AdminAuditLog.deleteMany({});

    console.log('[Group 1: Authentication & User Setup]');

    const regStudent1 = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Student One',
        email: student1Email,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        department: 'Computer Science',
        academicYear: '3rd Year',
      },
    });
    test('Student 1 registered with 201 Created', () => {
      assert.equal(regStudent1.status, 201);
      assert.ok(regStudent1.data.token);
    });

    const student1Token = regStudent1.data.token;
    const student1Header = { Authorization: `Bearer ${student1Token}` };
    const student1Id = regStudent1.data.user._id || regStudent1.data.user.id;

    const regStudent2 = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Student Two',
        email: student2Email,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        department: 'Electrical Engineering',
        academicYear: '2nd Year',
      },
    });
    test('Student 2 registered with 201 Created', () => {
      assert.equal(regStudent2.status, 201);
      assert.ok(regStudent2.data.token);
    });

    const student2Token = regStudent2.data.token;
    const student2Header = { Authorization: `Bearer ${student2Token}` };
    const student2Id = regStudent2.data.user._id || regStudent2.data.user.id;

    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: adminEmail,
        password: adminPassword,
      },
    });
    test('Admin login successful with 200 OK', () => {
      assert.equal(adminLogin.status, 200);
      assert.ok(adminLogin.data.token);
    });

    const adminToken = adminLogin.data.token;
    const adminHeader = { Authorization: `Bearer ${adminToken}` };

    console.log('\n[Group 2: Notifications Core Functionality]');

    const unreadRes1 = await request('/api/notifications/unread-count', { headers: student1Header });
    test('Initial unread count is 0', () => {
      assert.equal(unreadRes1.status, 200);
      assert.equal(unreadRes1.data.unreadCount, 0);
    });

    const notif1 = await Notification.create({
      recipient: student1Id,
      type: NOTIFICATION_TYPES.DISCUSSION_COMMENT,
      title: 'New Reply on Discussion',
      message: 'Student Two commented on your data structures post.',
      entityType: 'discussion',
      actionUrl: '/discussions/test-post',
    });
    test('Notification created in MongoDB Atlas', () => {
      assert.ok(notif1._id);
    });

    const unreadRes2 = await request('/api/notifications/unread-count', { headers: student1Header });
    test('Unread count incremented to 1', () => {
      assert.equal(unreadRes2.status, 200);
      assert.equal(unreadRes2.data.unreadCount, 1);
    });

    const listRes = await request('/api/notifications', { headers: student1Header });
    test('Student 1 fetches notifications list', () => {
      assert.equal(listRes.status, 200);
      assert.equal(listRes.data.notifications.length, 1);
      assert.equal(listRes.data.notifications[0].title, 'New Reply on Discussion');
      assert.equal(listRes.data.notifications[0].isRead, false);
    });

    const listResStudent2 = await request('/api/notifications', { headers: student2Header });
    test('Notification isolation: Student 2 cannot see Student 1 notifications', () => {
      assert.equal(listResStudent2.status, 200);
      assert.equal(listResStudent2.data.notifications.length, 0);
    });

    const markReadRes = await request(`/api/notifications/${notif1._id}/read`, {
      method: 'PATCH',
      headers: student1Header,
    });
    test('Mark single notification as read returns 200', () => {
      assert.equal(markReadRes.status, 200);
      assert.equal(markReadRes.data.notification.isRead, true);
      assert.ok(markReadRes.data.notification.readAt);
    });

    const unreadRes3 = await request('/api/notifications/unread-count', { headers: student1Header });
    test('Unread count is 0 after marking read', () => {
      assert.equal(unreadRes3.status, 200);
      assert.equal(unreadRes3.data.unreadCount, 0);
    });

    await Notification.create([
      {
        recipient: student1Id,
        type: NOTIFICATION_TYPES.CAMPUS_ISSUE_UPDATE,
        title: 'Issue Status Updated',
        message: 'Your report is now In Progress',
        entityType: 'issue',
        actionUrl: '/issues/123',
      },
      {
        recipient: student1Id,
        type: NOTIFICATION_TYPES.EVENT_UPDATE,
        title: 'Event Venue Changed',
        message: 'Hackathon venue moved to Hall B',
        entityType: 'event',
        actionUrl: '/events/123',
      },
    ]);

    const markAllRes = await request('/api/notifications/read-all', {
      method: 'PATCH',
      headers: student1Header,
    });
    test('Mark all notifications read returns 200', () => {
      assert.equal(markAllRes.status, 200);
    });

    const unreadRes4 = await request('/api/notifications/unread-count', { headers: student1Header });
    test('Unread count after mark-all is 0', () => {
      assert.equal(unreadRes4.status, 200);
      assert.equal(unreadRes4.data.unreadCount, 0);
    });

    const deleteNotifRes = await request(`/api/notifications/${notif1._id}`, {
      method: 'DELETE',
      headers: student1Header,
    });
    test('Delete notification returns 200 OK', () => {
      assert.equal(deleteNotifRes.status, 200);
    });

    const deleteUnauthorized = await request(`/api/notifications/${notif1._id}`, {
      method: 'DELETE',
      headers: student2Header,
    });
    test('Unauthorized notification deletion rejected with 404', () => {
      assert.equal(deleteUnauthorized.status, 404);
    });

    console.log('\n[Group 3: Notification Preferences]');

    const prefRes1 = await request('/api/notifications/preferences', { headers: student1Header });
    test('Fetch notification preferences returns default enabled categories', () => {
      assert.equal(prefRes1.status, 200);
      assert.equal(prefRes1.data.preferences.eventUpdates, true);
      assert.equal(prefRes1.data.preferences.essentialAccountNotices, true);
    });

    const updatePrefRes = await request('/api/notifications/preferences', {
      method: 'PATCH',
      headers: student1Header,
      body: {
        eventUpdates: false,
        essentialAccountNotices: false, 
      },
    });
    test('Update preferences disables eventUpdates', () => {
      assert.equal(updatePrefRes.status, 200);
      assert.equal(updatePrefRes.data.preferences.eventUpdates, false);
      assert.equal(updatePrefRes.data.preferences.essentialAccountNotices, true);
    });

    console.log('\n[Group 4: Global Search & Discovery]');

    const testEvent = await Event.create({
      title: 'Global Search Robotics Showcase 2026',
      description: 'Annual competitive robotics exhibition and workshop in campus arena.',
      category: 'Technical',
      venue: 'Robotics Center Hall 1',
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      registrationDeadline: new Date(Date.now() + 43200000),
      createdBy: student1Id,
      maxParticipants: 50,
    });

    const testPublicIssue = await CampusIssue.create({
      referenceId: 'ISS-2026-SEARCH01',
      title: 'Water Cooler Leakage in Robotics Lab',
      description: 'Persistent water leaking on the floor near server racks.',
      category: 'Water Supply',
      location: 'Robotics Lab',
      priority: 'high',
      visibility: 'public',
      reporter: student1Id,
      status: 'submitted',
    });

    const testPrivateIssue = await CampusIssue.create({
      referenceId: 'ISS-2026-PRIVATE99',
      title: 'Confidential Security Concern in Robotics Wing',
      description: 'Private student complaint that must never leak into search.',
      category: 'Safety & Security',
      location: 'Robotics Wing',
      priority: 'critical',
      visibility: 'private',
      reporter: student1Id,
      status: 'submitted',
    });

    const searchRes = await request('/api/search?q=Robotics');
    test('Global search returns 200 OK with categorized results', () => {
      assert.equal(searchRes.status, 200);
      assert.ok(searchRes.data.results.length > 0);
      assert.ok(searchRes.data.counts.events >= 1);
      assert.ok(searchRes.data.counts.issues >= 1);
    });

    test('Private issues strictly excluded from search results', () => {
      const hasPrivateIssue = searchRes.data.results.some(
        (r) => r.title.includes('Confidential Security Concern') || r.extra?.referenceId === 'ISS-2026-PRIVATE99'
      );
      assert.equal(hasPrivateIssue, false);
    });

    test('Public issue included with proper actionUrl and referenceId', () => {
      const publicIssueItem = searchRes.data.results.find(
        (r) => r.extra?.referenceId === 'ISS-2026-SEARCH01'
      );
      assert.ok(publicIssueItem);
      assert.equal(publicIssueItem.type, 'issue');
      assert.equal(publicIssueItem.url, `/issues/${testPublicIssue._id}`);
    });

    const eventSearchRes = await request('/api/search?q=Robotics&type=events');
    test('Type-filtered search (type=events) returns only events', () => {
      assert.equal(eventSearchRes.status, 200);
      assert.ok(eventSearchRes.data.results.every((r) => r.type === 'event'));
    });

    const discoverRes = await request('/api/discover');
    test('Campus Discovery returns 200 with structured sections', () => {
      assert.equal(discoverRes.status, 200);
      assert.ok(Array.isArray(discoverRes.data.discovery.upcomingEvents));
      assert.ok(Array.isArray(discoverRes.data.discovery.latestAnnouncements));
      assert.ok(Array.isArray(discoverRes.data.discovery.popularGroups));
      assert.ok(Array.isArray(discoverRes.data.discovery.trendingDiscussions));
      assert.ok(Array.isArray(discoverRes.data.discovery.supportedIssues));
    });

    console.log('\n[Group 5: Centralized Admin Dashboard]');

    const studentBlockedOverview = await request('/api/admin/dashboard/overview', {
      headers: student1Header,
    });
    test('Student blocked from /api/admin/dashboard/overview with 403', () => {
      assert.equal(studentBlockedOverview.status, 403);
    });

    const adminOverview = await request('/api/admin/dashboard/overview', {
      headers: adminHeader,
    });
    test('Admin fetches live database overview with 200 OK', () => {
      assert.equal(adminOverview.status, 200);
      assert.ok(adminOverview.data.statistics.users.total >= 2);
      assert.ok(adminOverview.data.statistics.events.total >= 1);
      assert.ok(adminOverview.data.statistics.issues.total >= 2);
      assert.ok(Array.isArray(adminOverview.data.statistics.users.departmentDistribution));
    });

    const adminActivity = await request('/api/admin/dashboard/activity', {
      headers: adminHeader,
    });
    test('Admin fetches recent platform activity feed', () => {
      assert.equal(adminActivity.status, 200);
      assert.ok(Array.isArray(adminActivity.data.activities));
      assert.ok(adminActivity.data.activities.length > 0);
    });

    const adminAnalytics = await request('/api/admin/dashboard/analytics', {
      headers: adminHeader,
    });
    test('Admin fetches visual analytics data with distributions', () => {
      assert.equal(adminAnalytics.status, 200);
      assert.ok(Array.isArray(adminAnalytics.data.analytics.registrationTrends));
      assert.ok(Array.isArray(adminAnalytics.data.analytics.issueStatusDistribution));
      assert.ok(Array.isArray(adminAnalytics.data.analytics.issuePriorityDistribution));
    });

    console.log('\n[Group 6: User Administration & Role Management]');

    const studentBlockedUsers = await request('/api/admin/users', { headers: student1Header });
    test('Student blocked from user management with 403', () => {
      assert.equal(studentBlockedUsers.status, 403);
    });

    const usersListRes = await request('/api/admin/users?q=Student+One', { headers: adminHeader });
    test('Admin lists users and finds Student One', () => {
      assert.equal(usersListRes.status, 200);
      assert.equal(usersListRes.data.users.length, 1);
      assert.equal(usersListRes.data.users[0].email, student1Email);
    });

    const userDetailRes = await request(`/api/admin/users/${student1Id}`, { headers: adminHeader });
    test('Admin retrieves single user profile and activity summary', () => {
      assert.equal(userDetailRes.status, 200);
      assert.equal(userDetailRes.data.user.email, student1Email);
      assert.ok(userDetailRes.data.activitySummary);
    });

    const suspendRes = await request(`/api/admin/users/${student2Id}/status`, {
      method: 'PATCH',
      headers: adminHeader,
      body: {
        status: USER_STATUS.SUSPENDED,
        reason: 'Violated campus community safety guidelines.',
      },
    });
    test('Admin suspends Student 2 with 200 OK', () => {
      assert.equal(suspendRes.status, 200);
      assert.equal(suspendRes.data.user.status, USER_STATUS.SUSPENDED);
    });

    const suspendedAction = await request('/api/notifications', { headers: student2Header });
    test('Suspended student blocked from platform APIs with 403', () => {
      assert.equal(suspendedAction.status, 403);
      assert.ok(suspendedAction.data.message.includes('suspended'));
    });

    const restoreRes = await request(`/api/admin/users/${student2Id}/status`, {
      method: 'PATCH',
      headers: adminHeader,
      body: {
        status: USER_STATUS.ACTIVE,
        reason: 'Account reinstated after administrative review.',
      },
    });
    test('Admin restores Student 2 to active', () => {
      assert.equal(restoreRes.status, 200);
      assert.equal(restoreRes.data.user.status, USER_STATUS.ACTIVE);
    });

    const promoteRes = await request(`/api/admin/users/${student1Id}/role`, {
      method: 'PATCH',
      headers: adminHeader,
      body: { role: ROLES.ADMIN },
    });
    test('Admin promotes Student 1 to Admin role', () => {
      assert.equal(promoteRes.status, 200);
      assert.equal(promoteRes.data.user.role, ROLES.ADMIN);
    });

    const selfDemoteRes = await request(`/api/admin/users/${student1Id}/role`, {
      method: 'PATCH',
      headers: student1Header, 
      body: { role: ROLES.STUDENT },
    });
    test('Self-demotion prevented with 400 Bad Request', () => {
      assert.equal(selfDemoteRes.status, 400);
      assert.ok(selfDemoteRes.data.message.includes('cannot demote their own account'));
    });

    console.log('\n[Group 7: Administrative Audit Logs]');

    const studentBlockedAudit = await request('/api/admin/audit-logs', { headers: student2Header });
    test('Student blocked from audit logs with 403', () => {
      assert.equal(studentBlockedAudit.status, 403);
    });

    const auditRes = await request('/api/admin/audit-logs', { headers: adminHeader });
    test('Admin fetches audit logs with 200 OK', () => {
      assert.equal(auditRes.status, 200);
      assert.ok(auditRes.data.logs.length >= 2);
    });

    test('Audit log recorded USER_STATUS_CHANGE and USER_ROLE_CHANGE actions', () => {
      const actions = auditRes.data.logs.map((l) => l.action);
      assert.ok(actions.includes('USER_STATUS_CHANGE'));
      assert.ok(actions.includes('USER_ROLE_CHANGE'));
    });

    await User.deleteMany({ email: { $in: [student1Email, student2Email] } });
    await Notification.deleteMany({});
    await NotificationPreference.deleteMany({});
    await AdminAuditLog.deleteMany({});
    await Event.findByIdAndDelete(testEvent._id);
    await CampusIssue.findByIdAndDelete(testPublicIssue._id);
    await CampusIssue.findByIdAndDelete(testPrivateIssue._id);

  } catch (fatalError) {
    console.error('[Fatal Test Suite Error]:', fatalError);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await closeDB();
  }

  console.log('\n========================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runAllTests();
