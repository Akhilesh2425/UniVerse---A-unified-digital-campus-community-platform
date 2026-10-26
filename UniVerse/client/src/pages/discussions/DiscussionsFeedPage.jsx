import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import discussionApi from '../../api/discussionApi';
import DiscussionCard from '../../components/discussions/DiscussionCard';
import DiscussionFilters from '../../components/discussions/DiscussionFilters';
import Spinner from '../../components/common/Spinner';
import {
  Plus,
  MessagesSquare,
  HelpCircle,
  BookmarkCheck,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Tag,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const POPULAR_TAGS = [
  'algorithms',
  'dynamic-programming',
  'placements',
  'machine-learning',
  'react',
  'iot',
  'hackathon',
  'internships',
  'career',
];

const DiscussionsFeedPage = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State initialized from URL query parameters for shareable/bookmarkable URLs
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'trending');
  const [page, setPage] = useState(parseInt(searchParams.get('page'), 10) || 1);

  const [discussions, setDiscussions] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync state to URL search parameters
  useEffect(() => {
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (selectedCategory !== 'All') params.category = selectedCategory;
    if (selectedType) params.type = selectedType;
    if (selectedSort !== 'trending') params.sort = selectedSort;
    if (page > 1) params.page = String(page);

    setSearchParams(params, { replace: true });
  }, [search, selectedCategory, selectedType, selectedSort, page, setSearchParams]);

  // Fetch discussions with debounced search
  const fetchDiscussions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: 10,
        sort: selectedSort === 'unanswered' ? 'newest' : selectedSort,
        unanswered: selectedSort === 'unanswered' ? 'true' : undefined,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedType) params.type = selectedType;

      const data = await discussionApi.getDiscussions(params);
      setDiscussions(data.discussions || []);
      setTotalPosts(data.totalPosts || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Unable to load campus discussions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, selectedType, selectedSort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscussions();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchDiscussions]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedType('');
    setSelectedSort('trending');
    setPage(1);
  };

  const handleTagClick = (tag) => {
    setSearch(tag);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner with Call to Action */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-indigo-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Campus Academic Hub & Knowledge Exchange</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Student Discussions & Questions
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed">
              Ask coding and academic questions, share curated resources, discuss university events,
              and connect with peers across all engineering departments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/discussions/create"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-950/40 hover:scale-[1.02] transition transform"
            >
              <Plus className="w-4 h-4" />
              <span>New Discussion</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/discussions/my-posts"
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold backdrop-blur-md border border-white/10 transition"
              >
                <span>My Posts</span>
              </Link>
            )}
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Grid: Feed on Left (8 cols) and Sidebar on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Filters and Feed */}
        <div className="lg:col-span-8 space-y-5">
          <DiscussionFilters
            search={search}
            setSearch={(s) => {
              setSearch(s);
              setPage(1);
            }}
            selectedCategory={selectedCategory}
            setSelectedCategory={(c) => {
              setSelectedCategory(c);
              setPage(1);
            }}
            selectedType={selectedType}
            setSelectedType={(t) => {
              setSelectedType(t);
              setPage(1);
            }}
            selectedSort={selectedSort}
            setSelectedSort={(st) => {
              setSelectedSort(st);
              setPage(1);
            }}
            onReset={handleResetFilters}
          />

          {/* Results count banner */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{discussions.length}</strong> of{' '}
              <strong className="text-slate-800">{totalPosts}</strong> discussions
            </span>
            {selectedCategory !== 'All' && (
              <span className="font-medium text-indigo-600">Category: {selectedCategory}</span>
            )}
          </div>

          {/* Feed Content */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs animate-pulse space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-32 bg-slate-200 rounded" />
                      <div className="h-2 w-24 bg-slate-100 rounded" />
                    </div>
                    <div className="h-5 w-16 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-5/6 bg-slate-100 rounded" />
                  <div className="pt-3 border-t border-slate-100 flex gap-2">
                    <div className="h-7 w-16 bg-slate-100 rounded-xl" />
                    <div className="h-7 w-20 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 rounded-2xl bg-white border border-rose-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Failed to Load Discussions</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
              <button
                type="button"
                onClick={fetchDiscussions}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
              >
                Retry Connection
              </button>
            </div>
          ) : discussions.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                <MessagesSquare className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">No Discussions Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {search || selectedCategory !== 'All' || selectedType
                    ? 'No discussions match your filter criteria. Try adjusting your search keywords.'
                    : 'Be the first student to start a discussion or ask an academic question!'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  to="/discussions/create"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition"
                >
                  Start First Discussion
                </Link>
                {(search || selectedCategory !== 'All' || selectedType) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {discussions.map((d) => (
                <DiscussionCard key={d.id || d._id} discussion={d} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-xs">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <span className="text-xs font-semibold text-slate-600">
                Page <span className="text-indigo-600 font-bold">{page}</span> of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Quick Navigation Card */}
          {isAuthenticated && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                My Knowledge Hub
              </h3>
              <div className="space-y-1.5">
                <Link
                  to="/discussions/my-posts"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition group"
                >
                  <span className="flex items-center gap-2">
                    <MessagesSquare className="w-4 h-4 text-indigo-500" />
                    My Created Posts
                  </span>
                  <span className="text-slate-400 group-hover:text-indigo-600">→</span>
                </Link>

                <Link
                  to="/discussions/saved"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/70 text-slate-700 hover:text-amber-800 text-xs font-semibold transition group"
                >
                  <span className="flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-amber-500" />
                    Saved & Bookmarked
                  </span>
                  <span className="text-slate-400 group-hover:text-amber-600">→</span>
                </Link>
              </div>
            </div>
          )}

          {/* Popular Campus Topics / Tags */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-800">
              <Tag className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold">Trending Campus Topics</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTagClick(t)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium ${
                    search === t
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>

          {/* Community Guidelines */}
          <div className="bg-gradient-to-br from-indigo-50/80 to-slate-50 rounded-2xl border border-indigo-100 p-5 shadow-xs space-y-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Campus Community Guidelines</span>
            </div>
            <ul className="space-y-2 list-disc list-inside leading-relaxed text-[11px] text-slate-600">
              <li>Keep inquiries respectful and academically honest.</li>
              <li>Tag code snippets and provide reproduction details.</li>
              <li>Mark the most helpful answer as <strong>Accepted</strong>.</li>
              <li>Report spam, harassment, or non-educational content.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionsFeedPage;
