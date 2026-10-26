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
  Sparkles,
  Users,
  AlertCircle,
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();

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

        // Run queries in parallel for high performance
        const [eventsRes, registrationsRes, announcementsRes] = await Promise.all([
          eventApi.getEvents({ timeframe: 'upcoming', sort: 'date-asc' }),
          user?.role === 'student'
            ? eventApi.getMyRegistrations()
            : Promise.resolve({ registrations: [] }),
          announcementApi.getAnnouncements(),
        ]);

        if (eventsRes && eventsRes.events) {
          setUpcomingEvents(eventsRes.events.slice(0, 3)); // Top 3 upcoming
        }

        if (registrationsRes && registrationsRes.registrations) {
          setMyRegistrations(registrationsRes.registrations.slice(0, 3));
        }

        if (announcementsRes && announcementsRes.announcements) {
          setAnnouncements(announcementsRes.announcements.slice(0, 4)); // Top 4 notices
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
      <div className="py-20 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading campus dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-8 sm:p-10 shadow-xl shadow-indigo-950/20">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {user?.role === 'admin' ? 'Campus Administrator Console' : 'Authenticated Campus Portal'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-2 text-base text-indigo-100 font-normal leading-relaxed">
            {user?.department} • {user?.academicYear}
          </p>
          <p className="mt-4 text-sm text-slate-300">
            Discover upcoming hackathons, campus concerts, sports matches, and stay updated with official administrative notices.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-md shadow-indigo-600/30"
            >
              <Calendar className="w-4 h-4" />
              Discover Events
            </Link>
            {user?.role === 'student' && (
              <Link
                to="/my-events"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold backdrop-blur-md border border-white/10 transition"
              >
                <BookmarkCheck className="w-4 h-4 text-emerald-300" />
                My Registrations ({myRegistrations.length})
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition shadow-md"
              >
                Admin Control Room
              </Link>
            )}
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-10 pointer-events-none flex items-center justify-center">
          <Sparkles className="w-96 h-96 text-white" />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Events & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Upcoming Events & My Registered Events */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section: Next Registered Event (If student has any) */}
          {user?.role === 'student' && myRegistrations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <h2 className="text-lg font-bold text-slate-900">Your Next Registered Event</h2>
                </div>
                <Link
                  to="/my-events"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  View All ({myRegistrations.length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {myRegistrations[0]?.event && (
                <div className="bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/80 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="success">Confirmed Ticket</Badge>
                        <Badge variant={myRegistrations[0].event.category}>
                          {myRegistrations[0].event.category}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {myRegistrations[0].event.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          {formatDate(myRegistrations[0].event.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {myRegistrations[0].event.venue}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/events/${myRegistrations[0].event._id}`}
                      className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
                    >
                      View Pass & Details
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Upcoming Campus Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Featured Upcoming Events</h2>
                <p className="text-xs text-slate-500 mt-0.5">Explore competitions, workshops, and cultural fests</p>
              </div>
              <Link
                to="/events"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Browse All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No upcoming events scheduled</p>
                <p className="text-xs text-slate-500 mt-1">Check back later for new campus activities.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {upcomingEvents.map((evt) => (
                  <Link
                    key={evt._id}
                    to={`/events/${evt._id}`}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all flex flex-col justify-between"
                  >
                    {evt.posterUrl ? (
                      <div className="h-36 w-full overflow-hidden relative">
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
                      <div className="h-24 bg-gradient-to-r from-slate-100 to-indigo-50 p-4 flex items-start justify-between">
                        <Badge variant={evt.category}>{evt.category}</Badge>
                        {evt.isUserRegistered && <Badge variant="success">Registered</Badge>}
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {evt.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <span>{formatDate(evt.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
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

        {/* Right Column (1 Col): Official Announcements Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Campus Notices</h2>
              <p className="text-xs text-slate-500 mt-0.5">Official circulars & deadlines</p>
            </div>
            <Link
              to="/announcements"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              All Notices
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No active notices</p>
              </div>
            ) : (
              announcements.map((item) => (
                <div
                  key={item._id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.priority === 'important'
                      ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
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

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">
                    {item.content}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {item.publishedAt
                        ? new Date(item.publishedAt).toLocaleDateString()
                        : 'Recent'}
                    </span>
                    <span className="font-medium text-slate-600">{item.author?.name || 'Admin'}</span>
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
