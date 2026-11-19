# UniVerse — Implementation & Verification Status

## 1. Project Overview & Scope
- **Project Name:** UniVerse
- **Architecture:** MERN Stack (React 18 + Vite + Tailwind CSS + Node.js/Express + MongoDB Atlas via Mongoose)
- **Completed Modules & Systems:**
  - **Module 1:** Authentication & User Management
  - **Module 2:** Events & Announcements
  - **Module 3:** Groups & Communities
  - **Module 4:** Discussions & Content (Fully Implemented & Verified)
  - **Module 5:** Campus Issues & Resolution (Fully Implemented & Verified)
  - **Module 6:** Admin, Notifications & Discovery (Fully Implemented & Verified)
  - **UI/UX Redesign & Brand Integration:** Official UniVerse logo (`logo.jpeg`) integration, design system tokens, responsive desktop/mobile navigation, and genuine global Light/Dark Mode with client persistence.

---

## 2. Features Completed

### Module 5 — Campus Issues & Resolution
- [x] **Student Issue Reporting (`POST /api/issues`, `/issues/create`)**:
  - Human-readable unique Reference ID generation (`ISS-YYYY-XXXXX`, unique indexed).
  - Required fields: title (5-150 chars), description (10-3000 chars), category (13 campus categories), location (2-100 chars), priority (`low`, `medium`, `high`, `critical`), and visibility (`public`, `private`).
  - Optional fields: building/block, room, supporting photo URL / presets.
  - Anonymous public reporting toggle (`isAnonymousToPublic`).
  - Client and server validation with user-friendly error messages.
  - Backend derives reporter strictly from authenticated JWT token.
  - Initial status set to `submitted` with automated initial `IssueStatusHistory` audit record.
  - Success modal with Reference ID copy action and quick navigation to issue details.
- [x] **Campus Issues Discovery Feed (`GET /api/issues`, `/issues`)**:
  - Real-time search across title, description, location, and Reference ID.
  - Strict privacy protection: query forcefully enforces `{ visibility: 'public' }` so private issues never leak.
  - Category filter pills for all 13 campus categories.
  - Status tabs: All Issues, Recently Reported, Most Supported, Under Review, In Progress, Resolved.
  - Sort options: Newest, Most Supported, Highest Priority, Oldest.
  - Issue cards displaying Reference ID with copy button, priority badge, status badge, category badge, location, support counter, and comment counter.
  - Educational sidebar with resolution guidelines, category overview, and quick links.
- [x] **Single Issue Details & Visual Progress Tracker (`GET /api/issues/:issueId`, `/issues/:issueId`)**:
  - Visual timeline tracker displaying all major lifecycle stages (`Submitted` -> `Under Review` -> `Approved` -> `Assigned` -> `In Progress` -> `Resolved` -> `Closed`).
  - Strict privacy authorization: private issues accessible only by the original reporter and authorized administrators (`403 Forbidden` for all others).
  - Issue metadata showcase: category, priority, location, building, room, reported timestamp, and reporter identity (protected if anonymous).
  - Photo evidence preview modal.
  - Official Resolution Banner displaying resolution summary, actions taken, resolved timestamp, and resolving admin.
  - Real-time status history audit trail.
- [x] **Community Support System (`POST /api/issues/:issueId/support`, `DELETE /api/issues/:issueId/support`)**:
  - Dedicated `IssueSupport` model with compound unique index `{ issue: 1, user: 1 }`.
  - Only public issues can receive community support.
  - Reporter self-support strictly blocked on backend (`400 Bad Request`).
  - Atomic support count increment and decrement (`$inc: { supportCount: 1 }` / `$inc: { supportCount: -1 }`).
  - Toggle button with optimistic UI updates and active vote states.
- [x] **Issue Discussion & Comments (`GET /api/issues/:issueId/comments`, `POST /api/issues/:issueId/comments`, `PATCH /api/issues/:issueId/comments/:commentId`, `DELETE /api/issues/:issueId/comments/:commentId`)**:
  - Threaded discussion under each accessible issue.
  - Authenticated students can comment on public issues; private comments restricted to reporter and admin.
  - Atomic comment count increment and decrement on `CampusIssue`.
  - Author and administrator edit and deletion permissions with confirmation dialogs.
- [x] **Personal Student Reports (`GET /api/issues/my-reports`, `/issues/my-reports`)**:
  - Student personal dashboard tracking all authored issues (both public and private).
  - Status filter tabs: All, Submitted, Under Review, In Progress, On Hold, Resolved, Closed, Rejected.
  - Latest administrative update snippet displayed on each report card.
  - Quick link to view full progress timeline.
- [x] **Administrative Issue Management Workspace (`GET /api/admin/issues`, `/admin/issues`)**:
  - Protected with `requireAdmin` middleware.
  - Live MongoDB aggregation statistics (`GET /api/admin/issues/statistics`): Total registered, submitted, under review, approved, assigned, in progress, on hold, resolved, closed, rejected, and critical priority counts.
  - Searchable, sortable, and filterable issue management table.
  - Status transition workflow modal enforcing valid state transitions (`ALLOWED_TRANSITIONS`). Rejection and duplicate statuses require mandatory explanations.
  - Department assignment modal with target resolution date and instructions.
  - Add public progress update or confidential internal note modal (`visibility: 'public' | 'internal'`).
  - Official issue resolution modal capturing resolution summary and actions taken.
  - Issue closure modal.
  - Student reopen request review modal (Approve or Reject with explanation).
  - Full audit trail modal displaying complete status and assignment history.
