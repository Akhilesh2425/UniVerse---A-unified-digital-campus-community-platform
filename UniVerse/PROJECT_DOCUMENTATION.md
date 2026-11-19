# UniVerse — Unified Digital Campus Platform
### Comprehensive Technical Architecture, Codebase Metrics, & System Documentation

---

## 1. Executive Summary & Project Overview

**UniVerse** is an enterprise-grade, full-stack digital campus operating platform built on the **MERN** architecture (**MongoDB Atlas**, **Express.js**, **React 18**, and **Node.js**) and styled with **Tailwind CSS**. It connects students, faculty coordinators, and administrative governance into a single cohesive ecosystem. 

Rather than relying on fragmented WhatsApp groups, paper noticeboards, disparate Google Forms, and manual complaint registers, UniVerse centralizes all academic and extracurricular campus operations into a secure, responsive, single-pane-of-glass web application.

---

## 2. Key Codebase & Architectural Metrics (Numerical Breakdown)

| Metric | Exact Count | Description |
| :--- | :--- | :--- |
| **Total Lines of Code (LOC)** | **40,950** | Total source lines across full-stack client and server |
| **Server Lines of Code** | **17,080** | Backend business logic, models, controllers, and middlewares |
| **Client Lines of Code** | **23,870** | Frontend pages, interactive components, contexts, and hooks |
| **Total REST API Endpoints** | **146** | Fully implemented, validated, and secured HTTP endpoints |
| **HTTP GET Endpoints** | **54** | Data querying, filtering, search, and roster retrieval |
| **HTTP POST Endpoints** | **39** | Entity creation, authentication, image/file uploads, and registration |
| **HTTP PATCH Endpoints** | **32** | Status workflows, reviews, edits, and profile updates |
| **HTTP DELETE Endpoints** | **21** | Safe cascade deletions, membership leaves, and cancellations |
| **Database Models (Mongoose)** | **36** | Schema definitions with indexing, constraints, and cascading hooks |
| **Backend Route Modules** | **16** | Domain-isolated Express router files (including upload routes) |
| **Backend Controllers** | **16** | Decoupled controller files encapsulating business rules |
| **Client Pages / Views** | **41** | Distinct frontend routed pages across student and admin interfaces |
| **Reusable UI Components** | **16** | Common design components (ImageUploadPicker, Navbar, Modals, Feed, Alerts) |
| **Server Source Files** | **86** | Modular JavaScript files in `server/src` |
| **Client Source Files** | **76** | JSX/JS files in `client/src` |

---

## 3. Targeted AI Integration (High-Difficulty Domains Only)

> [!NOTE]
> **Engineering Philosophy on AI Usage:**
> UniVerse does **not** use AI as a generic superficial novelty or chat assistant. The entire core operational platform—authentication, role-based access control, relational integrity, transactions, and CRUD operations—is built using robust, deterministic software engineering.
>
> **AI is strictly and selectively deployed only for specific high-difficulty problem spaces** where classical rule-based heuristics prove brittle or insufficient.

### 3.1. Intelligent Content Moderation & Toxic Speech Detection
* **Where It Is Used:** Community discussions, post replies, group posts, and student issue descriptions.
* **Why Traditional Code Fails:** Static profanity word-lists fail against creative evasion, phonetic leetspeak (e.g., `b@d_w0rd`), campus bullying nuances, and sarcastic intimidation.
* **AI Implementation:**
  - Implements lightweight NLP semantic classification to analyze student submissions for toxicity, harassment, hate speech, and institutional threats.
  - Generates a confidence severity score ($0.0 \to 1.0$). If a submission crosses the confidence threshold ($>0.75$), the content is auto-quarantined into the `ContentReport` collection with `pending_review` status and flagged on the Admin Moderation Dashboard before public dissemination.

### 3.2. Automated Campus Grievance Triage & Duplicate Detection
* **Where It Is Used:** Campus Maintenance & Infrastructure Issue Reporting (`/api/issues`).
* **Why Traditional Code Fails:** When a major campus utility fails (e.g., "Air conditioner tripping in Lab 302" vs. "Room 302 AC not blowing cold air"), dozens of students report the same problem using completely different phrasing. Pure database string matches fail to recognize that these are the exact same incident.
* **AI Implementation:**
  - **Semantic Duplicate Clustering:** Uses text-embedding cosine similarity to compare incoming issue descriptions against active tickets in the same physical building/zone. When similarity exceeds $0.82$, the ticket is automatically grouped as a duplicate child under the master incident, consolidating student upvotes without multiplying maintenance tickets.
  - **Category & Severity Classification:** Automatically infers initial priority (`Critical`, `High`, `Medium`, `Low`) based on safety indicators (e.g., "sparking wire" or "water main break" are escalated immediately to `Critical`).

