import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/guards/ProtectedRoute';
import AdminRoute from './components/guards/AdminRoute';
import PublicOnlyRoute from './components/guards/PublicOnlyRoute';
import { useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import EventsListPage from './pages/events/EventsListPage';
import EventDetailsPage from './pages/events/EventDetailsPage';
import MyEventsPage from './pages/events/MyEventsPage';
import AnnouncementsListPage from './pages/announcements/AnnouncementsListPage';
import ProfilePage from './pages/profile/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';

// Module 3: Groups & Communities Pages
import GroupsListPage from './pages/groups/GroupsListPage';
import GroupDetailsPage from './pages/groups/GroupDetailsPage';
import CreateGroupPage from './pages/groups/CreateGroupPage';
import EditGroupPage from './pages/groups/EditGroupPage';
import MyGroupsPage from './pages/groups/MyGroupsPage';

// Module 4: Discussions & Content Pages
import DiscussionsFeedPage from './pages/discussions/DiscussionsFeedPage';
import DiscussionDetailsPage from './pages/discussions/DiscussionDetailsPage';
import CreateDiscussionPage from './pages/discussions/CreateDiscussionPage';
import EditDiscussionPage from './pages/discussions/EditDiscussionPage';
import MyDiscussionsPage from './pages/discussions/MyDiscussionsPage';
import SavedDiscussionsPage from './pages/discussions/SavedDiscussionsPage';
import ModerationReportsPage from './pages/admin/ModerationReportsPage';

// Root redirect component
const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? '/dashboard' : '/events'} replace />;
};

// 404 Page
const NotFoundPage = () => (
  <div className="py-24 text-center max-w-md mx-auto">
    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-2xl mx-auto mb-4">
      404
    </div>
    <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
    <p className="text-sm text-slate-500 mt-2 mb-6">
      The campus page or resource you requested does not exist or has been moved.
    </p>
    <Link
      to="/"
      className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
    >
      Return to Campus Hub
    </Link>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Public Only Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      {/* Main Application with AppLayout */}
      <Route element={<AppLayout />}>
        {/* Root Redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public / Semi-Public Discovery Routes */}
        <Route path="/events" element={<EventsListPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
        <Route path="/announcements" element={<AnnouncementsListPage />} />
        <Route path="/groups" element={<GroupsListPage />} />
        <Route path="/groups/:id" element={<GroupDetailsPage />} />
        <Route path="/discussions" element={<DiscussionsFeedPage />} />
        <Route path="/discussions/:id" element={<DiscussionDetailsPage />} />

        {/* Protected Authenticated Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-events"
          element={
            <ProtectedRoute>
              <MyEventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Module 3: Groups Authenticated Management */}
        <Route
          path="/groups/create"
          element={
            <ProtectedRoute>
              <CreateGroupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:id/edit"
          element={
            <ProtectedRoute>
              <EditGroupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-groups"
          element={
            <ProtectedRoute>
              <MyGroupsPage />
            </ProtectedRoute>
          }
        />

        {/* Module 4: Discussions Authenticated Management */}
        <Route
          path="/discussions/create"
          element={
            <ProtectedRoute>
              <CreateDiscussionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discussions/:id/edit"
          element={
            <ProtectedRoute>
              <EditDiscussionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discussions/my-posts"
          element={
            <ProtectedRoute>
              <MyDiscussionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discussions/saved"
          element={
            <ProtectedRoute>
              <SavedDiscussionsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin-Only Management Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <AdminRoute>
              <AdminEventsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <AdminRoute>
              <AdminAnnouncementsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/moderation/reports"
          element={
            <AdminRoute>
              <ModerationReportsPage />
            </AdminRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