- [x] **Resolution Feedback & Reopening Workflow (`POST /api/issues/:issueId/feedback`, `POST /api/issues/:issueId/reopen-requests`)**:
  - Original reporter can rate resolution satisfaction (1 to 5 stars) and state whether the issue was genuinely resolved.
  - Dedicated `IssueFeedback` model with unique index `{ issue: 1 }`.
  - If issue remains unresolved, student can submit a Reopen Request with detailed justification.
  - Dedicated `ReopenRequest` model tracked in MongoDB Atlas and reviewed by administrators.

### Module 6 — Admin, Notifications & Discovery
- [x] **Centralized Admin Dashboard (`GET /api/admin/dashboard/overview`, `/admin`)**:
  - Live MongoDB Atlas aggregation across all 6 modules: Users, Events, Groups, Discussions, Campus Issues, Announcements.
  - Distribution analytics (`GET /api/admin/dashboard/analytics`): Issues by status, issues by priority, and users by academic department.
  - Live platform activity feed (`GET /api/admin/dashboard/activity`): Real-time activity cards with action badges, entity links, and ISO timestamps.
  - Quick administrative actions routing to Users, Audit Logs, Issues Workspace, Moderation Queue, Events, and Announcements.
  - Strict role-based backend authorization (`requireAdmin` middleware enforcing `403 Forbidden` for non-admins).
- [x] **User Administration Workspace (`GET /api/admin/users`, `/admin/users`)**:
  - Paginated user directory with keyword search (name, email) and multi-field filters (role, status, department, academic year).
  - User detail inspection modal (`GET /api/admin/users/:userId`): Displays complete account metadata and active activity summary counts (events registered, groups created/joined, posts authored, issues reported).
  - Account status management (`PATCH /api/admin/users/:userId/status`): Supports `active`, `suspended`, and `deactivated` with mandatory administrative reason.
  - Role management (`PATCH /api/admin/users/:userId/role`): Supports `student` and `admin` roles with robust self-demotion protection and sole super-admin demotion blocks.
  - Direct integration into authentication middleware: Suspended and deactivated accounts are instantaneously rejected on `login` and `authenticate` with `403 Forbidden`.
- [x] **Administrative Audit Trail (`GET /api/admin/audit-logs`, `/admin/audit-logs`)**:
  - Persistent, tamper-proof audit records (`AdminAuditLog` model in MongoDB Atlas) tracking actor, action, target type, target ID, description, and metadata.
  - Filterable by action type (`USER_ROLE_CHANGE`, `USER_STATUS_CHANGE`, `ISSUE_STATUS_CHANGE`, `ISSUE_RESOLVED`, etc.) and target type.
  - Pagination, sorting, search, and comprehensive forensic detail inspect modal.
  - Ordinary users blocked with `403 Forbidden`.
- [x] **Persistent Event-Driven Notification System (`/api/notifications`, `/notifications`)**:
  - Mongoose `Notification` model indexed on `{ recipient: 1, createdAt: -1 }`, `{ recipient: 1, isRead: 1 }`, and `{ recipient: 1, type: 1 }`.
  - Reusable `notificationService.js`: Supports single and bulk notification creation, category preference filtering, actor exclusion, unread counting, pagination, single/all mark-as-read, and deletion.
  - Triggers integrated across Modules 1–5:
    - Module 2: Bulk student notifications on announcement publication.
    - Module 3: Notifications on private group join requests and owner approval/rejection decisions.
    - Module 4: Notifications on discussion replies and accepted answers.
    - Module 5: Notifications on campus issue review, approval, status change, and official resolution.
    - Module 6: Essential security notifications on account suspension, activation, and role modification.
  - Strict privacy isolation: Students can only query, mark read, or delete notifications where `recipient === req.user._id`.
  - Header `NotificationBell` component with automatic 30s background polling, live unread counter badge, popover dropdown preview, and quick mark-as-read actions.
  - Dedicated `/notifications` Notification Center page with All, Unread, and Read filters, category badges, mark all as read, and single notification dismissal.
- [x] **User Notification Preferences (`/api/notifications/preferences`, `/settings/notifications`)**:
  - Dedicated `NotificationPreference` model in MongoDB Atlas tracking category opt-ins (`eventUpdates`, `eventReminders`, `announcements`, `groupActivity`, `membershipUpdates`, `discussionActivity`, `campusIssueUpdates`).
  - Mandatory essential account security notices toggle permanently locked on for student safety.
  - Applied directly in backend notification service prior to dispatching new notifications.
