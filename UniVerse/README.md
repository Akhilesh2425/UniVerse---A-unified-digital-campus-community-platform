# UniVerse — Unified Digital Campus Platform

UniVerse is a full-stack college campus web application built with the **MERN stack** (MongoDB Atlas, Express.js, React.js, Node.js) and styled with Tailwind CSS.

It provides an authenticated, campus-specific experience connecting students to campus events, activity registrations, and official announcements.

---

## 1. Strict Scope Restriction

UniVerse is designed and implemented exclusively for:

1. **Module 1 — Authentication & User Management**
   - Student registration with field validation, department, and academic year.
   - Secure password hashing using `bcryptjs`.
   - JWT authentication via HTTP-only cookies and Authorization headers.
   - Session restoration on page refresh (`GET /api/auth/me`).
   - Role-based authorization (`student` vs. `admin`) enforced by Express middleware and React route guards.
   - Student profile viewing and editing with protection against privilege escalation.
   - Secure administrator initialization via seed script.

2. **Module 2 — Events & Announcements**
   - Event discovery with search, category filtering, and timeframe sorting.
   - Detailed event pages with capacity indicators, deadlines, and venue details.
   - Event registration with duplicate prevention and atomic capacity management.
   - Dedicated "My Events" view with one-click cancellation.
   - Admin event management (Create, Edit, Delete with cascade cleanup, Attendee roster).
   - Campus announcements with category filtering and prominent priority flags (`important`).
   - Admin announcement management with draft vs. published controls.

3. **Module 3 — Groups & Communities**
   - Community discovery with real-time text search, category filtering (10 categories), and sorting.
   - Public vs. Private community access policies (direct join vs. moderated approval).
   - Dedicated community hubs with tabbed views: Discussion feed, Roster, Join Requests, Rules.
   - Database-backed membership system (`GroupMembership`, compound unique index `{ group: 1, user: 1 }`).
   - Group discussion threads and comment system with author attribution and real-time counts.
   - Dedicated "My Groups" management dashboard with role indicators (Owner, Moderator, Member).
   - Safe cascading deletion and sole-owner leave protections.

---

## 2. Architecture Overview

```text
React (Vite) + Tailwind CSS + Axios
               ↕ (REST APIs with withCredentials & Bearer Token fallback)
Express REST API (CORS, Cookie Parser, Error Handling)
               ↕ (JWT Authentication & Role Middleware)
Controllers & Business Logic (Capacity checks, cascade deletes, group roles)
               ↕ (Mongoose ODM)
MongoDB Atlas / Persistent MongoDB (users, events, announcements, groups, memberships, requests, posts, comments)
```

### Folder Structure

```text
universe/
├── package.json                   # Root orchestrator scripts
├── README.md                      # Comprehensive guide
├── IMPLEMENTATION_STATUS.md       # Verification & test status log
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/                   # Centralized Axios client & modular API services
│   │   │   ├── axios.js
│   │   │   ├── authApi.js
│   │   │   ├── userApi.js
│   │   │   ├── eventApi.js
│   │   │   ├── announcementApi.js
│   │   │   └── groupApi.js
│   │   ├── components/
│   │   │   ├── common/            # Navbar, Footer, Badge, Modal, Spinner, ConfirmDialog
│   │   │   ├── guards/            # ProtectedRoute, AdminRoute, PublicOnlyRoute
│   │   │   └── layout/            # AppLayout
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Session restoration, login, logout, user state
│   │   ├── pages/
│   │   │   ├── auth/              # LoginPage, RegisterPage
│   │   │   ├── dashboard/         # DashboardPage
│   │   │   ├── events/            # EventsListPage, EventDetailsPage, MyEventsPage
│   │   │   ├── announcements/     # AnnouncementsListPage
│   │   │   ├── profile/           # ProfilePage
│   │   │   ├── admin/             # AdminDashboardPage, AdminEventsPage, AdminAnnouncementsPage
│   │   │   └── groups/            # GroupsListPage, GroupDetailsPage, CreateGroupPage, EditGroupPage, MyGroupsPage
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── server/
│   ├── server.js                  # Entry point with graceful shutdown
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── app.js                 # Express setup, CORS, routes, error handler
│       ├── config/
│       │   └── db.js              # Mongoose Atlas connection & health check
│       ├── controllers/           # Auth, User, Event, Announcement controllers
│       ├── middleware/            # JWT auth, role guards, centralized error handler
│       ├── models/                # User, Event, EventRegistration, Announcement
│       ├── routes/                # authRoutes, userRoutes, eventRoutes, announcementRoutes
│       ├── scripts/               # seedAdmin.js, seedDemo.js
│       ├── tests/                 # runTests.js (automated 34-test suite)
│       └── utils/                 # constants.js, jwt.js
```

---

## 3. Technology Stack

- **Frontend:** React 18, Vite, React Router v6, Tailwind CSS, Axios, Lucide React icons
- **Backend:** Node.js (ES Modules), Express.js, Mongoose, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `cors`, `dotenv`
- **Database:** MongoDB Atlas (or local MongoDB for development)
- **Node Version:** v20+ recommended (verified on Node v24.14.0)

