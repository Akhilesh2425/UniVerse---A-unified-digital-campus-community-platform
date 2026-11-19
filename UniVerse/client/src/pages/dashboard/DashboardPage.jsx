import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventApi } from '../../api/eventApi';
import { announcementApi } from '../../api/announcementApi';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import {
  Calendar,
  Bell,
  BookmarkCheck,
  ArrowRight,
  MapPin,
  Clock,
  Users,
  AlertCircle,
  MessagesSquare,
  Compass,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [eventsRes, registrationsRes, announcementsRes] = await Promise.all([
          eventApi.getEvents({ timeframe: 'upcoming', sort: 'date-asc' }),
          user?.role === 'student'
            ? eventApi.getMyRegistrations()
            : Promise.resolve({ registrations: [] }),
          announcementApi.getAnnouncements(),
        ]);

        if (eventsRes && eventsRes.events) {
          setUpcomingEvents(eventsRes.events.slice(0, 4)); 
        }

        if (registrationsRes && registrationsRes.registrations) {
          setMyRegistrations(registrationsRes.registrations.slice(0, 3));
        }

        if (announcementsRes && announcementsRes.announcements) {
          setAnnouncements(announcementsRes.announcements.slice(0, 4)); 
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">Loading campus dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-white dark:bg-[#172033] border border-slate-200/90 dark:border-[#334155] p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-[#1E293B] p-1 border border-slate-200 dark:border-[#334155] flex items-center justify-center shrink-0">
              <img src="/logo.jpeg" alt="UniVerse Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                {isAdmin ? 'Campus Administration' : 'Student Portal'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Welcome back, {user?.name}!
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-[#A8B4C7] leading-relaxed">
            {user?.department || 'Student'} • {user?.academicYear || 'Campus Member'} &mdash; Stay updated with upcoming events, active student groups, discussions, and verified notices.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition shadow-xs"
            >
              <Calendar className="w-4 h-4" />
              Campus Events
            </Link>
            <Link
              to="/groups"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-[#334155] transition"
            >
              <Users className="w-4 h-4 text-brand-500" />
              Student Groups
            </Link>
            <Link
              to="/discussions"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-[#334155] transition"
            >
              <MessagesSquare className="w-4 h-4 text-brand-500" />
              Discussions
            </Link>
            <Link
              to="/issues"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-[#334155] transition"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Campus Issues
            </Link>
            {!isAdmin && myRegistrations.length > 0 && (
              <Link
                to="/my-events"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition"
              >
                <BookmarkCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                My Registrations ({myRegistrations.length})
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800 transition shadow-2xs"
              >
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {user?.role === 'student' && myRegistrations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Next Registered Event</h2>
                </div>
                <Link
                  to="/my-events"
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  View All ({myRegistrations.length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {myRegistrations[0]?.event && (
                <div className="bg-gradient-to-r from-emerald-50/70 to-teal-50/70 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="success">Confirmed Ticket</Badge>
                        <Badge variant={myRegistrations[0].event.category}>
                          {myRegistrations[0].event.category}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {myRegistrations[0].event.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          {formatDate(myRegistrations[0].event.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          {myRegistrations[0].event.venue}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/events/${myRegistrations[0].event._id}`}
                      className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
                    >
                      View Pass & Details
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Featured Upcoming Events</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Explore hackathons, workshops, and competitions</p>
              </div>
              <Link
                to="/events"
                className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                Browse All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No upcoming events scheduled</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Check back later for new campus activities.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcomingEvents.map((evt) => (
                  <Link
                    key={evt._id}
                    to={`/events/${evt._id}`}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden hover:shadow-lg dark:hover:shadow-black/50 hover:border-brand-200 dark:hover:border-brand-800 transition-all flex flex-col justify-between"
                  >
                    {evt.posterUrl ? (
                      <div className="h-36 w-full overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                        <img
                          src={evt.posterUrl}
                          alt={evt.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge variant={evt.category}>{evt.category}</Badge>
                        </div>
                        {evt.isUserRegistered && (
                          <div className="absolute top-3 right-3">
                            <Badge variant="success">Registered</Badge>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-24 bg-gradient-to-r from-slate-100 to-brand-50 dark:from-slate-850 dark:to-slate-800 p-4 flex items-start justify-between">
                        <Badge variant={evt.category}>{evt.category}</Badge>
                        {evt.isUserRegistered && <Badge variant="success">Registered</Badge>}
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                          {evt.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                          <span>{formatDate(evt.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                          <span className="truncate">{evt.venue}</span>
                        </div>
                        {evt.maxCapacity && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>
                              {evt.remainingSpots !== null
                                ? `${evt.remainingSpots} spots remaining`
                                : 'Open registration'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Campus Notices</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Official circulars & deadlines</p>
            </div>
            <Link
              to="/announcements"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              All Notices
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 text-center">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No active notices</p>
              </div>
            ) : (
              announcements.map((item) => (
                <div
                  key={item._id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.priority === 'important'
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-300 dark:hover:border-rose-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={item.category} size="xs">
                      {item.category}
                    </Badge>
                    {item.priority === 'important' && (
                      <Badge variant="important" size="xs">
                        Important
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-3 leading-relaxed">
                    {item.content}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {item.publishedAt
                        ? new Date(item.publishedAt).toLocaleDateString()
                        : 'Recent'}
                    </span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">{item.author?.name || 'Admin'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