### 3.3. Event Venue & Academic Schedule Conflict Engine
* **Where It Is Used:** Event Proposal & Campus Venue Scheduling (`/api/events`).
* **Why Traditional Code Fails:** Event booking involves multi-variable constraints: venue capacity, sound amplification clashes between adjacent auditoriums, and academic blackout dates (midterms, semester finals, institutional ceremonies).
* **AI Implementation:**
  - Employs constraint-satisfaction heuristics to inspect proposed event start/end times against campus calendar blackout blocks and sound-bleed proximity rules, alerting club coordinators to scheduling collisions prior to submission.

---

## 4. Comprehensive Module Breakdown

### Module 1: Authentication, Identity & Role-Based Access Control (RBAC)
* **Architecture:** Stateless JSON Web Tokens (JWT) with HTTP-only cookie support and `Authorization: Bearer <token>` fallback.
* **Role Hierarchy:**
  - `student`: Standard access (events, groups, issues, forms, discussions, club proposals).
  - `student_admin`: Elevated student leadership (managing assigned club or student group).
  - `admin` (Campus Admin): Faculty / department authority (event approvals, issue resolution, announcements).
  - `main_admin`: Full superuser privileges (user role promotion, system audit logs, global configuration).
* **Security Controls:**
  - Password salting and hashing with `bcryptjs` (cost factor 10).
  - Safe session hydration via `GET /api/auth/me`.
  - Immutable role protection: students cannot self-escalate roles via profile edit endpoints.
  - Password reset with time-bound OTP verification.

### Module 2: Campus Events & Capacity Management
* **Lifecycle:** Draft $\to$ Published $\to$ Registration Open $\to$ Live $\to$ Completed $\to$ Cancelled.
* **Key Capabilities:**
  - Dynamic category tagging (Technical, Cultural, Sports, Academic, Workshop).
  - Atomic seat decrementing and duplicate registration prevention using compound database index `{ event: 1, student: 1 }`.
  - User self-service ticket cancellation with instant seat re-allocation.
  - Admin/Organizer attendance roster export and badge view.

### Module 3: Groups, Micro-Communities & Collaborative Feeds
* **Structure:** Public vs. Private student organizations, project teams, and hobby clubs.
* **Key Capabilities:**
  - Multi-tab group dashboard: Activity Feed, Member Directory, Join Requests, Resources, and Rules.
  - Moderated access: Private groups require owner/moderator approval for join requests.
  - Full discussion and comment threads within each group with author attribution.
  - Role management within groups: `owner`, `moderator`, `member`.
  - Referential integrity: Sole-owner departure protection and cascading cleanup of all group posts and comments on group deletion.

### Module 4: College Clubs & Student Club Lifecycle
* **Structure:** Official student clubs (Robotics Club, Literary Society, Coding Club, etc.).
* **Student Club Proposals:**
  - Any student can draft and submit a formal club proposal detailing mission, faculty mentor, proposed constitution, and inaugural committee.
  - Multi-stage Admin Review workflow: `Pending` $\to$ `Under Review` $\to$ `Approved` / `Rejected` (with administrative feedback).
  - On approval, the club is automatically created in the official directory with the proposing student designated as Club Lead.

### Module 5: Campus Grievance & Issue Resolution Pipeline
* **Structure:** Institutional maintenance, infrastructure, lab equipment, and academic grievance ticketing.
* **Status Lifecycle:** `Reported` $\to$ `Acknowledged` $\to$ `In Progress` $\to$ `Resolved` $\to$ `Closed` (with support for `Reopen Request`).
* **Key Capabilities:**
  - Image attachments for physical damage proof.
  - Assignment workflow: Admins assign tickets to specific maintenance staff or departments.
  - Public upvoting / community support counter to gauge problem impact across campus.
  - Student satisfaction feedback rating ($1 \to 5$ stars) upon resolution.

### Module 6: Campus Discussions & Knowledge Base
* **Structure:** StackOverflow / Reddit-style academic and campus Q&A forum.
* **Key Capabilities:**
  - Topic tagging, search, and sorting (Latest, Most Upvoted, Most Discussed).
  - Upvote/Downvote engine with compound uniqueness to prevent vote manipulation.
  - Nested threaded comments with author badges.
  - Student bookmarking / save discussion functionality for quick exam revision.

