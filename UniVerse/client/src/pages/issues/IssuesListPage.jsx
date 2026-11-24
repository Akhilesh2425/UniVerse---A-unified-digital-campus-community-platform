import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { issueApi } from '../../api/issueApi';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import {
  AlertTriangle,
  Search,
  PlusCircle,
  ThumbsUp,
  MessagesSquare,
  MapPin,
  Clock,
  CheckCircle2,
  Filter,
  Copy,
  Check,
  Building,
  ShieldAlert,
  HelpCircle,
  ArrowRight,
  BookmarkCheck,
  ChevronRight,
  Flame,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Infrastructure & Maintenance',
  'Electricity & Power',
  'Water Supply',
  'Internet & Wi-Fi',
  'Hostel Facilities',
  'Classroom & Laboratory',
  'Library Facilities',
  'Cleanliness & Sanitation',
  'Food & Canteen',
  'Transportation & Parking',
  'Safety & Security',
  'Accessibility',
  'Other',
];

const STATUS_TABS = [
  { id: 'all', label: 'All Issues', icon: Layers },
  { id: 'submitted', label: 'Recently Reported', icon: Clock },
  { id: 'most-supported', label: 'Most Supported', icon: Flame },
  { id: 'under_review', label: 'Under Review', icon: Search },
  { id: 'in_progress', label: 'In Progress', icon: AlertTriangle },
  { id: 'resolved', label: 'Resolved', icon: CheckCircle2 },
];

