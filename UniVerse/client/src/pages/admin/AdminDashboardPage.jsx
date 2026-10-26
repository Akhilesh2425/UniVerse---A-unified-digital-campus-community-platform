import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../../api/eventApi';
import { announcementApi } from '../../api/announcementApi';
import api from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import {
  ShieldAlert,
  Calendar,
  Bell,
  Users,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    eventsCount: 0,
    announcementsCount: 0,
    health: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminOverview = async () => {
      try {
        setLoading(true);
        const [eventsRes, announcementsRes, healthRes] = await Promise.all([
          eventApi.getEvents({ timeframe: 'all' }),
          announcementApi.getAnnouncements({ includeDrafts: 'true' }),
          api.get('/health').catch(() => ({ data: { status: 'unknown' } })),
        ]);

        setStats({
          eventsCount: eventsRes?.events?.length || 0,
          announcementsCount: announcementsRes?.announcements?.length || 0,
          health: healthRes?.data || null,
        });
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminOverview();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading administrative console...</p>
      </div>
    );
  }

  const isDbConnected = stats.health?.database?.isConnected;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Administrator Console
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage campus events, publish official circulars, and monitor database health
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/events"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Manage Events
          </Link>
          <Link
            to="/admin/announcements"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Manage Notices
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Events Stat */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Events</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.eventsCount}</p>
            <Link
              to="/admin/events"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Open Event Manager <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Notices Stat */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Announcements</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.announcementsCount}</p>
            <Link
              to="/admin/announcements"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Open Notice Manager <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
        </div>

        {/* Database Health Stat */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Connection</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isDbConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <p className="text-lg font-bold text-slate-900 capitalize">
                {stats.health?.database?.status || 'Unknown'}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 truncate max-w-[180px]">
              Host: {stats.health?.database?.host || 'Disconnected'}
            </p>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isDbConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            <Database className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Admin Modules Quick Launch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-lg space-y-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-indigo-300" />
          </div>
          <h2 className="text-xl font-bold">Campus Events Management</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Create technical symposiums, sports tournaments, and club activities. Monitor student capacity, set registration deadlines, view attendee rosters, and update details.
          </p>
          <div className="pt-2">
            <Link
              to="/admin/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Launch Event Manager
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-8 text-white shadow-lg space-y-4 border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-violet-300" />
          </div>
          <h2 className="text-xl font-bold">Campus Notices & Announcements</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Publish academic notices, exam circulars, and emergency campus updates. Manage drafts securely before public release to verified students.
          </p>
          <div className="pt-2">
            <Link
              to="/admin/announcements"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition shadow-sm"
            >
              Launch Notice Manager
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
