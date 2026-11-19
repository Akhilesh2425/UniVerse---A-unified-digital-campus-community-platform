import dotenv from 'dotenv';
dotenv.config();
if (!process.env.MONGO_URI) {
  dotenv.config({ path: './server/.env' });
}

import mongoose from 'mongoose';
import app from '../app.js';
import http from 'http';
import { User } from '../models/User.js';
import { CampusIssue } from '../models/CampusIssue.js';
import { IssueSupport } from '../models/IssueSupport.js';
import { IssueComment } from '../models/IssueComment.js';
import { IssueStatusHistory } from '../models/IssueStatusHistory.js';
import { IssueAssignmentHistory } from '../models/IssueAssignmentHistory.js';
import { IssueUpdate } from '../models/IssueUpdate.js';
import { IssueFeedback } from '../models/IssueFeedback.js';
import { ReopenRequest } from '../models/ReopenRequest.js';
import { connectDB, closeDB } from '../config/db.js';

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

const runModule5Tests = async () => {
  console.log('\n========================================================');
  console.log('   UniVerse Module 5: Campus Issues & Resolution Tests');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (details) console.error(`         Details: ${details}`);
      failed++;
    }
  };

  try {
    await connectDB();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`[Test Suite] Test server running on ${baseUrl}\n`);

    const timestamp = Date.now();
    const student1Email = `issue_student1_${timestamp}@universe.edu`;
    const student2Email = `issue_student2_${timestamp}@universe.edu`;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@universe.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecure2026!';

    const s1Res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Aarav Sharma',
        email: student1Email,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        department: 'Computer Science',
        academicYear: '3rd Year',
      },
    });
    assert(s1Res.status === 201, 'Student 1 registration succeeds (201)');
    const token1 = s1Res.data.token;
    const auth1Header = { Authorization: `Bearer ${token1}` };

    const s2Res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Ananya Verma',
        email: student2Email,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        department: 'Electrical Engineering',
        academicYear: '2nd Year',
      },
    });
    assert(s2Res.status === 201, 'Student 2 registration succeeds (201)');
    const token2 = s2Res.data.token;
    const auth2Header = { Authorization: `Bearer ${token2}` };

    const adminRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: adminEmail,
        password: adminPassword,
      },
    });
    assert(adminRes.status === 200, 'Admin login succeeds (200)');
    const adminToken = adminRes.data.token;
    const adminHeader = { Authorization: `Bearer ${adminToken}` };

    console.log('\n--- Testing Issue Creation ---');

    const unauthCreate = await request('/api/issues', {
      method: 'POST',
      body: { title: 'Test issue without auth' },
    });
    assert(unauthCreate.status === 401, 'Unauthenticated issue creation rejected (401)');

    const publicIssuePayload = {
      title: 'Broken Projector in Lecture Hall 204',
      description:
        'The ceiling HDMI projector flickers continuously and turns off after 10 minutes of lecture presentation.',
      category: 'Classroom & Laboratory',
      location: 'Academic Complex Block B',
      building: 'Block B',
      room: 'LH 204',
      priority: 'high',
      visibility: 'public',
      isAnonymousToPublic: false,
    };

    const pubRes = await request('/api/issues', {
      method: 'POST',
      headers: auth1Header,
      body: publicIssuePayload,
    });

    assert(pubRes.status === 201, 'Student 1 creates public issue (201)');
    const publicIssue = pubRes.data.issue;
    assert(
      publicIssue && publicIssue.referenceId.startsWith('ISS-'),
      'Unique reference ID generated (starts with ISS-)'
    );
    assert(
      publicIssue.status === 'submitted',
      'Initial issue status is "submitted"'
    );
    assert(
      publicIssue.priority === 'high',
      'Priority stored correctly as "high"'
    );

    const privateIssuePayload = {
      title: 'Hostel 4 Corridor Light Malfunction',
      description:
        'Second floor wing C corridor lights have been out, creating safety concerns at night.',
      category: 'Hostel Facilities',
      location: 'Boys Hostel 4',
      building: 'Hostel 4',
      room: 'Wing C Floor 2',
      priority: 'medium',
      visibility: 'private',
    };

    const privRes = await request('/api/issues', {
      method: 'POST',
      headers: auth1Header,
      body: privateIssuePayload,
    });

    assert(privRes.status === 201, 'Student 1 creates private issue (201)');
    const privateIssue = privRes.data.issue;

    console.log('\n--- Testing Public Discovery & Privacy Isolation ---');

    const feedRes = await request('/api/issues?sort=newest');
    assert(feedRes.status === 200, 'GET /api/issues public feed returns 200');
    assert(Array.isArray(feedRes.data.issues), 'Issues feed returns an array');

    const publicFound = feedRes.data.issues.some(
      (i) => i.referenceId === publicIssue.referenceId
    );
    const privateLeaked = feedRes.data.issues.some(
      (i) => i.referenceId === privateIssue.referenceId
    );

    assert(publicFound, 'Public issue is visible in public discovery feed');
    assert(
      !privateLeaked,
      'SECURITY: Private issue NEVER leaks into public discovery feed'
    );

    const searchRefRes = await request(
      `/api/issues?search=${encodeURIComponent(publicIssue.referenceId)}`
    );
    assert(
      searchRefRes.data.issues.length >= 1 &&
        searchRefRes.data.issues[0].referenceId === publicIssue.referenceId,
      'Search by Reference ID works accurately'
    );

    console.log('\n--- Testing Details & Privacy Authorization ---');

    const s1PrivDetail = await request(`/api/issues/${privateIssue._id}`, {
      headers: auth1Header,
    });
    assert(
      s1PrivDetail.status === 200,
      'Reporter can access their own private issue (200)'
    );

    const s2PrivDetail = await request(`/api/issues/${privateIssue._id}`, {
      headers: auth2Header,
    });
    assert(
      s2PrivDetail.status === 403,
      'SECURITY: Other student blocked from private issue (403 Forbidden)'
    );

    const adminPrivDetail = await request(`/api/issues/${privateIssue._id}`, {
      headers: adminHeader,
    });
    assert(
      adminPrivDetail.status === 200,
      'Administrator authorized to access private issue (200)'
    );

    console.log('\n--- Testing Community Support System ---');

    const selfSupport = await request(
      `/api/issues/${publicIssue._id}/support`,
      {
        method: 'POST',
        headers: auth1Header,
      }
    );
    assert(
      selfSupport.status === 400,
      'Reporter cannot support their own issue (400 Bad Request)'
    );

    const s2Support = await request(
      `/api/issues/${publicIssue._id}/support`,
      {
        method: 'POST',
        headers: auth2Header,
      }
    );
    assert(s2Support.status === 200, 'Student 2 supports public issue (200)');
    assert(s2Support.data.supportCount === 1, 'supportCount incremented to 1');

    const dupSupport = await request(
      `/api/issues/${publicIssue._id}/support`,
      {
        method: 'POST',
        headers: auth2Header,
      }
    );
    assert(
      dupSupport.status === 200 && dupSupport.data.supportCount === 1,
      'Duplicate support prevented and count not inflated'
    );

    const removeSup = await request(
      `/api/issues/${publicIssue._id}/support`,
      {
        method: 'DELETE',
        headers: auth2Header,
      }
    );
    assert(
      removeSup.status === 200 && removeSup.data.supportCount === 0,
      'Support removed and supportCount decremented to 0'
    );

    console.log('\n--- Testing Issue Comments ---');

    const commentRes = await request(
      `/api/issues/${publicIssue._id}/comments`,
      {
        method: 'POST',
        headers: auth2Header,
        body: {
          content: 'Confirmed, happened today in CS201 class as well.',
        },
      }
    );
    assert(commentRes.status === 201, 'Student 2 adds comment to public issue (201)');
    const commentId = commentRes.data.comment._id;

    const updatedPubIssue = await request(`/api/issues/${publicIssue._id}`);
    assert(
      updatedPubIssue.data.issue.commentCount === 1,
      'commentCount atomically incremented to 1'
    );

    const editComment = await request(
      `/api/issues/${publicIssue._id}/comments/${commentId}`,
      {
        method: 'PATCH',
        headers: auth2Header,
        body: { content: 'Confirmed, happened today in both CS201 and CS204.' },
      }
    );
    assert(editComment.status === 200, 'Author can update comment (200)');

    const unauthEdit = await request(
      `/api/issues/${publicIssue._id}/comments/${commentId}`,
      {
        method: 'PATCH',
        headers: auth1Header,
        body: { content: 'Malicious modification attempt' },
      }
    );
    assert(
      unauthEdit.status === 403,
      'Non-author blocked from editing comment (403 Forbidden)'
    );

    console.log('\n--- Testing My Reports Student Tracking ---');

    const myReportsRes = await request('/api/issues/my-reports', {
      headers: auth1Header,
    });
    assert(myReportsRes.status === 200, 'GET /api/issues/my-reports returns 200');
    assert(
      myReportsRes.data.count >= 2,
      'My Reports includes both public and private authored reports'
    );

    console.log('\n--- Testing Admin Issue Lifecycle & Workflow ---');

    const studentBlocked = await request('/api/admin/issues', {
      headers: auth1Header,
    });
    assert(
      studentBlocked.status === 403,
      'Regular student blocked from /api/admin/issues (403 Forbidden)'
    );

    const statsRes = await request('/api/admin/issues/statistics', {
      headers: adminHeader,
    });
    assert(statsRes.status === 200, 'Admin can fetch live statistics (200)');
    assert(
      statsRes.data.statistics.total >= 2,
      'Live stats reflect real MongoDB counts'
    );

    const reviewRes = await request(
      `/api/admin/issues/${publicIssue._id}/status`,
      {
        method: 'PATCH',
        headers: adminHeader,
        body: { status: 'under_review', explanation: 'Examined by campus IT team.' },
      }
    );
    assert(
      reviewRes.status === 200 && reviewRes.data.issue.status === 'under_review',
      'Admin transitions status to "under_review" (200)'
    );

    const approveRes = await request(
      `/api/admin/issues/${publicIssue._id}/status`,
      {
        method: 'PATCH',
        headers: adminHeader,
        body: { status: 'approved', explanation: 'Approved for hardware inspection.' },
      }
    );
    assert(
      approveRes.status === 200 && approveRes.data.issue.status === 'approved',
      'Admin transitions status to "approved" (200)'
    );

    const assignRes = await request(
      `/api/admin/issues/${publicIssue._id}/assignment`,
      {
        method: 'PATCH',
        headers: adminHeader,
        body: {
          department: 'IT Support',
          targetResolutionDate: new Date(Date.now() + 86400000 * 3),
          instructions: 'Check ceiling HDMI cable coupler and replace if faulty.',
        },
      }
    );
    assert(
      assignRes.status === 200 &&
        assignRes.data.issue.assignedDepartment === 'IT Support',
      'Admin assigns department "IT Support" (200)'
    );

    const inProgressRes = await request(
      `/api/admin/issues/${publicIssue._id}/status`,
      {
        method: 'PATCH',
        headers: adminHeader,
        body: { status: 'in_progress', explanation: 'Technician on site in LH 204.' },
      }
    );
    assert(
      inProgressRes.status === 200 &&
        inProgressRes.data.issue.status === 'in_progress',
      'Status transitions to "in_progress"'
    );

    const internalNoteRes = await request(
      `/api/admin/issues/${publicIssue._id}/updates`,
      {
        method: 'POST',
        headers: adminHeader,
        body: {
          content: 'Confidential: Replacement lamp unit ordered under warranty PO-9481.',
          visibility: 'internal',
        },
      }
    );
    assert(
      internalNoteRes.status === 201,
      'Admin creates internal administrative note (201)'
    );

    const studentCheckDetail = await request(`/api/issues/${publicIssue._id}`, {
      headers: auth1Header,
    });
    const hasInternalNote = studentCheckDetail.data.issue.updates.some(
      (u) => u.visibility === 'internal'
    );
    assert(
      !hasInternalNote,
      'SECURITY: Internal administrative notes NEVER exposed to students'
    );

    const resolveRes = await request(
      `/api/admin/issues/${publicIssue._id}/resolve`,
      {
        method: 'POST',
        headers: adminHeader,
        body: {
          summary: 'Replaced faulty HDMI splitter and power supply cord.',
          actionTaken:
            'Technician replaced aging 15m ceiling cable and recalibrated projector lamp timer.',
          evidenceUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
        },
      }
    );
    assert(
      resolveRes.status === 200 &&
        resolveRes.data.issue.status === 'resolved',
      'Admin marks issue resolved with required summary and action taken (200)'
    );

    console.log('\n--- Testing Student Feedback & Reopen Workflow ---');

    const nonReporterFeedback = await request(
      `/api/issues/${publicIssue._id}/feedback`,
      {
        method: 'POST',
        headers: auth2Header,
        body: { rating: 5, wasResolved: true },
      }
    );
    assert(
      nonReporterFeedback.status === 403,
      'Non-reporter blocked from submitting feedback (403 Forbidden)'
    );

    const reporterFeedback = await request(
      `/api/issues/${publicIssue._id}/feedback`,
      {
        method: 'POST',
        headers: auth1Header,
        body: {
          rating: 5,
          feedback: 'Tested today during evening lab, projector worked smoothly with zero flicker.',
          wasResolved: true,
        },
      }
    );
    assert(
      reporterFeedback.status === 200,
      'Reporter submits 5-star resolution feedback (200)'
    );

    const closeRes = await request(`/api/admin/issues/${publicIssue._id}/close`, {
      method: 'POST',
      headers: adminHeader,
      body: { explanation: 'Feedback received with 5-star rating. Closing report.' },
    });
    assert(
      closeRes.status === 200 && closeRes.data.issue.status === 'closed',
      'Admin closes resolved issue (200)'
    );

    const reopenReqRes = await request(
      `/api/issues/${publicIssue._id}/reopen-requests`,
      {
        method: 'POST',
        headers: auth1Header,
        body: {
          reason: 'Flickering started again when connecting via USB-C adapter.',
        },
      }
    );
    assert(
      reopenReqRes.status === 201,
      'Reporter files reopen request with reason (201)'
    );
    const reopenReqId = reopenReqRes.data.reopenRequest._id;

    const reviewReopen = await request(
      `/api/admin/issues/${publicIssue._id}/reopen-requests/${reopenReqId}`,
      {
        method: 'PATCH',
        headers: adminHeader,
        body: {
          decision: 'approved',
          reviewExplanation: 'USB-C adapter compatibility issue confirmed. Scheduling inspection.',
        },
      }
    );
    assert(
      reviewReopen.status === 200 && reviewReopen.data.issueStatus === 'reopened',
      'Admin approves reopen request and issue status transitions to "reopened" (200)'
    );

    await CampusIssue.deleteMany({ _id: { $in: [publicIssue._id, privateIssue._id] } });
    await IssueSupport.deleteMany({ issue: { $in: [publicIssue._id, privateIssue._id] } });
    await IssueComment.deleteMany({ issue: { $in: [publicIssue._id, privateIssue._id] } });
    await IssueStatusHistory.deleteMany({ issue: { $in: [publicIssue._id, privateIssue._id] } });
    await IssueAssignmentHistory.deleteMany({ issue: { $in: [publicIssue._id, privateIssue._id] } });
    await IssueUpdate.deleteMany({ issue: { $in: [publicIssue._id, privateIssue._id] } });
    await IssueFeedback.deleteMany({ issue: { $in: [publicIssue._id, privateIssue._id] } });
    await ReopenRequest.deleteMany({ issue: { $in: [publicIssue._id, privateIssue._id] } });
    await User.deleteMany({ email: { $in: [student1Email, student2Email] } });

    console.log('\n--- Running Regression Checks on Modules 1 to 4 ---');

    const healthCheck = await request('/api/health');
    assert(
      healthCheck.status === 200 && healthCheck.data.status === 'healthy',
      'Module 1/Core: Health check is healthy (200)'
    );

    const eventsCheck = await request('/api/events');
    assert(eventsCheck.status === 200, 'Module 1: GET /api/events returns 200');

    const announcementsCheck = await request('/api/announcements');
    assert(announcementsCheck.status === 200, 'Module 2: GET /api/announcements returns 200');

    const groupsCheck = await request('/api/groups');
    assert(groupsCheck.status === 200, 'Module 3: GET /api/groups returns 200');

    const discussionsCheck = await request('/api/discussions');
    assert(discussionsCheck.status === 200, 'Module 4: GET /api/discussions returns 200');

    console.log('\n========================================================');
    console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');

    server.close();
    await closeDB();

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    if (server) server.close();
    await closeDB();
    process.exit(1);
  }
};

runModule5Tests();