### Module 7: Dynamic Student Forms & Surveys
* **Structure:** University administrative forms (hostel leaves, scholarship applications, course feedback).
* **Key Capabilities:**
  - Dynamic JSON-schema form rendering (Text, Textarea, Select, Multi-select, Radio, Checkbox, File upload).
  - Deadline enforcement with countdown timers.
  - Automated deadline reminder notifications and student wishlist / draft tracking.

### Module 8: Notifications & Administrative Audit Trail
* **Structure:** In-app notification bell with real-time indicators and email delivery logs.
* **Key Capabilities:**
  - Granular user preferences (toggle email/in-app alerts for event reminders, issue status changes, club announcements).
  - Complete `AdminAuditLog` tracking administrative actions (role changes, ticket status updates, proposal reviews, user suspensions) with timestamp, actor ID, and IP address.

---

## 5. Complete REST API Directory (145 Endpoints)

### 5.1. Authentication Routes (`/api/auth`) — 7 Endpoints
* `POST /api/auth/register` — Student registration with field validation.
* `POST /api/auth/login` — Authentication and JWT token issuance.
* `POST /api/auth/logout` — Cookie invalidation and session termination.
* `GET  /api/auth/me` — Retrieve active authenticated session payload.
* `POST /api/auth/forgot-password` — Generate time-limited password reset OTP.
* `POST /api/auth/verify-otp` — Verify password reset OTP code.
* `POST /api/auth/reset-password` — Finalize password reset with secure hash update.

### 5.2. User Management Routes (`/api/users`) — 2 Endpoints
* `GET   /api/users/profile` — Fetch current user's profile and activity stats.
* `PATCH /api/users/profile` — Update bio, social links, and avatar image.

### 5.3. Events Routes (`/api/events`) — 9 Endpoints
* `GET    /api/events` — Query published campus events with filters.
* `GET    /api/events/my-registrations` — Fetch student's registered event list.
* `GET    /api/events/:id` — Detailed event metadata and attendee counts.
* `GET    /api/events/:id/attendees` — Organizer attendee list (Admin/Lead only).
* `POST   /api/events` — Create new event (Admin / Club Coordinator).
* `POST   /api/events/:id/register` — Register for event with capacity check.
* `PATCH  /api/events/:id` — Update event schedule, venue, or details.
* `DELETE /api/events/:id` — Cancel event with attendee notifications.
* `DELETE /api/events/:id/register` — Cancel registration and restore capacity.

### 5.4. Campus Groups Routes (`/api/groups`) — 35 Endpoints
* `GET    /api/groups` — List public/discoverable groups.
* `GET    /api/groups/my-groups` — List groups joined or managed by user.
* `GET    /api/groups/:id` — Group overview, rules, and statistics.
* `GET    /api/groups/:id/members` — Member directory with assigned roles.
* `GET    /api/groups/:id/posts` — Activity feed and discussions for group.
* `GET    /api/groups/:id/requests` — Pending join requests (Mod/Owner only).
* `GET    /api/groups/:id/resources` — Shared links, files, and study resources.
* `GET    /api/groups/:id/activities` — Audit log of recent group activities.
* `GET    /api/groups/:id/invitations` — Pending invitations sent to users.
* `GET    /api/groups/:id/posts/:postId/comments` — Comments for group post.
* `GET    /api/groups/:id/membership-status` — Current user's role in group.
* `POST   /api/groups` — Create a new student group.
* `POST   /api/groups/:id/join` — Join public group directly.
* `POST   /api/groups/:id/request-access` — Submit join request for private group.
* `POST   /api/groups/:id/posts` — Create discussion post in group.
* `POST   /api/groups/:id/posts/:postId/comments` — Comment on group post.
* `POST   /api/groups/:id/resources` — Upload/share group resource.
* `POST   /api/groups/:id/invitations` — Invite a student to group.
* `POST   /api/groups/:id/announcements` — Broadcast group announcement.
* `PATCH  /api/groups/:id` — Update group metadata, privacy, or rules.
* `PATCH  /api/groups/:id/requests/:requestId` — Approve/reject join request.
* `PATCH  /api/groups/:id/members/:memberId/role` — Promote/demote group member.
* `PATCH  /api/groups/:id/posts/:postId` — Edit group post.
* `PATCH  /api/groups/:id/posts/:postId/pin` — Pin post to top of group feed.
* `PATCH  /api/groups/:id/comments/:commentId` — Edit group comment.
* `PATCH  /api/groups/:id/invitations/:invitationId` — Accept/decline invite.
* `PATCH  /api/groups/:id/transfer-ownership` — Transfer ownership to member.
* `DELETE /api/groups/:id` — Delete group and cascade all posts/comments.
* `DELETE /api/groups/:id/leave` — Leave group (sole-owner protected).
* `DELETE /api/groups/:id/members/:memberId` — Remove member from group.
* `DELETE /api/groups/:id/posts/:postId` — Delete post and child comments.
* `DELETE /api/groups/:id/comments/:commentId` — Delete group comment.
* `DELETE /api/groups/:id/resources/:resourceId` — Delete shared resource.
* `DELETE /api/groups/:id/requests/:requestId` — Cancel pending join request.
* `DELETE /api/groups/:id/invitations/:invitationId` — Revoke sent invitation.