---

## 4. Setup & Installation

### Step 1: Install Dependencies
From the repository root:

```bash
# Install root orchestration tools
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

---

### Step 2: Configure Environment Variables

#### Backend Configuration (`server/.env`)
Create a `.env` file in the `server` directory (reference `server/.env.example`):

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection URI
# Replace with your actual Atlas connection string:
MONGO_URI=mongodb://127.0.0.1:27017/universe

# JWT Secret for Session Signing
JWT_SECRET=super_secret_universe_jwt_key_college_2026_xyz

# Frontend Client URL for CORS
CLIENT_URL=http://localhost:5173

# Initial Administrator Credentials (used by seed:admin)
ADMIN_EMAIL=admin@universe.edu
ADMIN_PASSWORD=AdminSecure2026!
```

#### Frontend Configuration (`client/.env`)
Create a `.env` file in the `client` directory (reference `client/.env.example`):

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 5. MongoDB Atlas Setup Guide

To connect UniVerse to MongoDB Atlas:

1. **Create an Atlas Account & Cluster:**
   - Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas).
   - Create a free shared cluster (M0).
2. **Create a Database User:**
   - Under **Security** → **Database Access**, click **Add New Database User**.
   - Choose **Password Authentication** and set a username and strong password.
   - Assign the **Read and write to any database** privilege.
3. **Configure Network Access:**
   - Under **Security** → **Network Access**, click **Add IP Address**.
   - For development, add your current IP address (or `0.0.0.0/0` with proper credential protection).
4. **Obtain Connection String:**
   - Under **Database Deployments**, click **Connect** → **Drivers** (Node.js).
   - Copy the SRV URI:
     ```text
     mongodb+srv://<db_user>:<db_password>@cluster0.abcde.mongodb.net/universe?retryWrites=true&w=majority
     ```
5. **Update `server/.env`:**
   - Set `MONGO_URI` to your Atlas connection string.
   - UniVerse will automatically connect, build schema indexes, and log a credential-masked connection message.

---

## 6. Initializing the Administrator & Demo Data

UniVerse includes dedicated scripts to safely initialize administrators and populate realistic demo events and announcements:

```bash
# 1. Initialize First Administrator (reads ADMIN_EMAIL & ADMIN_PASSWORD from server/.env)
npm run seed:admin

# 2. Seed Realistic Campus Events and Notices
npm run seed:demo
```

### Default Evaluation Credentials:
- **Administrator:** `admin@universe.edu` / `AdminSecure2026!`
- **New Students:** Register any student account on `http://localhost:5173/register`

---

## 7. Running the Application

### Option A: Run Both Client & Server Concurrently (Recommended)
From the root directory:

```bash
npm run dev
```

### Option B: Run Individually
In separate terminal windows:

```bash
# Terminal 1 - Backend Server
cd server
npm run dev

# Terminal 2 - Frontend Client
cd client
npm run dev
```

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check Endpoint:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 8. Verification & Automated Testing

### Backend Integration Test Suite
UniVerse comes with an automated integration test suite testing all endpoints, role boundaries, atomic capacities, and validation errors:

```bash
npm run test:server
```
*(Result: 34 / 34 tests passing)*

### Frontend Production Build
Validate that the client bundles cleanly for production deployment:

```bash
npm run build:client
```
*(Result: 0 errors, production assets output to `client/dist`)*

---

## 9. API Reference

### Health
- `GET /api/health` — System status, uptime, and live database connection health.

### Module 1: Auth & User Management
- `POST /api/auth/register` — Student registration (strictly assigns `student` role).
- `POST /api/auth/login` — Email/password login, issues HTTP-only JWT cookie.
- `POST /api/auth/logout` — Clears JWT cookie.
- `GET  /api/auth/me` — Session restoration for authenticated requests.
- `GET  /api/users/me` — Authenticated profile view.
- `PATCH /api/users/me` — Update profile (name, department, year, interests, avatar; blocks role tampering).

### Module 2: Events
- `GET    /api/events` — List events (filters: `search`, `category`, `timeframe`, `sort`).
- `GET    /api/events/:id` — Event details.
- `GET    /api/events/my-registrations` — Authenticated student's registered events.
- `POST   /api/events/:id/register` — Register student (atomic capacity & deadline checks).
- `DELETE /api/events/:id/register` — Cancel registration.
- `POST   /api/events` — Admin: create event.
- `PATCH  /api/events/:id` — Admin: edit event.
- `DELETE /api/events/:id` — Admin: delete event (cascades registration deletion).
- `GET    /api/events/:id/registrations` — Admin: view attendee roster.

### Module 2: Announcements
- `GET    /api/announcements` — List announcements (students: `isPublished: true`; admins: all).
- `GET    /api/announcements/:id` — Announcement details.
- `POST   /api/announcements` — Admin: create announcement.
- `PATCH  /api/announcements/:id` — Admin: edit announcement / toggle published state.
- `DELETE /api/announcements/:id` — Admin: delete announcement.
