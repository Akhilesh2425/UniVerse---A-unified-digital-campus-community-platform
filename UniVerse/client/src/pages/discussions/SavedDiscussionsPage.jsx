import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import discussionApi from '../../api/discussionApi';
import DiscussionCard from '../../components/discussions/DiscussionCard';
import Spinner from '../../components/common/Spinner';
import { Bookmark, ArrowLeft, AlertCircle, Compass } from 'lucide-react';

const SavedDiscussionsPage = () => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSavedDiscussions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await discussionApi.getSavedDiscussions({ limit: 50 });
      setDiscussions(data.discussions || []);
    } catch (err) {
      setError(err.message || 'Failed to load your saved discussions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedDiscussions();
  }, [fetchSavedDiscussions]);

  const handleSaveToggle = (postId, isSaved) => {
    if (!isSaved) {
      setDiscussions((prev) => prev.filter((d) => (d.id || d._id) !== postId));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link
          to="/discussions"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span>Saved Discussions & Bookmarks</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Easily reference important questions, accepted solutions, and educational resources
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading saved discussions...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto" />
          <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>
          <button
            type="button"
            onClick={fetchSavedDiscussions}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : discussions.length === 0 ? (
        <div className="p-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Bookmarked Discussions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Click the bookmark icon on any discussion or resource to save it for quick review later.
            </p>
          </div>
          <Link
            to="/discussions"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition shadow-md"
          >
            <Compass className="w-4 h-4" />
            <span>Browse Campus Feed</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.map((d) => (
            <DiscussionCard
              key={d.id || d._id}
              discussion={d}
              onSaveChange={(postId, isSaved) => handleSaveToggle(postId, isSaved)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedDiscussionsPage;