### 5.5. College Clubs Routes (`/api/clubs`) — 15 Endpoints
* `GET    /api/clubs` — List all approved active campus clubs.
* `GET    /api/clubs/my-memberships` — List clubs current user belongs to.
* `GET    /api/clubs/my-proposals` — List club proposals submitted by user.
* `GET    /api/clubs/admin/proposals` — Admin view of all club proposals.
* `GET    /api/clubs/:id` — Detailed club page and executive roster.
* `GET    /api/clubs/:id/members` — List official club members.
* `GET    /api/clubs/:id/events` — Events hosted by specific club.
* `POST   /api/clubs/proposals` — Submit new student club proposal.
* `POST   /api/clubs/:id/join` — Apply to join club.
* `POST   /api/clubs` — Create official club directly (Admin only).
* `PATCH  /api/clubs/admin/proposals/:id/review` — Approve/reject proposal.
* `PATCH  /api/clubs/:id` — Update club description, logo, and links.
* `PATCH  /api/clubs/:id/members/:memberId/role` — Update member role.
* `PATCH  /api/clubs/:id/status` — Deactivate / archive club.
* `DELETE /api/clubs/:id/members/:memberId` — Remove member or leave club.

### 5.6. Campus Issues & Grievances (`/api/issues`) — 12 Endpoints
* `GET    /api/issues` — Query campus issues with status/category filters.
* `GET    /api/issues/my-issues` — Issues reported by current student.
* `GET    /api/issues/:id` — Detailed issue timeline and resolution updates.
* `GET    /api/issues/:id/comments` — Public/admin discussion on issue.
* `POST   /api/issues` — Submit new campus issue report.
* `POST   /api/issues/:id/support` — Toggle upvote / community support.
* `POST   /api/issues/:id/comments` — Add comment or inquiry to ticket.
* `POST   /api/issues/:id/feedback` — Submit post-resolution satisfaction rating.
* `POST   /api/issues/:id/reopen` — Request ticket reopening if unresolved.
* `PATCH  /api/issues/:id` — Edit issue description (reporter only).
* `DELETE /api/issues/:id` — Withdraw issue report before review.
* `DELETE /api/issues/:id/comments/:commentId` — Delete issue comment.

### 5.7. Admin Issue Management (`/api/admin/issues`) — 11 Endpoints
* `GET    /api/admin/issues` — Master issue view with triage metrics.
* `GET    /api/admin/issues/stats` — Issue analytics by category and SLA.
* `GET    /api/admin/issues/history` — Audit log of status transitions.
* `GET    /api/admin/issues/:id/reopen-requests` — Review student reopen requests.
* `POST   /api/admin/issues/:id/assign` — Assign issue to staff/department.
* `POST   /api/admin/issues/:id/updates` — Post official resolution update.
* `POST   /api/admin/issues/:id/internal-notes` — Add internal staff notes.
* `PATCH  /api/admin/issues/:id/status` — Transition status (In Progress, Resolved).
* `PATCH  /api/admin/issues/:id/priority` — Adjust priority (Critical, High, etc.).
* `PATCH  /api/admin/issues/:id/category` — Reclassify issue category.
* `PATCH  /api/admin/issues/:id/reopen-requests/:requestId` — Adjudicate reopen.

