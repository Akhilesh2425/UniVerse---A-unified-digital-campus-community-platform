import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { groupApi } from '../../api/groupApi';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import {
  Users,
  Search,
  PlusCircle,
  Lock,
  Globe,
  MessageSquare,
  X,
  AlertCircle,
  CheckCircle2,
  BookmarkCheck,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Technical',
  'Coding & Competitive Programming',
  'Artificial Intelligence & Machine Learning',
  'Academic & Research',
  'Cultural',
  'Sports & Fitness',
  'Entrepreneurship',
  'Arts & Photography',
  'Social Impact',
  'Other',
];

const GroupsListPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('popular');
  const [visibility, setVisibility] = useState('');

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        category,
        sort,
      };
      if (search.trim()) params.search = search.trim();
      if (visibility) params.visibility = visibility;

      const res = await groupApi.getGroups(params);
      if (res && res.groups) {
        setGroups(res.groups);
      }
    } catch (err) {
      console.error('Error loading groups:', err);
      setError(err.message || 'Failed to load campus communities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [category, sort, visibility]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGroups();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('All');
    setSort('popular');
    setVisibility('');
  };

  const handleQuickJoin = async (e, group) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/groups' } } });
      return;
    }

    setActionLoadingId(group._id);
    setFeedbackMessage('');

    try {
      const res = await groupApi.joinGroup(group._id);
      setFeedbackMessage(res.message);

      setGroups((prev) =>
        prev.map((g) => {
          if (g._id === group._id) {
            if (res.status === 'joined') {
              return {
                ...g,
                isMember: true,
                membershipStatus: 'member',
                memberCount: res.memberCount || g.memberCount + 1,
              };
            } else if (res.status === 'requested') {
              return {
                ...g,
                hasPendingRequest: true,
                membershipStatus: 'requested',
              };
            }
          }
          return g;
        })
      );
    } catch (err) {
      alert(err.message || 'Failed to join group.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
              Groups & Communities
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover student-led clubs, competitive coding circles, research groups, and campus societies
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <Link
              to="/my-groups"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
            >
              <BookmarkCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              My Groups
            </Link>
          )}

          <Link
            to="/groups/create"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-brand-600/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Create Community
          </Link>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage('')}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groups by name, description, or tags (e.g. AI, Web, ICPC)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchGroups();
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
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Access Types</option>
              <option value="public">Public Communities</option>
              <option value="private">Private (Approval Required)</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest First</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
            </select>

            {(category !== 'All' || search || visibility || sort !== 'popular') && (
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
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">Discovering campus communities...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white dark:bg-[#172033] rounded-2xl border border-slate-200/90 dark:border-[#334155] p-10 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No communities found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or be the first to launch a group for your campus!
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Reset Filters
            </button>
            <Link
              to="/groups/create"
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition shadow-xs"
            >
              Start a Group
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((grp) => (
            <div
              key={grp._id}
              className="bg-white dark:bg-[#172033] rounded-2xl border border-slate-200/90 dark:border-[#334155] overflow-hidden shadow-xs hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all flex flex-col justify-between"
            >
              <div className="relative h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                {grp.coverImage ? (
                  <img
                    src={grp.coverImage}
                    alt={grp.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`h-full w-full bg-gradient-to-tr from-navy-950 via-slate-900 to-brand-950 flex items-center justify-center text-white ${
                    grp.coverImage ? 'hidden' : 'flex'
                  }`}
                >
                  <Users className="w-10 h-10 opacity-30" />
                </div>

                <div className="absolute top-3 left-3">
                  <Badge variant={grp.category}>{grp.category}</Badge>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md ${
                      grp.visibility === 'public'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {grp.visibility === 'public' ? (
                      <>
                        <Globe className="w-3 h-3" /> Public
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" /> Private
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    <Link to={`/groups/${grp._id}`}>{grp.name}</Link>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {grp.shortDescription}
                  </p>

                  {grp.tags && grp.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {grp.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                      {grp.tags.length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{grp.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-brand-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {grp.memberCount || 1} member{grp.memberCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>{grp.postCount || 0} discussions</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Link
                    to={`/groups/${grp._id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition text-center"
                  >
                    View Community
                  </Link>

                  {grp.membershipStatus === 'owner' ? (
                    <span className="px-3 py-2 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold">
                      Owner
                    </span>
                  ) : grp.membershipStatus === 'moderator' ? (
                    <span className="px-3 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold">
                      Moderator
                    </span>
                  ) : grp.membershipStatus === 'member' ? (
                    <span className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold">
                      Joined
                    </span>
                  ) : grp.membershipStatus === 'requested' ? (
                    <span className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold">
                      Requested
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleQuickJoin(e, grp)}
                      disabled={actionLoadingId === grp._id}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50 shadow-xs"
                    >
                      {actionLoadingId === grp._id ? (
                        <Spinner size="sm" className="border-white" />
                      ) : grp.visibility === 'public' ? (
                        'Join'
                      ) : (
                        'Request'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupsListPage;