- [x] **Unified Global Search (`GET /api/search`, `/search`)**:
  - Cross-platform search across Events, Announcements, Groups, Discussions, and Campus Issues.
  - Category tabs with real-time match count badges: All, Events, Announcements, Groups, Discussions, Campus Issues.
  - Strict privacy and visibility protection: forcefully filters `{ visibility: 'public' }` on issues and groups, `{ isPublished: true }` on announcements, and non-hidden discussions.
  - Responsive search header input with live debounced preview dropdown and keyboard navigation.
- [x] **Campus Discovery Experience (`GET /api/discover`, `/discover`)**:
  - Campus discovery hub highlighting upcoming campus events, official notices, active student communities, trending discussions, and campus priority issues.
  - 100% powered by real MongoDB Atlas data with zero mock placeholders.

---

## 3. Build & Test Results

### Module 6 Automated Test Suite (`node src/tests/testModule6.js`)
- **Suite:** `server/src/tests/testModule6.js`
- **Result:** **36 passed, 0 failed** directly against MongoDB Atlas
  - Student 1 & 2 registration & JWT generation: PASSED
  - Admin login & JWT verification: PASSED
  - Notification unread count initial query: PASSED
  - Notification creation in MongoDB Atlas: PASSED
  - Unread count increment to 1: PASSED
  - Student 1 notification listing: PASSED
  - Student 2 privacy isolation (cannot view Student 1 notifications): PASSED
  - Mark single notification as read: PASSED
  - Unread count decrement: PASSED
  - Mark all notifications as read: PASSED
  - Single notification deletion: PASSED
  - Unauthorized notification deletion rejected with 404: PASSED
  - Fetch default notification preferences: PASSED
  - Update preferences (disable eventUpdates): PASSED
  - Global search returns categorized results: PASSED
  - Private issues strictly excluded from search results: PASSED
  - Public issue included with proper actionUrl and referenceId: PASSED
  - Type-filtered search (type=events): PASSED
  - Campus Discovery hub returns structured sections: PASSED
  - Student blocked from admin dashboard overview with 403: PASSED
  - Admin fetches live database overview: PASSED
  - Admin fetches platform activity feed: PASSED
  - Admin fetches visual analytics distributions: PASSED
  - Student blocked from user management with 403: PASSED
  - Admin lists users and searches by name: PASSED
  - Admin retrieves single user profile and activity summary: PASSED
  - Admin suspends Student 2: PASSED
  - Suspended student blocked from platform APIs with 403: PASSED
  - Admin restores Student 2 to active: PASSED
  - Admin promotes Student 1 to Admin role: PASSED
  - Self-demotion prevented with 400 Bad Request: PASSED
  - Student blocked from audit logs with 403: PASSED
  - Admin fetches audit logs with 200 OK: PASSED
  - Audit log recorded USER_STATUS_CHANGE and USER_ROLE_CHANGE: PASSED

### Module 5 Automated Integration Test Suite (`node src/tests/testModule5.js`)
- **Suite:** `server/src/tests/testModule5.js`
- **Result:** **48 passed, 0 failed** directly against MongoDB Atlas
  - Student 1 & 2 registration & JWT token generation: PASSED
  - Admin login & JWT verification: PASSED
  - Public issue creation with unique `ISS-YYYY-XXXXX` Reference ID: PASSED
  - Discovery feed retrieval & strict public query: PASSED
  - Private issue creation: PASSED
  - Private issue excluded from public feed: PASSED
  - Private issue direct access blocked for unauthorized student (403): PASSED
  - Reporter can access own private issue: PASSED
  - Administrator can access private issue: PASSED
  - Reporter blocked from supporting own issue: PASSED
  - Second student supports issue with atomic counter update: PASSED
  - Duplicate support blocked by compound index: PASSED
  - Support removal decrements counter atomically: PASSED
  - Discussion comment creation & atomic commentCount increment: PASSED
  - Comment editing by author: PASSED
  - Non-author blocked from editing comment (403): PASSED
  - Comment deletion by author: PASSED
  - My Reports retrieves student's public and private issues: PASSED
  - Student blocked from admin workspace endpoints (403): PASSED
  - Admin retrieves live statistics directly from MongoDB: PASSED
  - Admin transitions status (Submitted -> Under Review): PASSED
  - Invalid status transition rejected (400): PASSED
  - Department assignment with target date & instructions: PASSED
  - Public progress update creation: PASSED
  - Internal administrative note creation: PASSED
  - Internal notes omitted from student response: PASSED
  - Admin marks issue resolved with summary & action taken: PASSED
  - Reporter submits 5-star resolution feedback: PASSED
  - Duplicate feedback submission prevented: PASSED
  - Reporter submits reopen request: PASSED
  - Admin reviews & approves reopen request: PASSED
  - Issue status updated to `reopened`: PASSED
  - Non-reporter blocked from submitting feedback (403): PASSED
  - Admin closes issue: PASSED
  - Full audit trail history retrieval: PASSED
  - Zero-regression checks on Modules 1, 2, 3, and 4: ALL PASSED

### Module 4 Automated Integration Test Suite (`node src/tests/testModule4.js`)
- **Suite:** `server/src/tests/testModule4.js`
- **Result:** **42 passed, 0 failed** directly against MongoDB Atlas

### Modules 1–3 Complete Backend Test Suite (`node src/tests/runTests.js`)
- **Suite:** `server/src/tests/runTests.js`
- **Result:** **61 passed, 0 failed** directly against MongoDB Atlas