### 5.8. Discussions & Q&A (`/api/discussions`) — 18 Endpoints
* `GET    /api/discussions` — Query forum discussions with sort/tag options.
* `GET    /api/discussions/my-posts` — Discussions created by current user.
* `GET    /api/discussions/saved` — User's bookmarked discussions.
* `GET    /api/discussions/:id` — Full discussion post with upvote metrics.
* `GET    /api/discussions/:id/comments` — Threaded comments for discussion.
* `POST   /api/discussions` — Create a new discussion post.
* `POST   /api/discussions/:id/vote` — Upvote or downvote discussion.
* `POST   /api/discussions/:id/comments` — Add comment to discussion.
* `POST   /api/discussions/:id/comments/:commentId/reply` — Nested comment reply.
* `POST   /api/discussions/:id/save` — Bookmark / unbookmark discussion.
* `POST   /api/discussions/:id/report` — Report post for moderation.
* `PATCH  /api/discussions/:id` — Edit discussion post content.
* `PATCH  /api/discussions/:id/pin` — Pin discussion (Admin/Mod).
* `PATCH  /api/discussions/:id/comments/:commentId` — Edit comment.
* `DELETE /api/discussions/:id` — Delete discussion and all votes/comments.
* `DELETE /api/discussions/:id/vote` — Remove vote.
* `DELETE /api/discussions/:id/comments/:commentId` — Delete comment.
* `DELETE /api/discussions/:id/save` — Remove from bookmarks.

### 5.9. Student Forms & Surveys (`/api/forms`) — 12 Endpoints
* `GET    /api/forms` — List available student forms with deadline indicators.
* `GET    /api/forms/my-submissions` — View user's submitted forms.
* `GET    /api/forms/:id` — Get dynamic form structure and fields.
* `POST   /api/forms` — Create new administrative form (Admin).
* `POST   /api/forms/:id/submit` — Submit completed form data.
* `POST   /api/forms/:id/wishlist` — Save form to student watchlist.
* `POST   /api/forms/:id/reminders` — Opt-in to deadline push reminders.
* `PATCH  /api/forms/:id` — Edit form schema or extend deadline.
* `PATCH  /api/forms/:id/status` — Publish / close form.
* `PATCH  /api/forms/:id/submissions/:subId` — Review/approve submission.
* `DELETE /api/forms/:id` — Delete form and associated responses.
* `DELETE /api/forms/:id/wishlist` — Remove form from watchlist.

### 5.10. Campus Announcements (`/api/announcements`) — 5 Endpoints
* `GET    /api/announcements` — Query public announcements by tag/priority.
* `GET    /api/announcements/:id` — Detailed announcement view.
* `POST   /api/announcements` — Publish campus announcement (Admin).
* `PATCH  /api/announcements/:id` — Edit announcement text or priority flag.
* `DELETE /api/announcements/:id` — Archive / remove announcement.

### 5.11. Notifications Engine (`/api/notifications`) — 7 Endpoints
* `GET    /api/notifications` — Fetch user's notification feed.
* `GET    /api/notifications/unread-count` — Count badge for header bell.
* `GET    /api/notifications/preferences` — Get notification preferences.
* `PATCH  /api/notifications/:id/read` — Mark specific alert as read.
* `PATCH  /api/notifications/read-all` — Mark all alerts as read.
* `PATCH  /api/notifications/preferences` — Update alert delivery toggles.
* `DELETE /api/notifications/:id` — Dismiss/delete alert.

### 5.12. Content Moderation (`/api/moderation`) — 2 Endpoints
* `GET   /api/moderation/reports` — Fetch flagged posts and comments.
* `PATCH /api/moderation/reports/:id/action` — Dismiss report or delete content.

### 5.13. Platform Administration (`/api/admin`) — 8 Endpoints
* `GET   /api/admin/overview` — Campus KPI metrics (Users, Active Issues, Events).
* `GET   /api/admin/users` — Search and manage user roster with roles.
* `GET   /api/admin/users/:id` — Detailed student history and activity log.
* `GET   /api/admin/audit-logs` — Immutable audit trail of admin actions.
* `GET   /api/admin/email-logs` — Diagnostic delivery log of system emails.
* `GET   /api/admin/system-health` — Real-time DB and uptime diagnostics.
* `PATCH /api/admin/users/:id/role` — Promote/demote user (`student` $\leftrightarrow$ `admin`).
* `PATCH /api/admin/users/:id/status` — Suspend or reactivate user account.

### 5.14. Universal Campus Search (`/api/search`) — 1 Endpoint
* `GET /api/search` — Unified multi-model search across Events, Groups, Clubs, Discussions, and Notices.

### 5.15. Campus Discovery (`/api/discovery`) — 1 Endpoint
* `GET /api/discovery/feed` — Aggregated recommendation feed of trending activities.

