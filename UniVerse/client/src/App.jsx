import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/guards/ProtectedRoute';
import AdminRoute from './components/guards/AdminRoute';
import PublicOnlyRoute from './components/guards/PublicOnlyRoute';
import { useAuth } from './context/AuthContext';

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

import GroupsListPage from './pages/groups/GroupsListPage';
import GroupDetailsPage from './pages/groups/GroupDetailsPage';
import CreateGroupPage from './pages/groups/CreateGroupPage';
import EditGroupPage from './pages/groups/EditGroupPage';
import MyGroupsPage from './pages/groups/MyGroupsPage';

import DiscussionsFeedPage from './pages/discussions/DiscussionsFeedPage';
import DiscussionDetailsPage from './pages/discussions/DiscussionDetailsPage';
import CreateDiscussionPage from './pages/discussions/CreateDiscussionPage';
import EditDiscussionPage from './pages/discussions/EditDiscussionPage';
import MyDiscussionsPage from './pages/discussions/MyDiscussionsPage';
import SavedDiscussionsPage from './pages/discussions/SavedDiscussionsPage';
import ModerationReportsPage from './pages/admin/ModerationReportsPage';

import IssuesListPage from './pages/issues/IssuesListPage';
import IssueDetailsPage from './pages/issues/IssueDetailsPage';
import CreateIssuePage from './pages/issues/CreateIssuePage';
import MyReportsPage from './pages/issues/MyReportsPage';
import AdminIssuesPage from './pages/admin/AdminIssuesPage';

import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import NotificationPreferencesPage from './pages/notifications/NotificationPreferencesPage';
import SearchPage from './pages/search/SearchPage';
import DiscoverPage from './pages/discover/DiscoverPage';

import ClubsListPage from './pages/clubs/ClubsListPage';
import ClubDetailsPage from './pages/clubs/ClubDetailsPage';
import ProposeClubPage from './pages/clubs/ProposeClubPage';
import AdminClubProposalsPage from './pages/admin/AdminClubProposalsPage';
import FormsListPage from './pages/forms/FormsListPage';
import FormWishlistPage from './pages/forms/FormWishlistPage';
import CreateFormPage from './pages/forms/CreateFormPage';

const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? '/dashboard' : '/events'} replace />;
};

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

      <Route element={<AppLayout />}>
        <Route path="/" element={<RootRedirect />} />

        <Route path="/events" element={<EventsListPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
        <Route path="/announcements" element={<AnnouncementsListPage />} />
        <Route path="/groups" element={<GroupsListPage />} />
        <Route path="/groups/:id" element={<GroupDetailsPage />} />
        <Route path="/clubs" element={<ClubsListPage />} />
        <Route path="/clubs/:id" element={<ClubDetailsPage />} />
        <Route path="/forms" element={<FormsListPage />} />
        <Route path="/discussions" element={<DiscussionsFeedPage />} />
        <Route path="/discussions/:id" element={<DiscussionDetailsPage />} />
        <Route path="/issues" element={<IssuesListPage />} />
        <Route path="/issues/:issueId" element={<IssueDetailsPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/search" element={<SearchPage />} />

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

        <Route
          path="/groups/create"
          element={
            <ProtectedRoute>
              <CreateGroupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clubs/propose"
          element={
            <ProtectedRoute>
              <ProposeClubPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forms/wishlist"
          element={
            <ProtectedRoute>
              <FormWishlistPage />
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

        <Route
          path="/issues/create"
          element={
            <ProtectedRoute>
              <CreateIssuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/issues/my-reports"
          element={
            <ProtectedRoute>
              <MyReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/notifications"
          element={
            <ProtectedRoute>
              <NotificationPreferencesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <AdminRoute>
              <AdminAuditLogsPage />
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
          path="/admin/issues"
          element={
            <AdminRoute>
              <AdminIssuesPage />
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
        <Route
          path="/admin/clubs"
          element={
            <AdminRoute>
              <AdminClubProposalsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/forms/create"
          element={
            <AdminRoute>
              <CreateFormPage />
            </AdminRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
