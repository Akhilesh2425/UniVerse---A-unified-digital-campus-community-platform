import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formApi } from '../../api/formApi';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import {
  FileText,
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  ExternalLink,
  Plus,
  AlertCircle,
  Building,
  CheckCircle2,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Scholarship',
  'Hackathon',
  'Internship',
  'Competition',
  'Grant',
  'Survey',
  'Admissions',
  'Workshop',
  'Other',
];

const FormsListPage = () => {
  const { user, isAdmin } = useAuth();
  const [forms, setForms] = useState([]);
  const [wishlistFormIds, setWishlistFormIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [togglingId, setTogglingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category !== 'All') params.category = category;

      const [formsRes, wishRes] = await Promise.all([
        formApi.getForms(params),
        user ? formApi.getMyWishlist() : Promise.resolve({ wishlist: [] }),
      ]);

      setForms(formsRes.forms || []);
      if (wishRes.wishlist) {
        const ids = new Set(wishRes.wishlist.map((item) => (item.form?._id || item.form)));
        setWishlistFormIds(ids);
      }
    } catch (err) {
      console.error('Failed to load forms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleToggleWishlist = async (formId) => {
    if (!user) return;
    try {
      setTogglingId(formId);
      if (wishlistFormIds.has(formId)) {
        await formApi.removeFromWishlist(formId);
        setWishlistFormIds((prev) => {
          const next = new Set(prev);
          next.delete(formId);
          return next;
        });
        setFeedbackMsg('Removed from your opportunities wishlist.');
      } else {
        await formApi.addToWishlist(formId);
        setWishlistFormIds((prev) => new Set(prev).add(formId));
        setFeedbackMsg('Added to your wishlist! Daily reminder emails will keep you updated before the deadline.');
      }
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      console.error('Wishlist toggle error:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const getDaysRemainingBadge = (deadlineStr) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Expired
        </span>
      );
    }
    if (diffDays <= 3) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 flex items-center gap-1">
          <Clock className="w-3 h-3 text-rose-600" /> {diffDays} {diffDays === 1 ? 'day' : 'days'} left!
        </span>
      );
    }
    if (diffDays <= 7) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-600" /> {diffDays} days left
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 flex items-center gap-1">
        <Calendar className="w-3 h-3 text-emerald-600" /> {diffDays} days left
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-xs font-bold mb-2">
            <FileText className="w-3.5 h-3.5" /> Opportunities & Academic Deadlines
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Campus Forms & Opportunities
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Discover student grants, hackathons, internships, scholarships, and club applications. Save to your wishlist to receive daily reminder alerts before deadlines close.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <Link
              to="/forms/wishlist"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center gap-2 shadow-xs"
            >
              <Bookmark className="w-4 h-4 text-brand-600" />
              <span>My Wishlist ({wishlistFormIds.size})</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/forms/create"
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-sm shadow-brand-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Form</span>
            </Link>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-900 dark:text-brand-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-brand-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div className="space-y-4 mb-8">
        <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities by title, eligibility, or department..."
            className="w-full pl-10 pr-24 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                category === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-xs text-slate-500 font-medium">Loading opportunities...</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No Opportunities Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try adjusting your search criteria or selected category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((item) => {
            const isWishlisted = wishlistFormIds.has(item._id);
            return (
              <div
                key={item._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-brand-700 dark:text-brand-300">
                      {item.category}
                    </span>
                    {getDaysRemainingBadge(item.deadline)}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">
                    {item.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                    {item.department && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.department}</span>
                      </div>
                    )}
                    {item.eligibility && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        <strong className="text-slate-700 dark:text-slate-300">Eligibility: </strong>
                        {item.eligibility}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Deadline: {new Date(item.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Apply / View Form</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {user && (
                    <button
                      type="button"
                      disabled={togglingId === item._id}
                      onClick={() => handleToggleWishlist(item._id)}
                      title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist & Reminders'}
                      className={`p-2 rounded-xl border transition ${
                        isWishlisted
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-600'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {isWishlisted ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FormsListPage;
