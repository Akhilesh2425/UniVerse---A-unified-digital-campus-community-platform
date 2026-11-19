import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import discussionApi from '../../api/discussionApi';
import DiscussionCard from '../../components/discussions/DiscussionCard';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';
import {
  MessagesSquare,
  Plus,
  ArrowLeft,
  AlertCircle,
  FolderGit2,
  HelpCircle,
  BookOpen,
  FileText,
} from 'lucide-react';

const MyDiscussionsPage = () => {
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchMyDiscussions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await discussionApi.getMyDiscussions({ limit: 50 });
      setDiscussions(data.discussions || []);
    } catch (err) {
      setError(err.message || 'Failed to load your discussions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyDiscussions();
  }, [fetchMyDiscussions]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await discussionApi.deleteDiscussion(deleteTarget.id || deleteTarget._id);
      setDiscussions((prev) =>
        prev.filter((d) => (d.id || d._id) !== (deleteTarget.id || deleteTarget._id))
      );
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || 'Failed to delete discussion.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/discussions"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">My Discussions</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your published questions, resources, projects, and campus topics
            </p>
          </div>
        </div>

        <Link
          to="/discussions/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-brand-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Discussion</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading your posts...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto" />
          <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>
          <button
            type="button"
            onClick={fetchMyDiscussions}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : discussions.length === 0 ? (
        <div className="p-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <MessagesSquare className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">You haven't posted any discussions yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Ask an academic question or share useful resources with your fellow campus students!
            </p>
          </div>
          <Link
            to="/discussions/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Discussion</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.map((d) => (
            <DiscussionCard
              key={d.id || d._id}
              discussion={d}
              showAuthorControls={true}
              onEdit={() => navigate(`/discussions/${d.id || d._id}/edit`)}
              onDelete={() => setDeleteTarget(d)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Discussion"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All associated replies and votes will be permanently removed.`}
        confirmText="Delete Discussion"
        danger
      />
    </div>
  );
};

export default MyDiscussionsPage;