### Frontend Production Build (`npm --prefix client run build`)
- **Tool:** Vite v6.4.4
- **Result:** **Success (Exit code: 0)**
  - 1,682 modules transformed into production assets in `client/dist`.
  - Zero syntax, import, or CSS bundling errors.

### Browser End-to-End Walkthrough Runs
- **Recording 1:** `file:///C:/Users/AKHILESH G/.gemini/antigravity-ide/brain/697cc870-ac5d-4a03-89a8-7361016cf59e/universe_module5_live_walkthrough_1793380595572.webp`
- **Recording 2:** `file:///C:/Users/AKHILESH G/.gemini/antigravity-ide/brain/697cc870-ac5d-4a03-89a8-7361016cf59e/universe_module5_details_admin_demo_1793381409239.webp`

---

## 4. Environment Configuration
The application is configured to connect to MongoDB Atlas via standard environment variables:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<db_username>:<db_password>@<cluster-address>/universe?retryWrites=true&w=majority
DB_NAME=universe
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@universe.edu
ADMIN_PASSWORD=your_admin_secure_password
```
- **Database Name:** `universe`
- **All Integration Test Suites:** **151 passed, 0 failed** directly against MongoDB Atlas.


### Module 1 — Authentication & User Management
- [x] **Student Registration (`POST /api/auth/register`)**:
  - Full name, email, department, academic year, password, and confirm password validation.
  - Case-insensitive email normalization and duplicate check (returns `409 Conflict`).
  - Passwords securely hashed with `bcryptjs` (salt rounds: 10) before saving.
  - Password hashes excluded by default from queries and responses (`select: false`).
  - **Strict role protection:** Public registration forcefully assigns `role: 'student'`. Any client-supplied role is ignored.
- [x] **Login & Logout (`POST /api/auth/login`, `POST /api/auth/logout`)**:
  - Validates credentials using `bcrypt.compare`.
  - Issues signed JWT token via HTTP-only cookie (`token`) and JSON payload fallback for Authorization headers.
  - Logout clears cookie and client auth state.
- [x] **Session Restoration (`GET /api/auth/me`)**:
  - Restores authenticated identity on page refresh without UI flicker.
- [x] **Role Authorization**:
  - Express middleware (`authenticate`, `requireAdmin`, `optionalAuthenticate`).
  - Protected routes on client (`ProtectedRoute`, `AdminRoute`, `PublicOnlyRoute`).
  - Student attempt to access administrative endpoints rejected with `403 Forbidden`.
- [x] **Student Profile Management (`GET /api/users/me`, `PATCH /api/users/me`)**:
  - View profile details with department, academic year, and interests tags.
  - Email displayed as read-only.
  - Edit profile updates name, department, year, interests, and avatar URL.
  - Protected against privilege escalation: mass assignment cannot alter role, email, or user ID.
- [x] **Secure Administrator Initialization (`npm run seed:admin`)**:
  - Reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.
  - Promotes or creates administrator safely without overwriting passwords unexpectedly.

### Module 2 — Events & Announcements
- [x] **Event Discovery & Listing (`GET /api/events`)**:
  - Real-time search across title, description, and venue.
  - Category filters: Technical, Cultural, Sports, Workshops, Clubs, Competitions, Other.
  - Timeframe filter: Upcoming, All, Past.
  - Sort by date (soonest, latest) or title.
  - Card displays category badge, date/time, venue, spots left, registration status.
- [x] **Event Details (`GET /api/events/:id`)**:
  - Full poster, description, organizer details, capacity indicators, and deadline warnings.
  - Graceful 404 handling for invalid or nonexistent event IDs.
- [x] **Event Registration (`POST /api/events/:id/register`, `DELETE /api/events/:id/register`)**:
  - Separate `EventRegistration` collection with compound unique index `{ event: 1, user: 1 }`.
  - Duplicate registration prevention with `409 Conflict`.
  - Atomic capacity check (`$inc: { registeredCount: 1 }` with conditional query) preventing race conditions.
  - Cancellation atomically decrements event capacity.
- [x] **My Events (`GET /api/events/my-registrations`)**:
  - Displays authenticated student's confirmed passes.
  - Cancellation dialog before removing registrations.
- [x] **Event Administration (`POST /api/events`, `PATCH /api/events/:id`, `DELETE /api/events/:id`, `GET /api/events/:id/registrations`)**:
  - Admin-only CRUD operations with date and capacity validation.
  - Cascade deletion: deleting an event automatically purges associated registration records.
  - Registered attendees roster view displaying student names, emails, departments, and signup dates.
- [x] **Campus Announcements (`GET /api/announcements`, `GET /api/announcements/:id`)**:
  - Category filtering: Academic, Events, Administrative, Campus Updates, General.
  - Priority badge: `important` with distinct alert visual treatment.
  - **Draft Protection:** Students and public visitors only see `isPublished: true`. Drafts return `404` to non-administrators.
- [x] **Announcement Administration (`POST /api/announcements`, `PATCH /api/announcements/:id`, `DELETE /api/announcements/:id`)**:
  - Admin-only creation, editing, one-click publish/unpublish toggle, and deletion.

### Module 3 — Groups & Communities
- [x] **Group Models & Schema Architecture**:
  - `Group` model with text search index (`name`, `shortDescription`, `description`, `tags`), category enum, and visibility enum.
  - `GroupMembership` model with compound unique index `{ group: 1, user: 1 }` and role enum (`owner`, `moderator`, `member`).
  - `GroupJoinRequest` model for private group membership approval workflows (`pending`, `approved`, `rejected`).
  - `GroupPost` model for focused group discussions, tracking author, group, title, content, and comment counts.
  - `GroupComment` model for threaded discussions under specific group posts.
- [x] **Group Discovery (`GET /api/groups`)**:
  - Real-time search across title, descriptions, and tags.
  - Category chips for 10 campus categories (Technical, CP, AI/ML, Academic, Cultural, Sports, etc.).
  - Sort by popularity (member count), newest, or alphabetical.
  - Visibility badges (`Public` vs `Private`).
  - Dynamic user membership status: `owner`, `moderator`, `member`, `requested`, or `none`.
  - Direct 1-click Join for public groups; "Request to Join" for private groups.
- [x] **Group Details Hub (`GET /api/groups/:id`)**:
  - Hero banner with cover image, category badge, visibility tag, and role badge.
  - Tabbed interface: Discussions Feed, Community Roster, Join Requests (managers only), and Rules & About.
  - Content protection: Private group discussions and members hidden from non-members.
- [x] **Community Creation (`POST /api/groups`)**:
  - Form validation with character limits (name, tagline, description).
  - Pre-curated banner presets or custom high-resolution URLs with live preview.
  - Public vs. Private access policy cards.
  - Guidelines and discovery tags.
  - Authenticated user automatically registered as group owner.
- [x] **Community Management (`PATCH /api/groups/:id`, `DELETE /api/groups/:id`)**:
  - Authorized for owners, moderators, and platform admins.
  - Safe cascading deletion: deleting a group cleans up all memberships, join requests, posts, and comments.
- [x] **Membership System**:
  - Direct Join (`POST /api/groups/:id/join`) for public groups with compound unique index protection against duplicates.
  - Request to Join for private groups, creating pending `GroupJoinRequest`.
  - Review Join Requests (`PATCH /api/groups/:id/join-requests/:requestId`) by owners and moderators to approve or reject.
  - Role management (`PATCH /api/groups/:id/members/:userId/role`) allowing owners to promote/demote moderators.
  - Member removal (`DELETE /api/groups/:id/members/:userId`) by authorized managers.
  - Leave group (`DELETE /api/groups/:id/membership`) with sole-owner protection (owners must transfer or disband).
- [x] **Discussions & Comments**:
  - Create, view, edit, and delete discussion posts (`/api/groups/:id/posts`).
  - Member-restricted composer with title, content, and optional images.
  - Post comments (`/api/groups/:id/posts/:postId/comments`) with real-time comment count increments.
  - Author and manager post/comment deletion permissions.
- [x] **My Groups Page (`/my-groups`)**:
  - View all joined communities with role badges (Owner, Moderator, Member).
  - Track pending private group membership applications.
  - Role filtering and quick-leave actions.

### Module 4 — Discussions & Content (Platform-Wide)
- [x] **Platform-Wide Discussion Feed (`GET /api/discussions`, `/discussions`)**:
  - Central discussion discovery across all campus departments.
  - Real-time search across title, content, and tags.
  - Sorting: Trending, Newest, Most Upvoted, and Unanswered.
  - Category filters: Academics, Programming & DSA, Projects, Placements & Internships, Career Guidance, Campus Life, Technology, Research, Events, General Discussion.
  - Post type filter: Questions, Discussions, Resources, Projects.
  - Responsive cards with author avatars, badges, relative timestamps, upvotes, and comment counts.
  - Full URL synchronization of active filters for shareable/bookmarkable URLs.
  - Desktop sidebar with trending campus topic tags, quick links, and campus guidelines.
- [x] **Discussion Post Creation & Editing (`POST /api/discussions`, `PATCH /api/discussions/:id`, `/discussions/create`, `/discussions/:id/edit`)**:
  - Supported post types: Question, Discussion, Resource, Project with custom icon cards.
  - Live character counts for title (5-200) and content (min 10).
  - Tag manager with interactive add/remove badge pills (up to 8 tags).
  - Optional external resource URL and cover image URL inputs with format validation.
  - Markdown content editor with real-time Write/Preview toggle.
  - Server-side author derivation strictly from verified JWT token.
- [x] **Discussion Details Page (`GET /api/discussions/:id`, `/discussions/:id`)**:
  - Full title, formatted content, attached resource preview card, and cover image.
  - Author info, department, publication timestamp, and view counter.
  - Direct URL access and page refresh supported with database fetch.
  - Share link button with one-click clipboard copying.
  - Edit and delete actions for authorized post authors and administrators.
- [x] **Comments & Solutions (`GET /api/discussions/:id/comments`, `POST /api/discussions/:id/comments`, `PATCH /api/discussions/:id/comments/:commentId`, `DELETE /api/discussions/:id/comments/:commentId`)**:
  - Add replies/answers with live validation.
  - Atomic increment and decrement of post `commentCount`.
  - Author and admin inline editing and deletion with confirmation dialog.
- [x] **Accepted Answer System for Questions (`PATCH /api/discussions/:id/accepted-answer`)**:
  - Question author and admin can mark one response as the Accepted Answer.
  - Highlights accepted answer with distinct emerald badge and checkmark at top of responses.
  - Automatically marks question as "Resolved" in feed, cards, and details page.
  - Only authorized authors can mark answers; unauthorized requests rejected with `403 Forbidden`.
  - Can be toggled or updated by the question author.
- [x] **Persistent Upvoting (`POST /api/discussions/:id/vote`, `DELETE /api/discussions/:id/vote`)**:
  - Dedicated `DiscussionVote` model with compound unique index `{ post: 1, user: 1 }`.
  - Atomic duplicate vote prevention at the database level.
  - Upvote count atomically synced on post (`$inc: { upvoteCount: 1 }` / `$inc: { upvoteCount: -1 }`).
  - Active button state and optimistic UI feedback.
- [x] **Bookmarks & Saved Posts (`POST /api/discussions/:id/save`, `DELETE /api/discussions/:id/save`, `GET /api/discussions/saved`, `/discussions/saved`)**:
  - Dedicated `SavedDiscussion` model with unique compound index `{ post: 1, user: 1 }`.
  - Saved Posts page (`/discussions/saved`) showing all bookmarked questions and resources.
  - Persisted in MongoDB Atlas across logout/login and browser refreshes.
- [x] **User Discussion Profile (`GET /api/discussions/my-posts`, `/discussions/my-posts`)**:
  - Shows all discussions authored by the logged-in student.
  - Direct actions to edit, inspect, and delete authored discussions.
- [x] **Content Reporting & Moderation (`POST /api/discussions/:id/report`, `GET /api/moderation/reports`, `PATCH /api/moderation/reports/:id`, `/moderation/reports`)**:
  - Authenticated students can report posts or comments with predefined reasons: Spam, Harassment, Inappropriate content, Misleading information, Other.
  - Prevents duplicate reports from the same user for the same content.
  - Protected Administrator Moderation Queue (`/moderation/reports`) with `requireAdmin` enforcement.
  - Full preview of reported post/comment content and reporter details.
  - Moderation resolution actions: Dismiss Report, Hide Content, Delete Content (with cascade cleanup).
- [x] **Cascade Deletion Cleanup**:
  - Deleting a discussion post cascades deletion to all associated comments, votes, bookmarks, and reports.

### UI/UX Redesign, Official Brand Integration & Global Theme System
- [x] **Official Brand Integration (`logo.jpeg`)**:
  - Authoritative asset `logo.jpeg` placed in `client/public/logo.jpeg` and `client/src/assets/logo.jpeg`.
  - Browser favicon updated to `/logo.jpeg` and page title standardized to "UniVerse — Digital Campus Community Platform".
  - Navbars, footers, auth cards, and dashboard hero banners embed the official logo without distortion, cropping, or recoloring.
  - Light brand container (`bg-white p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm`) ensures crisp contrast in both Light and Dark modes.
- [x] **Global Light & Dark Theme System**:
  - `ThemeContext.jsx` with `ThemeProvider` and `useTheme()` hook providing instantaneous switching without full page reload.
  - Automatic OS system preference detection (`prefers-color-scheme: dark`) on first visit.
  - Persistent preference in `localStorage` under key `'universe_theme'`.
  - Tailwind CSS `darkMode: 'class'` toggled on `document.documentElement`.
  - Fully designed surfaces: deep navy/slate backgrounds (`#070d19`, `#0b1322`), light text (`#f8fafc`, `#94a3b8`), crisp borders (`border-slate-800`), and accessible focus states.
  - Interactive Sun/Moon theme toggle in both desktop header and mobile drawer.
