import dotenv from 'dotenv';
dotenv.config();
if (!process.env.MONGO_URI) {
  dotenv.config({ path: './server/.env' });
}

import mongoose from 'mongoose';
import app from '../app.js';
import http from 'http';
import { User } from '../models/User.js';
import { DiscussionPost } from '../models/DiscussionPost.js';
import { DiscussionComment } from '../models/DiscussionComment.js';
import { DiscussionVote } from '../models/DiscussionVote.js';
import { SavedDiscussion } from '../models/SavedDiscussion.js';
import { ContentReport } from '../models/ContentReport.js';
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

const runModule4Tests = async () => {
  console.log('\n========================================================');
  console.log('   UniVerse Module 4: Discussions & Content Test Suite');
  console.log('========================================================\n');

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
    await connectDB();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`[Test Suite] Test server running on ${baseUrl}\n`);

    const testEmail1 = `mod4_student1_${Date.now()}@universe.edu`;
    const testEmail2 = `mod4_student2_${Date.now()}@universe.edu`;
    const adminEmail = `mod4_admin_${Date.now()}@universe.edu`;
    const password = 'TestSecure2026!';

    const regRes1 = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Discussion Tester One',
        email: testEmail1,
        password,
        confirmPassword: password,
        department: 'Computer Science',
        academicYear: '3rd Year',
      },
    });
    assert(regRes1.status === 201, 'Student 1 registration succeeds (201)');
    const token1 = regRes1.data.token;
    const authHeaders1 = { Authorization: `Bearer ${token1}` };

    const regRes2 = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Discussion Tester Two',
        email: testEmail2,
        password,
        confirmPassword: password,
        department: 'Electrical Engineering',
        academicYear: '2nd Year',
      },
    });
    assert(regRes2.status === 201, 'Student 2 registration succeeds (201)');
    const token2 = regRes2.data.token;
    const authHeaders2 = { Authorization: `Bearer ${token2}` };

    const adminUser = await User.create({
      name: 'Moderation Admin',
      email: adminEmail,
      password,
      role: 'admin',
      department: 'Student Welfare',
      academicYear: 'Staff',
    });

    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password },
    });
    assert(adminLoginRes.status === 200, 'Admin login succeeds (200)');
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    const feedRes = await request('/api/discussions');
    assert(feedRes.status === 200, 'GET /api/discussions public feed returns 200');
    assert(Array.isArray(feedRes.data.discussions), 'Discussions feed is an array');

    const createRes = await request('/api/discussions', {
      method: 'POST',
      headers: authHeaders1,
      body: {
        title: 'How to optimize MongoDB compound indexes for complex feed queries?',
        content: 'We have a high-throughput social feed with multiple sorting tabs (trending, top, newest). Should we use sparse indexes or compound index prefixes?',
        type: 'question',
        category: 'Programming & DSA',
        tags: ['mongodb', 'database', 'indexing', 'performance'],
        resourceUrl: 'https://www.mongodb.com/docs/manual/indexes/',
      },
    });
    assert(createRes.status === 201, 'POST /api/discussions creates Question post (201)');
    const createdPost = createRes.data.discussion;
    const postId = createdPost.id || createdPost._id;
    assert(createdPost.type === 'question', 'Post type is question');
    assert(createdPost.author.name === 'Discussion Tester One', 'Post author properly derived from auth token');

    const detailRes = await request(`/api/discussions/${postId}`, {
      headers: authHeaders1,
    });
    assert(detailRes.status === 200, 'GET /api/discussions/:id returns post detail (200)');
    assert(detailRes.data.discussion.views >= 1, 'Views counter atomically increments on retrieval');
    assert(detailRes.data.discussion.isAuthor === true, 'isAuthor flag is true for creator');

    const commentRes = await request(`/api/discussions/${postId}/comments`, {
      method: 'POST',
      headers: authHeaders2,
      body: {
        content: 'Always leverage the Equality, Sort, Range (ESR) rule! Put exact equality filters first, then sorting fields, and finally range filters.',
      },
    });
    assert(commentRes.status === 201, 'POST /api/discussions/:id/comments adds an answer (201)');
    const commentId = commentRes.data.comment.id || commentRes.data.comment._id;

    const postAfterComment = await request(`/api/discussions/${postId}`);
    assert(postAfterComment.data.discussion.commentCount === 1, 'Post commentCount atomically incremented to 1');

    const unauthAccept = await request(`/api/discussions/${postId}/accepted-answer`, {
      method: 'PATCH',
      headers: authHeaders2,
      body: { commentId },
    });
    assert(unauthAccept.status === 403, 'Non-owner cannot mark answer as accepted (403 Forbidden)');

    const authAccept = await request(`/api/discussions/${postId}/accepted-answer`, {
      method: 'PATCH',
      headers: authHeaders1,
      body: { commentId },
    });
    assert(authAccept.status === 200, 'Question owner can mark answer as accepted (200)');
    assert(authAccept.data.isResolved === true, 'Post marked resolved after answer acceptance');

    const voteRes = await request(`/api/discussions/${postId}/vote`, {
      method: 'POST',
      headers: authHeaders2,
    });
    assert(voteRes.status === 200, 'POST /api/discussions/:id/vote records upvote (200)');
    assert(voteRes.data.hasUpvoted === true, 'hasUpvoted returns true');
    assert(voteRes.data.upvoteCount === 1, 'upvoteCount increments to 1');

    const repeatVote = await request(`/api/discussions/${postId}/vote`, {
      method: 'POST',
      headers: authHeaders2,
    });
    assert(repeatVote.status === 200 && repeatVote.data.upvoteCount === 1, 'Duplicate vote does not inflate upvote count');

    const removeVote = await request(`/api/discussions/${postId}/vote`, {
      method: 'DELETE',
      headers: authHeaders2,
    });
    assert(removeVote.status === 200, 'DELETE /api/discussions/:id/vote removes upvote (200)');
    assert(removeVote.data.hasUpvoted === false, 'hasUpvoted returns false');
    assert(removeVote.data.upvoteCount === 0, 'upvoteCount decrements to 0');

    const saveRes = await request(`/api/discussions/${postId}/save`, {
      method: 'POST',
      headers: authHeaders2,
    });
    assert(saveRes.status === 200, 'POST /api/discussions/:id/save bookmarks post (200)');

    const mySaved = await request('/api/discussions/saved', {
      headers: authHeaders2,
    });
    assert(mySaved.status === 200, 'GET /api/discussions/saved returns user bookmarks');
    assert(mySaved.data.discussions.some((d) => (d.id || d._id) === postId), 'Saved list contains bookmarked post');

    const myPosts = await request('/api/discussions/my-posts', {
      headers: authHeaders1,
    });
    assert(myPosts.status === 200, 'GET /api/discussions/my-posts returns authored posts');
    assert(myPosts.data.discussions.some((d) => (d.id || d._id) === postId), 'My posts list contains created post');

    const reportRes = await request(`/api/discussions/${postId}/report`, {
      method: 'POST',
      headers: authHeaders2,
      body: {
        reason: 'Spam',
        details: 'Automated test report verification',
      },
    });
    assert(reportRes.status === 201, 'POST /api/discussions/:id/report submits report (201)');

    const studentModCheck = await request('/api/moderation/reports', {
      headers: authHeaders1,
    });
    assert(studentModCheck.status === 403, 'Regular student cannot access moderation queue (403)');

    const adminModCheck = await request('/api/moderation/reports', {
      headers: adminHeaders,
    });
    assert(adminModCheck.status === 200, 'Admin can access moderation queue (200)');
    const reports = adminModCheck.data.reports || [];
    const createdReport = reports.find((r) => r.targetId.toString() === postId.toString());
    assert(!!createdReport, 'Report appears in admin moderation queue');

    if (createdReport) {
      const resolveRes = await request(`/api/moderation/reports/${createdReport.id || createdReport._id}`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: {
          status: 'dismissed',
          resolution: 'dismissed',
          resolutionNotes: 'Verified as valid technical discussion',
        },
      });
      assert(resolveRes.status === 200, 'Admin resolves moderation report (200)');
    }

    const updateRes = await request(`/api/discussions/${postId}`, {
      method: 'PATCH',
      headers: authHeaders1,
      body: {
        title: 'How to optimize MongoDB compound indexes for complex feed queries? (Updated)',
      },
    });
    assert(updateRes.status === 200, 'PATCH /api/discussions/:id updates post (200)');

    const deleteRes = await request(`/api/discussions/${postId}`, {
      method: 'DELETE',
      headers: authHeaders1,
    });
    assert(deleteRes.status === 200, 'DELETE /api/discussions/:id deletes post (200)');

    const remainingComments = await DiscussionComment.countDocuments({ post: postId });
    const remainingVotes = await DiscussionVote.countDocuments({ post: postId });
    const remainingSaved = await SavedDiscussion.countDocuments({ post: postId });
    assert(remainingComments === 0, 'Associated comments cascade deleted');
    assert(remainingVotes === 0, 'Associated votes cascade deleted');
    assert(remainingSaved === 0, 'Associated saved bookmarks cascade deleted');

    await Promise.all([
      User.deleteMany({ _id: { $in: [regRes1.data.user._id, regRes2.data.user._id, adminUser._id] } }),
      ContentReport.deleteMany({ reporter: { $in: [regRes1.data.user._id, regRes2.data.user._id] } }),
    ]);

    console.log('\n--- Running Regression Checks on Modules 1, 2, and 3 ---');
    const healthCheck = await request('/api/health');
    assert(healthCheck.status === 200 && healthCheck.data.status === 'healthy', 'Module 1/Core: Health check is healthy (200)');

    const eventsCheck = await request('/api/events');
    assert(eventsCheck.status === 200, 'Module 1: GET /api/events returns 200');

    const announcementsCheck = await request('/api/announcements');
    assert(announcementsCheck.status === 200, 'Module 2: GET /api/announcements returns 200');

    const groupsCheck = await request('/api/groups');
    assert(groupsCheck.status === 200, 'Module 3: GET /api/groups returns 200');

    console.log('\n========================================================');
    console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');

    server.close();
    await closeDB();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error during test run:', err);
    if (server) server.close();
    await closeDB();
    process.exit(1);
  }
};

runModule4Tests();