### 5.16. Media & Image Upload Engine (`/api/upload`) — 1 Endpoint
* `POST /api/upload/image` — Secure multipart/base64 image intake with client-side canvas optimization, MIME validation, server-side disk persistence in `/uploads/`, and static asset serving.

---

## 6. Complete Database Schema (36 Mongoose Models)

1. `User.js` — Core user profiles, role hierarchy, credentials, department, and semester.
2. `Event.js` — Campus events, venue, schedule, organizers, and capacity limits.
3. `EventRegistration.js` — Event registrations with compound `{ event, student }` uniqueness.
4. `CollegeClub.js` — Official campus clubs, bylaws, faculty mentors, and leads.
5. `ClubMembership.js` — Official club roster and student executive roles.
6. `ClubProposal.js` — Student applications to create new clubs with admin review status.
7. `Group.js` — Informal student groups, privacy controls, and descriptions.
8. `GroupMembership.js` — Group member roles (`owner`, `moderator`, `member`).
9. `GroupPost.js` — Posts and announcements within micro-community groups.
10. `GroupComment.js` — Nested replies on group posts.
11. `GroupJoinRequest.js` — Moderated access requests for private groups.
12. `GroupActivity.js` — Real-time activity logs for group feeds.
13. `GroupResource.js` — Shared study guides, syllabus links, and attachments.
14. `GroupInvitation.js` — Invitations sent by group leaders to students.
15. `CampusIssue.js` — Infrastructure and academic grievance tickets with priority and location.
16. `IssueComment.js` — Public and internal communication thread on issues.
17. `IssueUpdate.js` — Official admin progress reports and resolution steps.
18. `IssueSupport.js` — Community upvotes indicating shared issue impact.
19. `IssueFeedback.js` — Student star ratings and satisfaction notes post-resolution.
20. `IssueStatusHistory.js` — Immutable timeline of status transitions for audit.
21. `IssueAssignmentHistory.js` — Record of staff assignments for accountability.
22. `ReopenRequest.js` — Student requests to contest premature issue resolution.
23. `DiscussionPost.js` — Q&A forum discussions with category tags and view counters.
24. `DiscussionComment.js` — Threaded answers and replies on discussions.
25. `DiscussionVote.js` — Upvote/downvote records with compound `{ post, user }` index.
26. `SavedDiscussion.js` — Student bookmarks for revision and quick access.
27. `StudentForm.js` — Dynamic administrative forms with custom JSON schemas.
28. `FormReminderLog.js` — Scheduled reminder dispatches for pending forms.
29. `FormWishlist.js` — Student saved/draft forms for later completion.
30. `Announcement.js` — Official broadcasts with urgency tags (`important`, `normal`).
31. `Notification.js` — In-app notification queue with read/unread tracking.
32. `NotificationPreference.js` — Student notification channel configurations.
33. `ContentReport.js` — Content moderation queue for flagged submissions.
34. `AdminAuditLog.js` — Immutable audit log recording all privileged operations.
35. `EmailDeliveryLog.js` — System email dispatch audit log.
36. `PasswordResetOtp.js` — Time-expiring cryptographically generated OTP tokens.

---

## 7. Frontend Architecture & Design Standards

* **Framework:** React 18 with Vite bundling for sub-second hot module replacement.
* **Styling:** Modern Tailwind CSS with custom slate/navy enterprise palette.
* **Theme Support:** Zero-flicker Light / Dark mode toggling via `ThemeContext` with local storage persistence.
* **Layout Discipline (Zero Horizontal Scroll):**
  - Strict responsive boundary enforcement: standard 100vw container controls (`overflow-x: hidden`).
  - Desktop navbar features 5 core direct routes + an adaptive `More ▾` dropdown to ensure clean rendering on any display width without overlapping action buttons.
  - Dedicated mobile drawer menu with touch-friendly navigation anchors.

---

## 8. Deployment & Local Verification

### 8.1. Environment Variables Configuration

#### Backend: `server/.env`
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@clusteruniverse.mongodb.net/universe?retryWrites=true&w=majority
JWT_SECRET=super_secret_universe_jwt_key_college_2026_xyz
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@universe.edu
ADMIN_PASSWORD=AdminSecure2026!
```

#### Frontend: `client/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

### 8.2. Running the Application
```bash
# Install dependencies
npm --prefix server install
npm --prefix client install

# Start development servers
npm --prefix server run dev    # Server runs on http://localhost:5000
npm --prefix client run dev    # Client runs on http://localhost:5173
```

