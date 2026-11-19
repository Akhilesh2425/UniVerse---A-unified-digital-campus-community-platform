import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
dotenv.config();

import app from '../app.js';
import { connectDB, closeDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import { GroupMembership } from '../models/GroupMembership.js';
import { GroupInvitation } from '../models/GroupInvitation.js';
import { GroupResource } from '../models/GroupResource.js';
import { GroupActivity } from '../models/GroupActivity.js';
import { CollegeClub } from '../models/CollegeClub.js';
import { ClubProposal } from '../models/ClubProposal.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { StudentForm } from '../models/StudentForm.js';
import { FormWishlist } from '../models/FormWishlist.js';
import { FormReminderLog } from '../models/FormReminderLog.js';
import { PasswordResetOtp } from '../models/PasswordResetOtp.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { ROLES, CLUB_POSITIONS } from '../utils/constants.js';

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
  console.log('\n======================================================');
  console.log('   UniVerse Master Enhancement Backend Test Suite    ');
  console.log('   Three Administrative Levels | Clubs | QR | OTP    ');
  console.log('   Collaborative Groups | Forms Wishlist & Reminders ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    ${err.message}\n`);
      failed++;
    }
  };

  try {
    await connectDB();

    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    const timestamp = Date.now();
    const testMainAdminEmail = `mainadmin_${timestamp}@universe.edu`;
    const testAdminEmail = `admin_${timestamp}@universe.edu`;
    const testStudent1Email = `student1_${timestamp}@universe.edu`;
    const testStudent2Email = `student2_${timestamp}@universe.edu`;
    const defaultPassword = 'TestPassword123!';

    console.log('--- Registering Test Users ---');
    const [regStudent1, regStudent2, regAdmin] = await Promise.all([
      request('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Student One',
          email: testStudent1Email,
          password: defaultPassword,
          confirmPassword: defaultPassword,
          department: 'Computer Science',
          academicYear: '3rd Year',
        },
      }),
      request('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Student Two',
          email: testStudent2Email,
          password: defaultPassword,
          confirmPassword: defaultPassword,
          department: 'Electrical Engineering',
          academicYear: '2nd Year',
        },
      }),
      request('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Standard Admin',
          email: testAdminEmail,
          password: defaultPassword,
          confirmPassword: defaultPassword,
          department: 'Administration',
          academicYear: 'Faculty',
        },
      }),
    ]);

    const student1Token = regStudent1.data.token;
    const student1Id = regStudent1.data.user._id;

    const student2Token = regStudent2.data.token;
    const student2Id = regStudent2.data.user._id;

    const mainAdminUser = await User.create({
      name: 'Main College Administrator',
      email: testMainAdminEmail,
      password: defaultPassword,
      role: ROLES.MAIN_ADMIN,
      department: 'Dean Office',
      academicYear: 'Faculty',
    });

    await User.findByIdAndUpdate(regAdmin.data.user._id, { role: ROLES.ADMIN });

    const [loginAdmin, loginMainAdmin] = await Promise.all([
      request('/api/auth/login', {
        method: 'POST',
        body: { email: testAdminEmail, password: defaultPassword },
      }),
      request('/api/auth/login', {
        method: 'POST',
        body: { email: testMainAdminEmail, password: defaultPassword },
      }),
    ]);

    const adminToken = loginAdmin.data.token;
    const mainAdminToken = loginMainAdmin.data.token;

    console.log('\n--- Section 1: Three Administrative Levels & Role Governance ---');

    await test('Level 1: Main Admin role exists and is detected properly', async () => {
      assert.equal(loginMainAdmin.data.user.role, ROLES.MAIN_ADMIN);
      assert.equal(loginAdmin.data.user.role, ROLES.ADMIN);
      assert.equal(regStudent1.data.user.role, ROLES.STUDENT);
    });

    await test('Ordinary Admin CANNOT promote users to admin (requires main_admin)', async () => {
      const res = await request(`/api/admin/users/${student1Id}/role`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { role: ROLES.ADMIN },
      });
      assert.equal(res.status, 403);
    });

    await test('Main Admin CAN promote student to admin', async () => {
      const res = await request(`/api/admin/users/${student1Id}/role`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${mainAdminToken}` },
        body: { role: ROLES.ADMIN },
      });
      assert.ok([200, 201].includes(res.status));
      assert.equal(res.data.user.role, ROLES.ADMIN);

      await User.findByIdAndUpdate(student1Id, { role: ROLES.STUDENT });
    });

    await test('Self-demotion of main_admin is blocked', async () => {
      const res = await request(`/api/admin/users/${mainAdminUser._id}/role`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${mainAdminToken}` },
        body: { role: ROLES.STUDENT },
      });
      assert.equal(res.status, 400);
    });

    console.log('\n--- Section 2: Groups, QR Invitations & Collaboration ---');

    let testGroupId;
    let inviteToken;

    await test('Student 1 creates a personal study group', async () => {
      const res = await request('/api/groups', {
        method: 'POST',
        headers: { Authorization: `Bearer ${student1Token}` },
        body: {
          name: `Algorithms Study Squad ${timestamp}`,
          shortDescription: 'Peer problem solving group',
          description: 'Focusing on dynamic programming and graph algorithms',
          category: 'Academic & Research',
          visibility: 'public',
        },
      });
      assert.equal(res.status, 201);
      assert.ok(res.data.group._id);
      testGroupId = res.data.group._id;
    });

    await test('Group Owner generates unique QR invitation token', async () => {
      const res = await request(`/api/groups/${testGroupId}/invitations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${student1Token}` },
        body: { maxUses: 50, expiresInDays: 7 },
      });
      assert.equal(res.status, 201);
      assert.ok(res.data.invitation.token);
      assert.ok(res.data.qrCodeDataUrl);
      inviteToken = res.data.invitation.token;
    });

    await test('Student 2 inspects group invitation details via QR token', async () => {
      const res = await request(`/api/groups/join/qr/${inviteToken}`);
      assert.ok([200, 201].includes(res.status));
      assert.equal(res.data.group._id, testGroupId);
      assert.equal(res.data.group.name, `Algorithms Study Squad ${timestamp}`);
    });

    await test('Student 2 joins group via QR token', async () => {
      const res = await request(`/api/groups/join/qr/${inviteToken}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${student2Token}` },
      });
      assert.ok([200, 201].includes(res.status));
      assert.equal(res.data.joined, true);

      const mem = await GroupMembership.findOne({ group: testGroupId, user: student2Id });
      assert.ok(mem);
    });

    let resourceId;
    await test('Student 1 uploads study notes to group resources', async () => {
      const res = await request(`/api/groups/${testGroupId}/resources`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${student1Token}` },
        body: {
          title: 'Graph Traversal Lecture Notes',
          description: 'BFS and DFS summary sheets with Python code',
          resourceType: 'notes',
          fileUrl: 'https://cdn.universe.edu/notes/graphs.pdf',
        },
      });
      assert.equal(res.status, 201);
      assert.ok(res.data.resource._id);
      resourceId = res.data.resource._id;
    });

    await test('Student 2 views group shared resources', async () => {
      const res = await request(`/api/groups/${testGroupId}/resources`, {
        headers: { Authorization: `Bearer ${student2Token}` },
      });
      assert.ok([200, 201].includes(res.status));
      assert.equal(res.data.resources.length, 1);
      assert.equal(res.data.resources[0].title, 'Graph Traversal Lecture Notes');
    });

    await test('Student 1 schedules timetable activity / study session', async () => {
      const startTime = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      const res = await request(`/api/groups/${testGroupId}/activities`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${student1Token}` },
        body: {
          title: 'CS201 DP Hack & Solve',
          description: 'Solving 5 DP problems together in Library 3B',
          activityType: 'study_session',
          startTime,
          location: 'Library Room 3B',
          meetingUrl: 'https://meet.google.com/xyz-abc',
        },
      });
      assert.equal(res.status, 201);
      assert.ok(res.data.activity._id);
    });

    await test('Student 2 updates personal group email preference', async () => {
      const res = await request(`/api/groups/${testGroupId}/email-preference`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${student2Token}` },
        body: { emailPreference: 'announcements_only' },
      });
      assert.ok([200, 201].includes(res.status));
      assert.equal(res.data.membership.emailPreference, 'announcements_only');
    });

    console.log('\n--- Section 3: Official College Clubs & Chartered Administration ---');

    let proposalId;
    let charteredClubId;

    await test('Student 1 submits charter proposal for Official College Club', async () => {
      const res = await request('/api/clubs/proposals', {
        method: 'POST',
        headers: { Authorization: `Bearer ${student1Token}` },
        body: {
          name: `UniVerse Robotics & Automation Club ${timestamp}`,
          tagline: 'Designing Autonomous Systems',
          description: 'Official student technical society for robotics engineering and UAV research.',
          category: 'Technical',
          facultyAdvisor: {
            name: 'Dr. Alan Turing',
            email: 'aturing@universe.edu',
            department: 'Robotics Engineering',
            designation: 'Professor & Head',
          },
          initialLeadership: [
            {
              role: CLUB_POSITIONS.SECRETARY_GENERAL,
              name: 'Student One',
              email: testStudent1Email,
            },
          ],
          plannedActivities: ['Autonomous drone obstacle course', 'Regional robotics summit'],
        },
      });
      assert.equal(res.status, 201);
      assert.ok(res.data.proposal._id);
      assert.equal(res.data.proposal.status, 'pending');
      proposalId = res.data.proposal._id;
    });

    await test('Ordinary Admin CANNOT approve club proposal (requires main_admin)', async () => {
      const res = await request(`/api/clubs/proposals/${proposalId}/review`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { action: 'approve' },
      });
      assert.equal(res.status, 403);
    });

    await test('Main Admin reviews and approves club proposal -> Charters College Club', async () => {
      const res = await request(`/api/clubs/proposals/${proposalId}/review`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${mainAdminToken}` },
        body: { action: 'approve', reviewNotes: 'Fully endorsed by Dean of Student Affairs' },
      });
      assert.ok([200, 201].includes(res.status));
      assert.equal(res.data.proposal.status, 'approved');
      assert.ok(res.data.club);
      charteredClubId = res.data.club._id;
    });

    await test('Club is listed in official college clubs directory', async () => {
      const res = await request('/api/clubs');
      assert.ok([200, 201].includes(res.status));
      const found = res.data.clubs.some((c) => c._id === charteredClubId);
      assert.ok(found);
    });

    await test('Student 2 joins official chartered club', async () => {
      const res = await request(`/api/clubs/${charteredClubId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${student2Token}` },
      });
      assert.ok([200, 201].includes(res.status));
      assert.ok(res.data.membership);
      assert.equal(res.data.membership.role, 'member');
    });

    await test('Main Admin appoints Student 2 to Club Leadership position', async () => {
      const res = await request(`/api/clubs/${charteredClubId}/members/${student2Id}/role`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${mainAdminToken}` },
        body: { role: CLUB_POSITIONS.JOINT_SECRETARY },
      });
      assert.ok([200, 201].includes(res.status));
      assert.equal(res.data.membership.position, CLUB_POSITIONS.JOINT_SECRETARY);
    });

    await test('Club leader creates official club event linked to college calendar', async () => {
      const eventDate = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
      const res = await request(`/api/clubs/${charteredClubId}/events`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${student1Token}` },
        body: {
          title: 'Robotics Autonomous Challenge 2026',
          description: 'Inter-department rover competition',
          category: 'Technical',
          date: eventDate,
          venue: 'Engineering Quad',
          capacity: 100,
        },
      });
      assert.equal(res.status, 201);
      assert.ok(res.data.event._id);
      assert.equal(res.data.event.isClubEvent, true);
      assert.equal(res.data.event.club.toString(), charteredClubId.toString());
    });

    console.log('\n--- Section 4: Forgot Password with Email OTP Verification ---');

    await test('Student requests password reset OTP via email', async () => {
      const res = await request('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: testStudent1Email },
      });
      assert.ok([200, 201].includes(res.status));
      assert.ok(res.data.message.includes('verification code'));

      const otpDoc = await PasswordResetOtp.findOne({ email: testStudent1Email.toLowerCase() });
      assert.ok(otpDoc);
      assert.ok(otpDoc.otpHash);
      assert.equal(otpDoc.isUsed, false);
    });

    let resetToken;
    await test('Verify OTP generates reset token', async () => {
      const plainOtp = '654321';
      const bcrypt = await import('bcryptjs');
      const otpHash = await bcrypt.default.hash(plainOtp, 10);
      await PasswordResetOtp.findOneAndUpdate(
        { email: testStudent1Email.toLowerCase() },
        { otpHash, expiresAt: new Date(Date.now() + 5 * 60 * 1000), attempts: 0, verified: false }
      );

      const res = await request('/api/auth/verify-otp', {
        method: 'POST',
        body: { email: testStudent1Email, otp: plainOtp },
      });
      assert.ok([200, 201].includes(res.status));
      assert.ok(res.data.resetToken);
      resetToken = res.data.resetToken;
    });

    const newSecretPassword = 'BrandNewPassword2026!';
    await test('Reset password with verified reset token succeeds', async () => {
      const res = await request('/api/auth/reset-password', {
        method: 'POST',
        body: {
          email: testStudent1Email,
          resetToken,
          newPassword: newSecretPassword,
        },
      });
      assert.ok([200, 201].includes(res.status));
    });

    await test('Login with new reset password succeeds', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: { email: testStudent1Email, password: newSecretPassword },
      });
      assert.ok([200, 201].includes(res.status));
      assert.ok(res.data.token);
    });

    console.log('\n--- Section 5: Campus Forms, Wishlist & Daily Deadline Reminders ---');

    let formId;
    await test('Admin publishes official campus opportunity form', async () => {
      const deadline = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(); 
      const res = await request('/api/forms', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          title: `Inter-College AI Hackathon 2026 ${timestamp}`,
          description: 'Compete for 10,000 in student research grants',
          category: 'Competition',
          deadline,
          linkUrl: 'https://forms.google.com/ai-hackathon-2026',
          department: 'Dean of Student Affairs',
          eligibility: 'All enrolled undergraduates',
        },
      });
      assert.equal(res.status, 201);
      assert.ok(res.data.form._id);
      formId = res.data.form._id;
    });

    await test('Student 2 adds opportunity form to wishlist', async () => {
      const res = await request(`/api/forms/${formId}/wishlist`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${student2Token}` },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.item.reminderEnabled, true);
    });

    await test('Trigger daily deadline reminder scan executes with database idempotency', async () => {
      const res1 = await request('/api/forms/reminders/trigger', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res1.status, 200);
      assert.ok(res1.data.remindersSent >= 1);

      const res2 = await request('/api/forms/reminders/trigger', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res2.status, 200);
      assert.equal(res2.data.remindersSent, 0); 
    });

    console.log('\n--- Section 6: Independent In-App & Email Preferences ---');

    await test('Student updates independent notification and email preferences', async () => {
      const res = await request('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${student2Token}` },
        body: {
          announcements: true,
          emailAnnouncements: false,
          emailFormReminders: true,
          emailClubUpdates: true,
        },
      });
      assert.ok([200, 201].includes(res.status));
      assert.equal(res.data.preferences.announcements, true);
      assert.equal(res.data.preferences.emailAnnouncements, false);
      assert.equal(res.data.preferences.emailFormReminders, true);
    });

    console.log('\n======================================================');
    console.log(`Enhancement Test Suite Complete: ${passed} passed, ${failed} failed.`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    if (server) server.close();
    await closeDB();
  }
};

runAllTests();