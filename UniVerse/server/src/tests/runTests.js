import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from '../app.js';
import http from 'http';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { Announcement } from '../models/Announcement.js';

let server;
let baseUrl;

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, data, headers: res.headers };
};

const runAllTests = async () => {
  console.log('\n========================================');
  console.log('   UniVerse Backend Test Suite');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  try {
    // 1. Connect DB and start test server on dynamic port
    await mongoose.connect(process.env.MONGO_URI);
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`[Test Suite] Test server running on ${baseUrl}\n`);

    // Clean test accounts if exist
    const testEmail = 'test_student_2026@universe.edu';
    await User.deleteMany({ email: { $in: [testEmail, 'temp_dupe@universe.edu'] } });

    // Test 1: Health check endpoint
    console.log('[Group 1: System Health]');
    const healthRes = await request('/api/health');
    assert(healthRes.status === 200, 'Health endpoint returns 200 OK');
    assert(healthRes.data.database.isConnected === true, 'Database status reported as connected');

    // Test 2: Student Registration
    console.log('\n[Group 2: Authentication & Registration]');
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Jordan Campus',
        email: testEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        department: 'Computer Science',
        academicYear: '3rd Year',
        role: 'admin', // Malicious attempt to elevate role
      },
    });

    assert(regRes.status === 201, 'Student registration returns 201 Created');
    assert(regRes.data.user.role === 'student', 'Role elevation prevented: forced to student');
    assert(regRes.data.token && typeof regRes.data.token === 'string', 'JWT token issued in response');
    const studentToken = regRes.data.token;
    const studentAuthHeader = { Authorization: `Bearer ${studentToken}` };

    // Test 3: Duplicate Registration Rejection
    const dupeRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Jordan Dupe',
        email: testEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        department: 'Computer Science',
        academicYear: '3rd Year',
      },
    });
    assert(dupeRes.status === 409, 'Duplicate email registration rejected with 409 Conflict');

    // Test 4: Password Mismatch Rejection
    const mismatchRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Mismatch Test',
        email: 'temp_dupe@universe.edu',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword!',
        department: 'Electrical Engineering',
        academicYear: '1st Year',
      },
    });
    assert(mismatchRes.status === 400, 'Password mismatch rejected with 400 Bad Request');

    // Test 5: Login - Failed Attempt
    const failLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'WrongPassword!' },
    });
    assert(failLoginRes.status === 401, 'Invalid credentials rejected with 401');

    // Test 6: Login - Successful Attempt
    const successLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'Password123!' },
    });
    assert(successLoginRes.status === 200, 'Valid credentials login returns 200 OK');
    assert(successLoginRes.data.user.email === testEmail, 'User profile returned without password');

    // Test 7: Session Restoration (/api/auth/me)
    const meRes = await request('/api/auth/me', { headers: studentAuthHeader });
    assert(meRes.status === 200, 'Session restoration /api/auth/me returns 200');
    assert(meRes.data.user.name === 'Jordan Campus', 'Session restored correct student identity');

    // Test 8: Unauthenticated access to protected route
    const unauthRes = await request('/api/auth/me');
    assert(unauthRes.status === 401, 'Unauthenticated /api/auth/me rejected with 401');

    // Test 9: Profile Update & Privilege Protection
    console.log('\n[Group 3: User Profile]');
    const updateProfileRes = await request('/api/users/me', {
      method: 'PATCH',
      headers: studentAuthHeader,
      body: {
        department: 'Artificial Intelligence & Robotics',
        interests: ['Hackathons', 'Cloud Computing'],
        role: 'admin', // Attempted role injection
      },
    });
    assert(updateProfileRes.status === 200, 'Profile update returns 200 OK');
    assert(updateProfileRes.data.user.department === 'Artificial Intelligence & Robotics', 'Department updated successfully');
    assert(updateProfileRes.data.user.role === 'student', 'Tampered role ignored: remains student');

    // Admin Authentication
    console.log('\n[Group 4: Admin Authorization & Roles]');
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: process.env.ADMIN_EMAIL || 'admin@universe.edu',
        password: process.env.ADMIN_PASSWORD || 'AdminSecure2026!',
      },
    });
    assert(adminLoginRes.status === 200, 'Admin login succeeded');
    const adminToken = adminLoginRes.data.token;
    const adminAuthHeader = { Authorization: `Bearer ${adminToken}` };

    // Test 10: Role-based Authorization: Student attempting to create event
    const studentCreateEventRes = await request('/api/events', {
      method: 'POST',
      headers: studentAuthHeader,
      body: {
        title: 'Unauthorized Student Event',
        description: 'Should fail',
        category: 'Technical',
        venue: 'Room 101',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
      },
    });
    assert(studentCreateEventRes.status === 403, 'Student blocked from creating event with 403 Forbidden');

    // Test 11: Events Discovery & Filtering
    console.log('\n[Group 5: Events Module]');
    const eventsListRes = await request('/api/events');
    assert(eventsListRes.status === 200, 'Public events listing returns 200 OK');
    assert(eventsListRes.data.events.length > 0, 'Loaded events from database');
    const testEvent = eventsListRes.data.events[0];

    // Test 12: Event Details
    const eventDetailRes = await request(`/api/events/${testEvent._id}`, { headers: studentAuthHeader });
    assert(eventDetailRes.status === 200, 'Event details by ID returns 200 OK');
    assert(eventDetailRes.data.event.title === testEvent.title, 'Loaded matching event title');

    // Test 13: Student Event Registration
    const registerEventRes = await request(`/api/events/${testEvent._id}/register`, {
      method: 'POST',
      headers: studentAuthHeader,
    });
    assert(registerEventRes.status === 201, 'Student successfully registered for event with 201');

    // Test 14: Duplicate Event Registration Prevention
    const dupeEventRegRes = await request(`/api/events/${testEvent._id}/register`, {
      method: 'POST',
      headers: studentAuthHeader,
    });
    assert(dupeEventRegRes.status === 409, 'Duplicate event registration rejected with 409 Conflict');

    // Test 15: My Registrations View
    const myRegsRes = await request('/api/events/my-registrations', { headers: studentAuthHeader });
    assert(myRegsRes.status === 200, 'My Registrations returns 200 OK');
    assert(
      myRegsRes.data.registrations.some((r) => r.event._id === testEvent._id),
      'Registered event correctly appears in student My Events list'
    );

    // Test 16: Cancel Event Registration
    const cancelRegRes = await request(`/api/events/${testEvent._id}/register`, {
      method: 'DELETE',
      headers: studentAuthHeader,
    });
    assert(cancelRegRes.status === 200, 'Cancelled registration returns 200 OK');

    const verifyCancelledRes = await request('/api/events/my-registrations', { headers: studentAuthHeader });
    assert(
      !verifyCancelledRes.data.registrations.some((r) => r.event._id === testEvent._id),
      'Cancelled event removed from active registrations'
    );

    // Test 17: Announcements Module
    console.log('\n[Group 6: Announcements Module]');
    // Student should only see published announcements
    const studentAnnounceRes = await request('/api/announcements', { headers: studentAuthHeader });
    assert(studentAnnounceRes.status === 200, 'Announcements list returns 200 OK');
    const hasUnpublished = studentAnnounceRes.data.announcements.some((a) => !a.isPublished);
    assert(!hasUnpublished, 'Students cannot see unpublished/draft announcements');

    // Admin creating a new announcement
    const newAnnounceRes = await request('/api/announcements', {
      method: 'POST',
      headers: adminAuthHeader,
      body: {
        title: 'Automated Test Notice',
        content: 'This announcement was created during test suite execution.',
        category: 'Campus Updates',
        priority: 'important',
        isPublished: true,
      },
    });
    assert(newAnnounceRes.status === 201, 'Admin created announcement returns 201 Created');
    const createdAnnounceId = newAnnounceRes.data.announcement._id;

    // Admin updating/unpublishing announcement
    const updateAnnounceRes = await request(`/api/announcements/${createdAnnounceId}`, {
      method: 'PATCH',
      headers: adminAuthHeader,
      body: { isPublished: false },
    });
    assert(updateAnnounceRes.status === 200, 'Admin unpublished announcement successfully');

    // Student trying to read now-unpublished announcement by ID -> must fail with 404
    const studentReadDraftRes = await request(`/api/announcements/${createdAnnounceId}`, {
      headers: studentAuthHeader,
    });
    assert(studentReadDraftRes.status === 404, 'Student reading unpublished announcement receives 404');

    // Admin clean up test announcement
    const deleteAnnounceRes = await request(`/api/announcements/${createdAnnounceId}`, {
      method: 'DELETE',
      headers: adminAuthHeader,
    });
    assert(deleteAnnounceRes.status === 200, 'Admin deleted test announcement');

    // Clean up test student
    // ==========================================
    // MODULE 3: GROUPS & COMMUNITIES INTEGRATION
    // ==========================================
    console.log('\n[Group 7: Groups & Communities Module]');

    // Create a second test student for membership/request testing
    const secondStudentEmail = 'student2_test@universe.edu';
    await User.deleteMany({ email: secondStudentEmail });

    const student2Res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Sam SecondStudent',
        email: secondStudentEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        department: 'Information Technology',
        academicYear: '2nd Year',
      },
    });
    assert(student2Res.status === 201, 'Second student created for community testing');
    const student2Token = student2Res.data.token;
    const student2AuthHeader = { Authorization: `Bearer ${student2Token}` };

    // Test 18: Groups Discovery
    const groupsListRes = await request('/api/groups');
    assert(groupsListRes.status === 200, 'Groups discovery endpoint returns 200 OK');
    assert(groupsListRes.data.groups.length > 0, 'Loaded groups from MongoDB');

    // Test 19: Create Public Group
    const createGroupRes = await request('/api/groups', {
      method: 'POST',
      headers: studentAuthHeader,
      body: {
        name: 'Automated Test Coding Club',
        shortDescription: 'A club created by automated integration tests.',
        description: 'Comprehensive detailed description of the test coding club for verification purposes.',
        category: 'Coding & Competitive Programming',
        tags: ['Automated', 'Testing', 'Jest'],
        visibility: 'public',
        rules: ['Rule 1: Be respectful', 'Rule 2: Keep coding'],
      },
    });
    assert(createGroupRes.status === 201, 'Student created group with 201 Created');
    assert(createGroupRes.data.group.name === 'Automated Test Coding Club', 'Group name stored accurately');
    const createdGroupId = createGroupRes.data.group._id;

    // Test 20: Group Details
    const groupDetailRes = await request(`/api/groups/${createdGroupId}`, { headers: studentAuthHeader });
    assert(groupDetailRes.status === 200, 'Group details returns 200 OK');
    assert(groupDetailRes.data.group.isOwner === true, 'Creator verified as group owner');

    // Test 21: Second Student Joins Public Group Directly
    const joinPublicRes = await request(`/api/groups/${createdGroupId}/join`, {
      method: 'POST',
      headers: student2AuthHeader,
    });
    assert(joinPublicRes.status === 201, 'Second student joined public group with 201 Created');
    assert(joinPublicRes.data.status === 'joined', 'Direct join status confirmed');

    // Test 22: Duplicate Join Attempt Blocked
    const dupeJoinRes = await request(`/api/groups/${createdGroupId}/join`, {
      method: 'POST',
      headers: student2AuthHeader,
    });
    assert(dupeJoinRes.status === 409, 'Duplicate join rejected with 409 Conflict');

    // Test 23: Create Private Group
    const createPrivateGroupRes = await request('/api/groups', {
      method: 'POST',
      headers: studentAuthHeader,
      body: {
        name: 'Private Founders Guild',
        shortDescription: 'Confidential student founder group.',
        description: 'Private student incubator requiring invitation and approval.',
        category: 'Entrepreneurship',
        visibility: 'private',
      },
    });
    assert(createPrivateGroupRes.status === 201, 'Created private group with 201 Created');
    const privateGroupId = createPrivateGroupRes.data.group._id;

    // Test 24: Second Student Requests to Join Private Group
    const requestPrivateRes = await request(`/api/groups/${privateGroupId}/join`, {
      method: 'POST',
      headers: student2AuthHeader,
    });
    assert(requestPrivateRes.status === 201, 'Join request to private group submitted');
    assert(requestPrivateRes.data.status === 'requested', 'Status is pending request');

    // Test 25: Duplicate Join Request Blocked
    const dupeRequestRes = await request(`/api/groups/${privateGroupId}/join`, {
      method: 'POST',
      headers: student2AuthHeader,
    });
    assert(dupeRequestRes.status === 409, 'Duplicate join request rejected with 409 Conflict');

    // Test 26: Non-owner blocked from viewing join requests
    const unauthRequestsRes = await request(`/api/groups/${privateGroupId}/join-requests`, {
      headers: student2AuthHeader,
    });
    assert(unauthRequestsRes.status === 403, 'Non-owner blocked from viewing join requests with 403');

    // Test 27: Owner Views Pending Join Requests
    const ownerRequestsRes = await request(`/api/groups/${privateGroupId}/join-requests`, {
      headers: studentAuthHeader,
    });
    assert(ownerRequestsRes.status === 200, 'Owner retrieved join requests with 200 OK');
    assert(ownerRequestsRes.data.requests.length === 1, 'Found 1 pending request');
    const pendingRequestId = ownerRequestsRes.data.requests[0]._id;

    // Test 28: Owner Approves Join Request
    const approveReqRes = await request(`/api/groups/${privateGroupId}/join-requests/${pendingRequestId}`, {
      method: 'PATCH',
      headers: studentAuthHeader,
      body: { status: 'approved' },
    });
    assert(approveReqRes.status === 200, 'Owner approved join request successfully');

    // Test 29: Promote Member to Moderator
    const promoteRes = await request(
      `/api/groups/${createdGroupId}/members/${student2Res.data.user._id}/role`,
      {
        method: 'PATCH',
        headers: studentAuthHeader,
        body: { role: 'moderator' },
      }
    );
    assert(promoteRes.status === 200, 'Owner promoted member to moderator');

    // Test 30: Member Publishes a Post
    const newPostRes = await request(`/api/groups/${createdGroupId}/posts`, {
      method: 'POST',
      headers: student2AuthHeader,
      body: {
        title: 'Excited to be here!',
        content: 'Sharing our first algorithmic challenge solution for the week.',
      },
    });
    assert(newPostRes.status === 201, 'Group member published post with 201 Created');
    const createdPostId = newPostRes.data.post._id;

    // Test 31: Add Comment to Post
    const addCommentRes = await request(`/api/groups/${createdGroupId}/posts/${createdPostId}/comments`, {
      method: 'POST',
      headers: studentAuthHeader,
      body: { content: 'Welcome to the club! Great solution.' },
    });
    assert(addCommentRes.status === 201, 'Added comment to post with 201 Created');

    // Test 32: Retrieve My Groups
    const myGroupsRes = await request('/api/groups/my', { headers: student2AuthHeader });
    assert(myGroupsRes.status === 200, 'My Groups endpoint returns 200 OK');
    assert(myGroupsRes.data.groups.length >= 2, 'Student2 correctly belongs to both joined groups');

    // Test 33: Sole Owner Prevented from Leaving
    const soleOwnerLeaveRes = await request(`/api/groups/${createdGroupId}/membership`, {
      method: 'DELETE',
      headers: studentAuthHeader,
    });
    assert(soleOwnerLeaveRes.status === 400, 'Sole owner prevented from leaving group with 400');

    // Test 34: Ordinary Member Leaves Group
    const memberLeaveRes = await request(`/api/groups/${createdGroupId}/membership`, {
      method: 'DELETE',
      headers: student2AuthHeader,
    });
    assert(memberLeaveRes.status === 200, 'Member left group successfully with 200 OK');

    // Test 35: Delete Group and Cascade Cleanup
    const deleteGroupRes = await request(`/api/groups/${createdGroupId}`, {
      method: 'DELETE',
      headers: studentAuthHeader,
    });
    assert(deleteGroupRes.status === 200, 'Group deleted with cascade cleanup of posts/comments');

    // Clean up second private group
    await request(`/api/groups/${privateGroupId}`, {
      method: 'DELETE',
      headers: studentAuthHeader,
    });

    // Clean up test students
    await User.deleteMany({ email: { $in: [testEmail, secondStudentEmail] } });
  } catch (error) {
    console.error('[Test Error]:', error);
    failed++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close();

    console.log('\n========================================');
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('========================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
};

runAllTests();
