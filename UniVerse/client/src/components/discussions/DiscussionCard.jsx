import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import discussionApi from '../../api/discussionApi';
import {
  ThumbsUp,
  MessageSquare,
  Bookmark,
  CheckCircle2,
  HelpCircle,
  FileText,
  BookOpen,
  FolderGit2,
  ExternalLink,
  Eye,
  Flag,
} from 'lucide-react';
import ReportModal from './ReportModal';

const TYPE_CONFIG = {
  question: {
    label: 'Question',
    icon: HelpCircle,
    color: 'amber',
  },
  discussion: {
    label: 'Discussion',
    icon: FileText,
    color: 'indigo',
  },
  resource: {
    label: 'Resource',
    icon: BookOpen,
    color: 'emerald',
  },
  project: {
    label: 'Project',
    icon: FolderGit2,
    color: 'purple',
  },
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const DiscussionCard = ({
  discussion,
  onVoteChange,
  onSaveChange,
  showAuthorControls = false,
  onEdit,
  onDelete,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [hasUpvoted, setHasUpvoted] = useState(!!discussion.hasUpvoted);
  const [upvoteCount, setUpvoteCount] = useState(discussion.upvoteCount || 0);
  const [hasSaved, setHasSaved] = useState(!!discussion.hasSaved);
  const [voteLoading, setVoteLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const typeConfig = TYPE_CONFIG[discussion.type] || TYPE_CONFIG.discussion;
  const TypeIcon = typeConfig.icon;
  const isResolved = discussion.isResolved || !!discussion.acceptedAnswer;

  const handleVote = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (voteLoading) return;
    setVoteLoading(true);

    const prevVoted = hasUpvoted;
    const prevCount = upvoteCount;

    setHasUpvoted(!prevVoted);
    setUpvoteCount(prevVoted ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      if (prevVoted) {
        const res = await discussionApi.removeUpvote(discussion.id || discussion._id);
        setUpvoteCount(res.upvoteCount);
        setHasUpvoted(false);
      } else {
        const res = await discussionApi.upvoteDiscussion(discussion.id || discussion._id);
        setUpvoteCount(res.upvoteCount);
        setHasUpvoted(true);
      }
      if (onVoteChange) onVoteChange(discussion.id || discussion._id, !prevVoted);
    } catch {
      setHasUpvoted(prevVoted);
      setUpvoteCount(prevCount);
    } finally {
      setVoteLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (saveLoading) return;
    setSaveLoading(true);

    const prevSaved = hasSaved;
    setHasSaved(!prevSaved);

    try {
      if (prevSaved) {
        await discussionApi.unsaveDiscussion(discussion.id || discussion._id);
        setHasSaved(false);
      } else {
        await discussionApi.saveDiscussion(discussion.id || discussion._id);
        setHasSaved(true);
      }
      if (onSaveChange) onSaveChange(discussion.id || discussion._id, !prevSaved);
    } catch {
      setHasSaved(prevSaved);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      <article className="group bg-white dark:bg-[#172033] rounded-2xl border border-slate-200/90 dark:border-[#334155] hover:border-brand-400 dark:hover:border-brand-500/50 p-5 shadow-xs transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              {discussion.author?.avatarUrl ? (
                <img
                  src={discussion.author.avatarUrl}
                  alt={discussion.author.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center ring-2 ring-brand-500/20 ${
                  discussion.author?.avatarUrl ? 'hidden' : 'flex'
                }`}
              >
                {discussion.author?.name ? discussion.author.name.charAt(0).toUpperCase() : 'U'}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {discussion.author?.name || 'Campus Student'}
                  </span>
                  {discussion.author?.role === 'admin' && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[9px] font-bold uppercase">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {discussion.author?.department && `${discussion.author.department} • `}
                  {formatRelativeTime(discussion.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {isResolved && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolved
                </span>
              )}

              <Badge variant={discussion.type} size="xs" className="gap-1 capitalize">
                <TypeIcon className="w-3 h-3" />
                {discussion.type}
              </Badge>

              <Badge variant={discussion.category} size="xs">
                {discussion.category}
              </Badge>
            </div>
          </div>

          <Link to={`/discussions/${discussion.id || discussion._id}`} className="block mb-2 group/title">
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover/title:text-brand-600 dark:group-hover/title:text-brand-400 transition-colors line-clamp-2 leading-snug">
              {discussion.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
              {discussion.content}
            </p>
          </Link>

          {discussion.resourceUrl && (
            <div className="mb-3">
              <a
                href={discussion.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-600 dark:text-brand-400 bg-brand-50/70 dark:bg-brand-950/40 hover:bg-brand-100/70 dark:hover:bg-brand-900/60 px-2.5 py-1 rounded-lg transition"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="truncate max-w-xs">{discussion.resourceUrl}</span>
              </a>
            </div>
          )}

          {discussion.tags && discussion.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-4">
              {discussion.tags.slice(0, 5).map((t, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVote}
              disabled={voteLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                hasUpvoted
                  ? 'bg-brand-600 text-white shadow-xs shadow-brand-500/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200 dark:border-slate-700'
              }`}
              title={hasUpvoted ? 'Remove upvote' : 'Upvote discussion'}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-white' : ''}`} />
              <span>{upvoteCount}</span>
            </button>

            <Link
              to={`/discussions/${discussion.id || discussion._id}#comments`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
              title="View comments & answers"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {discussion.commentCount || 0} {discussion.type === 'question' ? 'answers' : 'replies'}
              </span>
            </Link>

            {discussion.views > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 pl-1">
                <Eye className="w-3 h-3" />
                {discussion.views}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              className={`p-1.5 rounded-lg text-xs transition ${
                hasSaved
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={hasSaved ? 'Saved in your bookmarks' : 'Save to bookmarks'}
            >
              <Bookmark className={`w-4 h-4 ${hasSaved ? 'fill-amber-600 dark:fill-amber-400' : ''}`} />
            </button>

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                title="Report inappropriate content"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}

            {showAuthorControls && (
              <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2 ml-1">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(discussion)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(discussion)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </article>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        postId={discussion.id || discussion._id}
        targetTitle={discussion.title}
      />
    </>
  );
};

export default DiscussionCard;
