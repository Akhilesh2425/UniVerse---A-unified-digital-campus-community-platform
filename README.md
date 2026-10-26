# UniVerse — A Unified Digital Campus Community Platform

Welcome to **UniVerse**, a modern, full-stack college campus platform built with the **MERN stack** (MongoDB Atlas, Express.js, React.js, Node.js) and styled with Tailwind CSS.

---

## 📁 Repository Structure

The complete source code is organized inside the [`UniVerse/`](./UniVerse) directory:

```text
UniVerse/
├── client/                     # Frontend React (Vite) + Tailwind CSS application
│   ├── src/
│   │   ├── api/                # Axios API service integrations
│   │   ├── components/         # Modular UI components & route guards
│   │   ├── context/            # AuthContext & state providers
│   │   ├── pages/              # Full page views (Auth, Events, Groups, Discussions, Admin)
│   │   └── App.jsx
│   ├── .env.example            # Client environment template
│   └── package.json
├── server/                     # Backend Express.js REST API
│   ├── src/
│   │   ├── config/             # MongoDB Atlas connection & configurations
│   │   ├── controllers/        # Business logic controllers
│   │   ├── middleware/         # JWT auth, role validation & error handling
│   │   ├── models/             # Mongoose schemas (Users, Events, Groups, Discussions)
│   │   ├── routes/             # REST API endpoint definitions
│   │   ├── scripts/            # Seed scripts for admin & demo data
│   │   └── tests/              # Automated test suites
│   ├── .env.example            # Server environment template
│   └── package.json
├── IMPLEMENTATION_STATUS.md    # Detailed audit, test verification & module architecture
├── README.md                   # Full platform documentation & setup guide
└── package.json                # Root concurrent scripts
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **MongoDB Atlas** database cluster (or local MongoDB)

### 2. Environment Setup
Navigate to the `UniVerse/` directory:
```bash
cd UniVerse
```

#### Server Configuration (`UniVerse/server/.env`):
Copy `.env.example` to `.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_super_secret_key
JWT_EXPIRES_IN=7d
```

#### Client Configuration (`UniVerse/client/.env`):
Copy `.env.example` to `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Installation
Install root, client, and server dependencies:
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 4. Running the Platform
Start both backend and frontend concurrently:
```bash
npm run dev
```

- **Frontend Application:** `http://localhost:5173`
- **Backend REST API:** `http://localhost:5000`

---

## 📚 Platform Modules

- **Module 1: Authentication & User Profiles** — Secure JWT authentication, password hashing with bcrypt, role-based access control (`student` & `admin`), profile management.
- **Module 2: Campus Events & Official Announcements** — Event discovery, atomic RSVP registration, capacity tracking, priority campus notices.
- **Module 3: Student Groups & Communities** — Public/private community hubs, membership roles (Owner, Moderator, Member), join requests, group threads.
- **Module 4: Discussions & Content Platform** — Campus-wide discussion forums, category filtering, threaded comments, voting (upvotes/downvotes), bookmarks, reporting, and moderation dashboard.

For detailed documentation, refer to the [UniVerse Platform Guide](./UniVerse/README.md) and [Implementation Status](./UniVerse/IMPLEMENTATION_STATUS.md).