const IssuesListPage = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [supportLoadingMap, setSupportLoadingMap] = useState({});

  const activeSearch = searchParams.get('search') || '';
  const activeCategory = searchParams.get('category') || 'All';
  const activePriority = searchParams.get('priority') || 'All';
  const activeTab = searchParams.get('tab') || 'all';
  const activePage = parseInt(searchParams.get('page') || '1', 10);
  const activeSort = searchParams.get('sort') || 'newest';

  const [searchInput, setSearchInput] = useState(activeSearch);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: activePage,
        limit: 10,
        sort: activeTab === 'most-supported' ? 'most-supported' : activeSort,
      };

      if (activeSearch) params.search = activeSearch;
      if (activeCategory !== 'All') params.category = activeCategory;
      if (activePriority !== 'All') params.priority = activePriority;

      if (
        activeTab !== 'all' &&
        activeTab !== 'most-supported'
      ) {
        params.status = activeTab;
      }

      const res = await issueApi.getIssues(params);
      if (res && res.issues) {
        setIssues(res.issues);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching campus issues:', err);
      setError(err.message || 'Failed to load campus issues. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeSearch, activeCategory, activePriority, activeTab, activePage, activeSort]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const updateParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === 'All' || value === 'all' || (key === 'page' && value === 1)) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    if (key !== 'page') {
      nextParams.delete('page');
    }
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  const handleCopyReference = (e, refId) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(refId);
    setCopiedId(refId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSupport = async (e, issue) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (issue.isReporter) return;

    const issueId = issue._id;
    if (supportLoadingMap[issueId]) return;

    setSupportLoadingMap((prev) => ({ ...prev, [issueId]: true }));

    const prevSupported = issue.hasSupported;
    const prevCount = issue.supportCount || 0;
    const nextSupported = !prevSupported;
    const nextCount = nextSupported ? prevCount + 1 : Math.max(0, prevCount - 1);

    setIssues((prev) =>
      prev.map((item) =>
        item._id === issueId
          ? { ...item, hasSupported: nextSupported, supportCount: nextCount }
          : item
      )
    );

    try {
      if (nextSupported) {
        await issueApi.supportIssue(issueId);
      } else {
        await issueApi.removeSupport(issueId);
      }
    } catch (err) {
      console.error('Support toggle failed:', err);
      setIssues((prev) =>
        prev.map((item) =>
          item._id === issueId
            ? { ...item, hasSupported: prevSupported, supportCount: prevCount }
            : item
        )
      );
    } finally {
      setSupportLoadingMap((prev) => ({ ...prev, [issueId]: false }));
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatStatus = (status) => {
    if (!status) return 'Submitted';
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#172033] border border-slate-200/90 dark:border-[#334155] p-6 sm:p-8 shadow-xs transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              Campus Operations • Issue Tracker
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Campus Issues & Resolution
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-[#A8B4C7] leading-relaxed">
              Report campus infrastructure and facilities problems, support issues affecting fellow students, and monitor real-time department resolution progress with total transparency.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {isAuthenticated && !isAdmin && (
              <Link
                to="/issues/my-reports"
                className="px-4 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-slate-700/80 border border-slate-200 dark:border-[#334155] text-slate-800 dark:text-slate-200 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-xs"
              >
                <BookmarkCheck className="w-4 h-4 text-brand-500" />
                My Reports
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin/issues"
                className="px-4 py-2.5 sm:py-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-xs"
              >
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Admin Dashboard
              </Link>
            )}

            <Link
              to="/issues/create"
              className="px-5 py-2.5 sm:py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm shadow-brand-600/30 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <PlusCircle className="w-4 h-4" />
              Report an Issue
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#334155] flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Popular:
          </span>
          {CATEGORIES.slice(1, 8).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => updateParam('category', activeCategory === cat ? 'All' : cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white shadow-xs ring-2 ring-brand-400/40 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
            {STATUS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => updateParam('tab', tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 shadow-xs border border-brand-200 dark:border-brand-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="bg-white dark:bg-[#0b1322] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search issues by title, description, location, or reference ID (ISS-...)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shrink-0"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={activeCategory}
                  onChange={(e) => updateParam('category', e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.slice(1).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={activePriority}
                  onChange={(e) => updateParam('priority', e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                >
                  <option value="All">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                {activeTab !== 'most-supported' && (
                  <select
                    value={activeSort}
                    onChange={(e) => updateParam('sort', e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="most-supported">Most Supported</option>
                    <option value="priority">Priority Level</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                )}
              </div>

              <div>
                Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{issues.length}</span> of{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{total}</span> public issues
              </div>
            </div>
          </div>

          {loading && (
            <div className="py-20 flex flex-col items-center justify-center">
              <Spinner size="lg" />
              <p className="mt-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">
                Loading campus issues...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto" />
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">{error}</p>
              <button
                type="button"
                onClick={fetchIssues}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Retry Loading
              </button>
            </div>
          )}

          {!loading && !error && issues.length === 0 && (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0b1322] border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No Campus Issues Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                No issues match your current filter criteria. Be the first to report a problem if you noticed something on campus.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearchParams({});
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Clear All Filters
                </button>
                <Link
                  to="/issues/create"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  Report New Issue
                </Link>
              </div>
            </div>
          )}

          {!loading && !error && issues.length > 0 && (
            <div className="space-y-4">
              {issues.map((issue) => (
                <Link
                  key={issue._id}
                  to={`/issues/${issue._id}`}
                  className="block group bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50 shadow-xs hover:shadow-md transition-all duration-200 p-5 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div
                          onClick={(e) => handleCopyReference(e, issue.referenceId)}
                          title="Click to copy Reference ID"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-bold tracking-tight cursor-pointer transition"
                        >
                          {issue.referenceId}
                          {copiedId === issue.referenceId ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                          )}
                        </div>

                        <Badge variant={issue.status} size="xs">
                          {formatStatus(issue.status)}
                        </Badge>

                        <Badge variant={issue.priority} size="xs">
                          <span className="capitalize">{issue.priority}</span>
                        </Badge>

                        <Badge variant={issue.category} size="xs">
                          {issue.category}
                        </Badge>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {issue.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {issue.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                          <span className="font-medium text-slate-700 dark:text-slate-200">{issue.location}</span>
                          {issue.building && <span className="text-slate-400">• {issue.building}</span>}
                          {issue.room && <span className="text-slate-400">({issue.room})</span>}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {formatRelativeTime(issue.createdAt)}
                        </span>

                        {issue.reporter && (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-slate-400">By</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {issue.reporter.name}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="sm:self-center flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={(e) => handleToggleSupport(e, issue)}
                        disabled={issue.isReporter || supportLoadingMap[issue._id]}
                        title={
                          issue.isReporter
                            ? 'You reported this issue'
                            : issue.hasSupported
                            ? 'Remove your support'
                            : 'Support this issue'
                        }
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                          issue.hasSupported
                            ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/30'
                            : issue.isReporter
                            ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 dark:hover:text-brand-300 border border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        <ThumbsUp
                          className={`w-4 h-4 ${
                            issue.hasSupported
                              ? 'fill-current text-white'
                              : 'text-slate-400 group-hover:text-brand-500'
                          }`}
                        />
                        <span>{issue.supportCount || 0}</span>
                        <span className="hidden sm:inline font-normal text-[11px]">
                          {issue.supportCount === 1 ? 'Support' : 'Supports'}
                        </span>
                      </button>

                      <div className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <MessagesSquare className="w-3.5 h-3.5" />
                        <span>{issue.commentCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={activePage <= 1}
                onClick={() => updateParam('page', activePage - 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Previous Page
              </button>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Page <span className="font-bold text-slate-800 dark:text-white">{activePage}</span> of{' '}
                <span className="font-bold text-slate-800 dark:text-white">{totalPages}</span>
              </div>

              <button
                type="button"
                disabled={activePage >= totalPages}
                onClick={() => updateParam('page', activePage + 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Next Page
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50/50 dark:from-brand-950/40 dark:to-indigo-950/30 border border-brand-200/80 dark:border-brand-900/50 space-y-3">
            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 font-bold text-sm">
              <PlusCircle className="w-4 h-4 text-brand-600" />
              Noticed a Problem on Campus?
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Every student report is assigned a unique reference ID and tracked transparently through administrative resolution.
            </p>
            <Link
              to="/issues/create"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Raise Campus Issue
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-brand-500" />
              Resolution Workflow
            </h4>

            <ol className="space-y-3 text-xs">
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Report & ID</p>
                  <p className="text-slate-500 dark:text-slate-400">Assigned a human-readable reference number instantly.</p>
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Review & Assignment</p>
                  <p className="text-slate-500 dark:text-slate-400">Campus administration verifies and assigns responsible department.</p>
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Action & Progress</p>
                  <p className="text-slate-500 dark:text-slate-400">Technicians execute repairs with timestamped progress milestones.</p>
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Verification & Rating</p>
                  <p className="text-slate-500 dark:text-slate-400">Original reporter verifies resolution and rates satisfaction.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Urgent Safety Contacts
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              For active emergencies, fire, or immediate medical hazards:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="font-medium text-slate-700 dark:text-slate-300">Campus Security Desk</span>
                <span className="font-bold font-mono text-brand-600 dark:text-brand-400">+91 080 2233 4400</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="font-medium text-slate-700 dark:text-slate-300">Health Center / Ambulance</span>
                <span className="font-bold font-mono text-rose-600 dark:text-rose-400">+91 080 2233 4411</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="font-medium text-slate-700 dark:text-slate-300">Electrical Control Room</span>
                <span className="font-bold font-mono text-amber-600 dark:text-amber-400">+91 080 2233 4422</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuesListPage;