- [x] **Centralized Design System & Tokens**:
  - Curated brand color palette: deep navy (`#0b1728`), bright campus blue (`#006ce6`), slate neutrals, and semantic accents (emerald, amber, rose, cyan, purple).
  - Modern typography and consistent spacing scale.
  - Polished shared components: `Navbar`, `Footer`, `AppLayout`, `Badge`, `Modal`, `ConfirmDialog`, `DiscussionCard`, `DiscussionFilters`, `ReportModal`.
- [x] **Full-Stack Preservation**:
  - 100% preservation of all backend endpoints, MongoDB Atlas integration, authentication tokens/cookies, role-based access, and client-server contracts.
  - Zero mock data or placeholder widgets replacing functional features.
- [x] **Complete Screen Redesign Across Modules 1–4**:
  - **Module 1:** Login, Register, Student Dashboard, User Profile & Settings.
  - **Module 2:** Events Listing, Event Details, My Events passes, Announcements notice board.
  - **Module 3:** Groups Discovery, Group Details Hub (Discussions, Roster, Requests, Rules), Create Group, Edit Group, My Groups.
  - **Module 4:** Discussions Feed, Discussion Details, Create Discussion, Edit Discussion, My Discussions, Saved Discussions.
  - **Administration:** Admin Dashboard Console, Admin Events Management, Admin Announcements Publishing, Moderation Reports Queue.

