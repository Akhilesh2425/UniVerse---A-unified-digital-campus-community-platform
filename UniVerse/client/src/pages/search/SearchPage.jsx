import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { searchApi } from '../../api/searchApi';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import {
  Search,
  Calendar,
  Bell,
  Users,
  MessagesSquare,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  MapPin,
  Clock,
  ThumbsUp,
  MessageCircle,
  X,
} from 'lucide-react';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const typeParam = searchParams.get('type') || 'all';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [inputQuery, setInputQuery] = useState(queryParam);
  const [results, setResults] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    events: 0,
    announcements: 0,
    groups: 0,
    discussions: 0,
    issues: 0,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const executeSearch = async (q, type, page) => {
    if (!q.trim()) {
      setResults([]);
      setCounts({ all: 0, events: 0, announcements: 0, groups: 0, discussions: 0, issues: 0 });
      return;
    }

    try {
      setLoading(true);
      const res = await searchApi.searchGlobal({
        q: q.trim(),
        type,
        page,
        limit: 15,
      });

      if (res) {
        setResults(res.results || []);
        setCounts(res.counts || {});
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setInputQuery(queryParam);
    executeSearch(queryParam, typeParam, pageParam);
  }, [queryParam, typeParam, pageParam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    setSearchParams({ q: inputQuery.trim(), type: 'all', page: '1' });
  };

  const handleTypeTab = (type) => {
    setSearchParams({ q: queryParam, type, page: '1' });
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'announcement':
        return <Bell className="w-4 h-4 text-amber-500" />;
      case 'group':
        return <Users className="w-4 h-4 text-emerald-500" />;
      case 'discussion':
        return <MessagesSquare className="w-4 h-4 text-purple-500" />;
      case 'issue':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  const tabs = [
    { key: 'all', label: 'All Results', count: counts.all },
    { key: 'events', label: 'Events', count: counts.events },
    { key: 'announcements', label: 'Notices', count: counts.announcements },
    { key: 'groups', label: 'Communities', count: counts.groups },
    { key: 'discussions', label: 'Discussions', count: counts.discussions },
    { key: 'issues', label: 'Campus Issues', count: counts.issues },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Campus Global Search
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Find events, announcements, communities, discussions, and public campus issues
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Search by keyword, event venue, club name, or Issue ID (e.g. ISS-2026)..."
              className="w-full pl-11 pr-10 py-3 text-sm rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-hidden focus:border-brand-500 shadow-xs transition"
            />
            {inputQuery && (
              <button
                type="button"
                onClick={() => setInputQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold transition shadow-xs"
          >
            Search
          </button>
        </form>
      </div>

      {queryParam && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = typeParam === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTypeTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count || 0}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div>
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Spinner size="md" />
            <p className="mt-3 text-xs text-slate-500 font-medium">Searching campus records...</p>
          </div>
        ) : !queryParam ? (
          <div className="py-20 text-center bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
            <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Discover UniVerse
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Type any keyword above to search through upcoming campus hackathons, official circulars, student clubs, and campus issues.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No matching results for "{queryParam}"
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Check your spelling, try different keywords, or broaden your category filters.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
              Found <strong>{total}</strong> campus results for "{queryParam}"
            </p>

            <div className="space-y-3">
              {results.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={item.url}
                  className="block p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50 shadow-xs hover:shadow-sm transition group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getItemIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                          {item.type}
                        </span>

                        {item.category && (
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            • {item.category}
                          </span>
                        )}

                        {item.extra?.referenceId && (
                          <span className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400">
                            [{item.extra.referenceId}]
                          </span>
                        )}

                        {item.extra?.priority && (
                          <Badge variant={item.extra.priority}>
                            {item.extra.priority}
                          </Badge>
                        )}

                        {item.extra?.status && (
                          <Badge variant={item.extra.status}>
                            {item.extra.status}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
                        {item.extra?.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {item.extra.venue}
                          </span>
                        )}

                        {item.extra?.memberCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {item.extra.memberCount} members
                          </span>
                        )}

                        {item.extra?.upvoteCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {item.extra.upvoteCount} upvotes
                          </span>
                        )}

                        {item.extra?.supportCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3.5 h-3.5 text-brand-500" />
                            {item.extra.supportCount} student supporters
                          </span>
                        )}

                        {item.date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(item.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition shrink-0 self-center hidden sm:block" />
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pt-4 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Page {pageParam} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pageParam <= 1}
                    onClick={() =>
                      setSearchParams({
                        q: queryParam,
                        type: typeParam,
                        page: String(Math.max(1, pageParam - 1)),
                      })
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-medium"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={pageParam >= totalPages}
                    onClick={() =>
                      setSearchParams({
                        q: queryParam,
                        type: typeParam,
                        page: String(Math.min(totalPages, pageParam + 1)),
                      })
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
