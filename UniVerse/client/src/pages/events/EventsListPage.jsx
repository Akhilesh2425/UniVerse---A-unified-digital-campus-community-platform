import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../../api/eventApi';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import {
  Calendar,
  Search,
  MapPin,
  Clock,
  Users,
  X,
  ArrowRight,
  AlertCircle,
  Plus,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Technical',
  'Cultural',
  'Sports',
  'Workshops',
  'Clubs',
  'Competitions',
  'Other',
];

const EventsListPage = () => {
  const { isAuthenticated, user, isAdmin } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [timeframe, setTimeframe] = useState('upcoming');
  const [sort, setSort] = useState('date-asc');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        category,
        timeframe,
        sort,
      };
      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await eventApi.getEvents(params);
      if (res && res.events) {
        setEvents(res.events);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to load events from the campus database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category, timeframe, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('All');
    setTimeframe('upcoming');
    setSort('date-asc');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Campus Events
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover hackathons, seminars, cultural fests, and athletic competitions
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/admin/events"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-brand-600/20 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Manage & Create Events
          </Link>
        )}
      </div>

      <div className="bg-white dark:bg-[#172033] rounded-2xl border border-slate-200/90 dark:border-[#334155] p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events by title, description, or venue..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#1E293B] text-slate-800 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchEvents();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition shadow-xs"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
              Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  category === cat
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="upcoming">Upcoming Events</option>
              <option value="all">All Dates</option>
              <option value="past">Past Events</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="date-asc">Date: Soonest First</option>
              <option value="date-desc">Date: Latest First</option>
              <option value="title-asc">Title: A-Z</option>
            </select>

            {(category !== 'All' || timeframe !== 'upcoming' || search || sort !== 'date-asc') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Reset
              </button>
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

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-[#172033] rounded-2xl border border-slate-200/90 dark:border-[#334155] p-10 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No events found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Try adjusting your search query, selecting another category, or viewing past events.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 rounded-xl text-xs font-semibold hover:bg-brand-100 dark:hover:bg-brand-900/60 transition"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((evt) => (
            <div
              key={evt._id}
              className="bg-white dark:bg-[#172033] rounded-2xl border border-slate-200/90 dark:border-[#334155] overflow-hidden shadow-xs hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all flex flex-col justify-between"
            >
              {evt.posterUrl ? (
                <div className="h-44 w-full relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={evt.posterUrl}
                    alt={evt.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden h-full w-full bg-gradient-to-tr from-navy-900 to-slate-800 items-center justify-center text-white">
                    <Calendar className="w-10 h-10 opacity-30" />
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge variant={evt.category}>{evt.category}</Badge>
                  </div>
                  {evt.isUserRegistered && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="success">Registered</Badge>
                    </div>
                  )}
                  {evt.isFull && !evt.isUserRegistered && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="danger">Full</Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-tr from-navy-950 to-slate-850 p-4 flex items-start justify-between relative text-white">
                  <Badge variant={evt.category}>{evt.category}</Badge>
                  {evt.isUserRegistered && <Badge variant="success">Registered</Badge>}
                  {evt.isFull && !evt.isUserRegistered && <Badge variant="danger">Full</Badge>}
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                    {evt.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                    <span className="font-medium">{formatDate(evt.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                    <span className="truncate">{evt.venue}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {evt.maxCapacity ? (
                        evt.remainingSpots !== null && evt.remainingSpots > 0 ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            {evt.remainingSpots} of {evt.maxCapacity} spots left
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">At Full Capacity</span>
                        )
                      ) : (
                        <span>Open Capacity</span>
                      )}
                    </span>

                    {evt.registrationDeadline && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        Closes: {new Date(evt.registrationDeadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to={`/events/${evt._id}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-brand-50 dark:hover:bg-brand-950/50 border border-slate-200 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-800 text-slate-800 dark:text-slate-200 hover:text-brand-700 dark:hover:text-brand-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>View Event Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsListPage;