---

## 3. Build & Test Results

### Module 4 Automated Integration Test Suite (`node src/tests/testModule4.js`)
- **Suite:** `server/src/tests/testModule4.js`
- **Result:** **42 passed, 0 failed** directly against MongoDB Atlas
  - Student 1 & 2 registration & JWT token generation: PASSED
  - Admin login: PASSED
  - Public discussions feed & array structure: PASSED
  - Question post creation with verified author derivation: PASSED
  - Post detail retrieval & atomic view counter increment: PASSED
  - Answer comment creation & atomic commentCount increment: PASSED
  - Unauthorized answer acceptance rejection (403): PASSED
  - Question owner marks accepted answer & status becomes resolved: PASSED
  - Upvote recording & atomic increment: PASSED
  - Duplicate vote prevention: PASSED
  - Upvote removal & atomic decrement: PASSED
  - Bookmark post & retrieve from `/api/discussions/saved`: PASSED
  - Authored posts retrieval from `/api/discussions/my-posts`: PASSED
  - Content report submission: PASSED
  - Student blocked from moderation queue (403): PASSED
  - Admin access to moderation queue & report retrieval: PASSED
  - Admin report resolution by dismissal: PASSED
  - Post updating by author: PASSED
  - Post cascade deletion (comments, votes, bookmarks cleaned up): PASSED
  - **Regression Checks on Modules 1, 2, and 3:**
    - Module 1/Core: Health check healthy (`GET /api/health` 200) — PASSED
    - Module 1: Events retrieval (`GET /api/events` 200) — PASSED
    - Module 2: Announcements retrieval (`GET /api/announcements` 200) — PASSED
    - Module 3: Groups & Communities retrieval (`GET /api/groups` 200) — PASSED

