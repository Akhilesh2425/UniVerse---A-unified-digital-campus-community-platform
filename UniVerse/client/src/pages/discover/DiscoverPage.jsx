import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '../../api/searchApi';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import {
  Compass,
  Calendar,
  Bell,
  Users,
  MessagesSquare,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Clock,
  ThumbsUp,
  MessageCircle,
} from 'lucide-react';

const DiscoverPage = () => {
  const [discovery, setDiscovery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscovery = async () => {
      try {
        setLoading(true);
        const res = await searchApi.getDiscovery();
        if (res && res.discovery) {
          setDiscovery(res.discovery);
        }
      } catch (err) {
        console.error('Failed to load discovery feeds:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscovery();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Curating campus discovery feeds...</p>
      </div>
    );
  }

  const events = discovery?.upcomingEvents || [];
  const announcements = discovery?.latestAnnouncements || [];
  const groups = discovery?.popularGroups || [];
  const discussions = discovery?.trendingDiscussions || [];
  const issues = discovery?.supportedIssues || [];

  return (
    <div className="space-y-10 pb-16">
      <div className="rounded-2xl bg-white dark:bg-[#172033] border border-slate-200/90 dark:border-[#334155] p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            Campus Highlights & Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Explore What’s Happening Across UniVerse
          </h1>
          <p className="text-sm text-slate-600 dark:text-[#A8B4C7] leading-relaxed">
            Discover upcoming hackathons, join active student communities, read official circulars, and track popular student-supported initiatives.
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <Link
              to="/events"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition shadow-xs"
            >
              Browse All Events
            </Link>
            <Link
              to="/groups"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-[#334155] transition"
            >
              Explore Communities
            </Link>
            <Link
              to="/issues"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-[#334155] transition"
            >
              Campus Issues
            </Link>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Upcoming Campus Events
            </h2>
          </div>
          <Link
            to="/events"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            View Calendar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No upcoming events currently scheduled.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e) => (
              <Link
                key={e._id}
                to={`/events/${e._id}`}
                className="p-4 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 shadow-xs hover:shadow-sm transition group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="primary">{e.category}</Badge>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(e.startDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 transition truncate">
                  {e.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {e.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {e.venue}
                  </span>
                  <span className="font-semibold text-brand-600 shrink-0">
                    {e.registeredCount || 0} registered
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Active Student Communities
              </h2>
            </div>
            <Link
              to="/groups"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              All Groups <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {groups.map((g) => (
              <Link
                key={g._id}
                to={`/groups/${g._id}`}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 shadow-xs flex items-center justify-between gap-3 group transition"
              >
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                    {g.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {g.shortDescription || g.description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {g.memberCount} members
                  </span>
                  <p className="text-[10px] text-slate-400">{g.category}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Most Supported Campus Issues
              </h2>
            </div>
            <Link
              to="/issues"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              All Issues <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {issues.map((i) => (
              <Link
                key={i._id}
                to={`/issues/${i._id}`}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 shadow-xs flex items-center justify-between gap-3 group transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-mono font-bold text-brand-600">
                      [{i.referenceId}]
                    </span>
                    <Badge variant={i.status}>{i.status}</Badge>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-rose-600 transition truncate">
                    {i.title}
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-brand-600 flex items-center justify-end gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" /> {i.supportCount}
                  </span>
                  <p className="text-[10px] text-slate-400">{i.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MessagesSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Trending Discussions
              </h2>
            </div>
            <Link
              to="/discussions"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              Discussion Feed <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {discussions.map((d) => (
              <Link
                key={d._id}
                to={`/discussions/${d._id}`}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 shadow-xs flex items-center justify-between gap-3 group transition"
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 transition truncate">
                    {d.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    By {d.author?.name || 'Student'} • {d.category}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 shrink-0">
                  <span className="flex items-center gap-1 text-purple-600">
                    <ThumbsUp className="w-3.5 h-3.5" /> {d.upvoteCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" /> {d.commentCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Official Campus Notices
              </h2>
            </div>
            <Link
              to="/announcements"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              All Notices <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {announcements.map((a) => (
              <Link
                key={a._id}
                to="/announcements"
                className="p-3.5 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 shadow-xs block group transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                    {a.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(a.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 transition">
                  {a.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {a.content}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DiscoverPage;
