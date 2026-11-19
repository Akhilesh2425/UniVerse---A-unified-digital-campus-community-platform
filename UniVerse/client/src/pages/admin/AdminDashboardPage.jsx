import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import api from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import {
  ShieldAlert,
  Users,
  Calendar,
  Bell,
  MessagesSquare,
  AlertTriangle,
  History,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Building,
  Flag,
  Wrench,
  Clock,
} from 'lucide-react';

const AdminDashboardPage = () => {
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [overviewRes, activityRes, analyticsRes, healthRes] = await Promise.all([
          adminApi.getDashboardOverview().catch(() => ({ statistics: null })),
          adminApi.getDashboardActivity().catch(() => ({ activities: [] })),
          adminApi.getDashboardAnalytics().catch(() => ({ analytics: null })),
          api.get('/health').catch(() => ({ data: { status: 'unknown' } })),
        ]);

        setOverview(overviewRes?.statistics || null);
        setActivity(activityRes?.activities || []);
        setAnalytics(analyticsRes?.analytics || null);
        setHealth(healthRes?.data || null);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
          Loading centralized administrator console...
        </p>
      </div>
    );
  }

  const isDbConnected = health?.database?.isConnected;
  const users = overview?.users || {};
  const events = overview?.events || {};
  const announcements = overview?.announcements || {};
  const groups = overview?.groups || {};
  const discussions = overview?.discussions || {};
  const issues = overview?.issues || {};

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                UniVerse Command Center
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Centralized platform monitoring, user administration, campus issues, and audit logs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 text-xs font-semibold shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-700 dark:text-slate-300">
              MongoDB Atlas: {isDbConnected ? 'Connected' : 'Degraded'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-brand-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                User Management
              </h3>
            </div>
            <Link
              to="/admin/users"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {users.total || 0}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Students: <strong className="text-slate-800 dark:text-slate-200">{users.students || 0}</strong></span>
            <span>•</span>
            <span>Admins: <strong className="text-slate-800 dark:text-slate-200">{users.admins || 0}</strong></span>
            <span>•</span>
            <span className="text-emerald-600 font-medium">+{users.newLast30Days || 0} this mo</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Campus Issues
              </h3>
            </div>
            <Link
              to="/admin/issues"
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
            >
              Workspace <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {issues.total || 0}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Review: <strong className="text-amber-600">{issues.underReview || 0}</strong></span>
            <span>•</span>
            <span>In Progress: <strong className="text-blue-600">{issues.inProgress || 0}</strong></span>
            <span>•</span>
            <span>Resolved: <strong className="text-emerald-600">{issues.resolved || 0}</strong></span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Events & Attendance
              </h3>
            </div>
            <Link
              to="/admin/events"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {events.total || 0}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Upcoming: <strong className="text-slate-800 dark:text-slate-200">{events.upcoming || 0}</strong></span>
            <span>•</span>
            <span>Registrations: <strong className="text-indigo-600">{events.totalRegistrations || 0}</strong></span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Student Communities
              </h3>
            </div>
            <Link
              to="/groups"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              Hub <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {groups.total || 0}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Public: <strong className="text-slate-800 dark:text-slate-200">{groups.public || 0}</strong></span>
            <span>•</span>
            <span>Private: <strong className="text-slate-800 dark:text-slate-200">{groups.private || 0}</strong></span>
            <span>•</span>
            <span>Memberships: <strong className="text-emerald-600">{groups.totalMemberships || 0}</strong></span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <MessagesSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Discussions & Answers
              </h3>
            </div>
            <Link
              to="/moderation/reports"
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
            >
              Moderation <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {discussions.total || 0}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Questions: <strong className="text-slate-800 dark:text-slate-200">{discussions.questions || 0}</strong></span>
            <span>•</span>
            <span>Resolved: <strong className="text-emerald-600">{discussions.resolved || 0}</strong></span>
            <span>•</span>
            <span>Comments: <strong className="text-purple-600">{discussions.comments || 0}</strong></span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Circulars & Notices
              </h3>
            </div>
            <Link
              to="/admin/announcements"
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
            >
              Publish <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {announcements.total || 0}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Published: <strong className="text-emerald-600">{announcements.published || 0}</strong></span>
            <span>•</span>
            <span>Drafts: <strong className="text-slate-400">{announcements.drafts || 0}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#172033] rounded-2xl p-6 text-slate-900 dark:text-white border border-slate-200/90 dark:border-[#334155] shadow-xs">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              Administrative Operations & Governance
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#A8B4C7] mb-5 max-w-xl">
              Access platform administration, assign student roles, monitor security audit records, and resolve campus requests.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link
                to="/admin/users"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold border border-slate-200 dark:border-[#334155] transition shadow-xs flex items-center gap-1.5"
              >
                <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                User Accounts
              </Link>
              <Link
                to="/admin/issues"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Wrench className="w-4 h-4" />
                Issues Workspace
              </Link>
              <Link
                to="/admin/audit-logs"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 flex items-center gap-1.5"
              >
                <History className="w-4 h-4 text-cyan-300" />
                Security Audit Logs
              </Link>
              <Link
                to="/admin/events"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-indigo-300" />
                Events Console
              </Link>
              <Link
                to="/admin/announcements"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 flex items-center gap-1.5"
              >
                <Bell className="w-4 h-4 text-rose-300" />
                Notices
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Department Enrollment Distribution
            </h3>
            {users.departmentDistribution && users.departmentDistribution.length > 0 ? (
              <div className="space-y-3">
                {users.departmentDistribution.map((dept) => {
                  const percent = Math.min(
                    100,
                    Math.round((dept.count / (users.total || 1)) * 100)
                  );
                  return (
                    <div key={dept.department} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">
                          {dept.department}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {dept.count} students ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                No department breakdown available.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Live Activity Stream
              </h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
              Real-time
            </span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[460px] pr-1">
            {activity.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                No platform activity recorded yet.
              </div>
            ) : (
              activity.map((act) => (
                <div
                  key={`${act.kind}-${act.id}`}
                  className="flex items-start gap-3 text-xs"
                >
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {act.title}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {act.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                      <span>{act.actor}</span>
                      <span>•</span>
                      <span>
                        {new Date(act.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 text-center">
            <Link
              to="/admin/audit-logs"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center justify-center gap-1"
            >
              View Detailed Security Audit Trail
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