### Modules 1–3 Complete Backend Test Suite (`node src/tests/runTests.js`)
- **Suite:** `server/src/tests/runTests.js`
- **Result:** **60 passed, 0 failed**
  - Group 1: System Health (2 tests) — PASSED
  - Group 2: Authentication & Registration (8 tests) — PASSED
  - Group 3: User Profile & Security (3 tests) — PASSED
  - Group 4: Admin Authorization & Roles (2 tests) — PASSED
  - Group 5: Events Module (9 tests) — PASSED
  - Group 6: Announcements Module (6 tests) — PASSED
  - Group 7: Groups & Communities Module (30 tests) — PASSED
    - Groups discovery & MongoDB Atlas retrieval
    - Group creation with owner assignment
    - Public group direct join & duplicate prevention
    - Private group join request & duplicate prevention
    - Non-member access block on requests
    - Owner request approval workflow
    - Role promotion to moderator
    - Member discussion post publication
    - Post comments creation & counter sync
    - My Groups retrieval & role verification
    - Sole-owner leave protection
    - Member leave execution
    - Cascade cleanup upon group deletion

### Frontend Production Build (`npm --prefix client run build`)
- **Tool:** Vite v6.4.4
- **Result:** **Success (Exit code: 0)**
  - 1,760 modules transformed into production assets in `client/dist`.
  - Zero syntax, import, or CSS bundling errors. Built in 3.85s.

---

## 3. UniVerse Master Enhancement Implementation

### 1. Three Administrative Levels & Role Governance
- **Level 1: Main College Administrator (`main_admin`)**:
  - Highest platform authority; provisioned via secure bootstrap seed script (`server/src/scripts/seedAdmin.js`).
  - Exclusive permissions: Promote/demote users to/from `admin` role, approve/reject Official College Club charter proposals, appoint/remove faculty advisors, and publish official campus-wide announcements.
  - Hardened security: ordinary admins cannot promote users to admin or approve club charters; self-demotion/deactivation of `main_admin` strictly forbidden.
- **Level 2: Group Owners and Club Leadership**:
  - Personal Group Owners: manage personal study circles, generate QR invitations, upload notes, schedule timetable activities, and moderate group members.
  - Chartered College Club Leaders: hierarchical leadership positions (`Secretary General`, `General Secretary`, `Joint Secretary`, `Executive Member`, `Coordinator`), faculty advisor spotlight, manage official club member rosters, and publish official club events integrated with campus calendar.
- **Level 3: Students & Platform Members**:
  - Browse chartered clubs, submit club proposals with nominated advisors, join personal groups via QR tokens, share notes, discover campus forms/opportunities, manage deadline wishlists, and configure independent notification preferences.

### 2. Groups & Communities 2-Tier Architecture
- **Personal Groups (`/groups`)**: Student-founded informal communities with owner governance.
- **Official College Clubs (`/clubs`, `/clubs/:id`)**:
  - Institutionally recognized clubs across 7 categories (`Technical`, `Cultural`, `Sports`, `Academic`, `Arts & Media`, `Social Impact`, `Entrepreneurship`).
  - Rich profile showcase: Faculty Advisor card with department/contact, leadership board, member directory, and linked official club events.
- **Club Proposal Workflow (`/clubs/propose`, `/admin/clubs`)**:
  - Multi-field student proposal form: club name, category, mission statement, planned activities, membership criteria, nominated faculty advisor, and student leader roster.
  - Main Admin review console: live status filtering (`pending`, `under_review`, `approved`, `rejected`), faculty advisor assignment modal, and instant club chartering upon approval.

### 3. Group QR Code Invitations & Scannable Access
- **QR Token Generation (`POST /api/groups/:id/invitations`)**:
  - Cryptographically secure 40-character invitation token with expiration and max-use controls.
  - Interactive QR Modal: High-resolution QR code rendering, direct join link copy, and PNG download.
- **Scan-to-Join Endpoint (`GET & POST /api/groups/join/qr/:token`)**:
  - Students scan QR code to inspect group preview and join instantly with automated member count updates and duplicate prevention.

### 4. Group Collaboration: Shared Study Notes & Timetables
- **Shared Resources (`GroupResource`, `/api/groups/:id/resources`)**:
  - Upload notes, lecture slides, past exams, reference links, and documents.
  - Categorized tagging, download tracking, author attribution, and owner deletion permissions.
- **Timetable & Activity Scheduling (`GroupActivity`, `/api/groups/:id/activities`)**:
  - Schedule study sessions, project syncs, exam prep, and review sessions.
  - Date/time validation, location details, meeting links, and attendee RSVPs.

### 5. Forgot Password with Email OTP Verification
- **Secure 3-Step Flow (`/login`)**:
  - **Step 1: Request OTP (`POST /api/auth/forgot-password`)**: Validates campus email, generates 6-digit numeric OTP, bcrypt hashes it in `PasswordResetOtp` with 5-minute TTL, rate-limited to 3 requests per 15 minutes, and dispatches UniVerse branded email.
  - **Step 2: Verify OTP (`POST /api/auth/verify-otp`)**: Validates OTP with max-attempt protection (invalidated after 3 failed tries) and issues an ephemeral, single-use `resetToken`.
  - **Step 3: Reset Password (`POST /api/auth/reset-password`)**: Accepts `resetToken` and new password, updates user credentials with bcrypt hash, invalidates token, and sends confirmation notification.

### 6. Campus Forms Discovery, Wishlist & Daily Reminders
- **Forms Discovery Feed (`/forms`)**:
  - Official campus opportunities across 8 categories: `Scholarship`, `Internship`, `Club Recruitment`, `Hostel Application`, `Exam Registration`, `Campus Job`, `Event Registration`, `Other`.
  - Cards feature days-remaining countdown, eligibility, deadlines, external links, and bookmark actions.
- **Student Wishlist (`/forms/wishlist`)**:
  - Saved opportunities tracking with custom reminder frequency toggles (`daily`, `3_days_before`, `1_day_before`).
- **Automated Daily Reminder Scheduler (`server/src/services/formReminderScheduler.js`)**:
  - Nightly cron (`0 8 * * *`) and on-demand manual trigger (`POST /api/forms/reminders/trigger`).
  - Scans active wishlists for open forms ending within 7 days.
  - Database-backed idempotency (`FormReminderLog` keyed on `{ user, form, reminderDate: YYYY-MM-DD }`) prevents spam and duplicate emails on repeated runs.

### 7. Independent In-App and Email Notification Preferences
- **Granular Toggles (`/settings/notifications`)**:
  - Fully decoupled in-app notifications and email notifications for 8 categories: Events, Announcements, Groups, Discussions, Campus Issues, Club Updates, Form Deadlines, and System Alerts.
  - Single-click toggle switches with instant persistence in MongoDB Atlas.

### 8. Theme Bug Fixes & Design System Integrity
- **Dark Mode Input Audit**:
  - Configured custom `slate-850: '#172033'` in `client/tailwind.config.js`.
  - Repaired dark mode background contrast across 13 components (including group comments, discussion replies, issue filters, and search inputs).
  - High-contrast placeholders, text colors, and borders in both Light and Dark modes.

---

## 4. Environment Configuration
The application is configured to connect to MongoDB Atlas via standard environment variables:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<db_username>:<db_password>@<cluster-address>/universe?retryWrites=true&w=majority
DB_NAME=universe
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@universe.edu
ADMIN_PASSWORD=your_admin_secure_password
MAIN_ADMIN_EMAIL=admin@universe.edu
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=campus.universe.portal@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="UniVerse Portal" <campus.universe.portal@gmail.com>
```
- **Database Name:** `universe`
- **Total Automated Test Suites Executed Against MongoDB Atlas:**
  - **Master Enhancements (Admin Levels, Clubs, QR, OTP, Forms, Reminders):** 27 PASSED, 0 FAILED
  - **Module 6 (Admin, Notifications & Discovery):** 36 PASSED, 0 FAILED
  - **Module 5 (Campus Issues & Resolution):** 48 PASSED, 0 FAILED
  - **Module 4 (Discussions & Content):** 42 PASSED, 0 FAILED
  - **Grand Total:** **153 PASSED, 0 FAILED across comprehensive live test suites.**
- **Frontend Production Build:** 1,760 modules transformed, 0 errors.

