import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import discussionApi from '../../api/discussionApi';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ReportModal from '../../components/discussions/ReportModal';
import {
  ThumbsUp,
  MessageSquare,
  Bookmark,
  CheckCircle2,
  Share2,
  Flag,
  Edit3,
  Trash2,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  FileText,
  BookOpen,
  FolderGit2,
  Eye,
  Check,
  Award,
} from 'lucide-react';

const TYPE_CONFIG = {
  question: { label: 'Question', icon: HelpCircle },
  discussion: { label: 'Discussion', icon: FileText },
  resource: { label: 'Resource', icon: BookOpen },
  project: { label: 'Project', icon: FolderGit2 },
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const DiscussionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [discussion, setDiscussion] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [hasSaved, setHasSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState(null);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  const [deletePostDialogOpen, setDeletePostDialogOpen] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState(null);
  const [reportModalData, setReportModalData] = useState({ open: false, commentId: null });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [postRes, commentsRes] = await Promise.all([
        discussionApi.getDiscussionById(id),
        discussionApi.getComments(id),
      ]);

      const postData = postRes.discussion;
      setDiscussion(postData);
      setHasUpvoted(!!postData.hasUpvoted);
      setUpvoteCount(postData.upvoteCount || 0);
      setHasSaved(!!postData.hasSaved);

      setComments(commentsRes.comments || []);
    } catch (err) {
      setError(err.message || 'Discussion could not be found or loaded.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVote = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const prevVoted = hasUpvoted;
    const prevCount = upvoteCount;

    setHasUpvoted(!prevVoted);
    setUpvoteCount(prevVoted ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      if (prevVoted) {
        const res = await discussionApi.removeUpvote(id);
        setUpvoteCount(res.upvoteCount);
        setHasUpvoted(false);
      } else {
        const res = await discussionApi.upvoteDiscussion(id);
        setUpvoteCount(res.upvoteCount);
        setHasUpvoted(true);
      }
    } catch {
      setHasUpvoted(prevVoted);
      setUpvoteCount(prevCount);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const prevSaved = hasSaved;
    setHasSaved(!prevSaved);

    try {
      if (prevSaved) {
        await discussionApi.unsaveDiscussion(id);
        setHasSaved(false);
      } else {
        await discussionApi.saveDiscussion(id);
        setHasSaved(true);
      }
    } catch {
      setHasSaved(prevSaved);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteDiscussion = async () => {
    try {
      await discussionApi.deleteDiscussion(id);
      navigate('/discussions');
    } catch (err) {
      alert(err.message || 'Failed to delete discussion.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || newComment.trim().length < 2) return;

    setCommentSubmitting(true);
    setCommentError(null);

    try {
      const res = await discussionApi.createComment(id, { content: newComment.trim() });
      setComments((prev) => [...prev, res.comment]);
      setNewComment('');
      setDiscussion((prev) => ({
        ...prev,
        commentCount: (prev.commentCount || 0) + 1,
      }));
    } catch (err) {
      setCommentError(err.message || 'Failed to post reply.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!deleteCommentTarget) return;

    try {
      await discussionApi.deleteComment(id, deleteCommentTarget._id);
      setComments((prev) => prev.filter((c) => c._id !== deleteCommentTarget._id));
      setDiscussion((prev) => ({
        ...prev,
        commentCount: Math.max(0, (prev.commentCount || 1) - 1),
      }));
      setDeleteCommentTarget(null);
    } catch (err) {
      alert(err.message || 'Failed to delete comment.');
    }
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editingContent.trim() || editingContent.trim().length < 2) return;

    try {
      const res = await discussionApi.updateComment(id, commentId, {
        content: editingContent.trim(),
      });
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, content: res.comment.content } : c))
      );
      setEditingCommentId(null);
      setEditingContent('');
    } catch (err) {
      alert(err.message || 'Failed to update comment.');
    }
  };

  const handleToggleAcceptedAnswer = async (comment) => {
    const isCurrentlyAccepted = comment.isAcceptedAnswer;
    const targetCommentId = isCurrentlyAccepted ? null : comment._id;

    try {
      const res = await discussionApi.setAcceptedAnswer(id, targetCommentId);
      setDiscussion((prev) => ({
        ...prev,
        isResolved: res.isResolved,
        acceptedAnswer: res.acceptedAnswer,
      }));

      setComments((prev) =>
        prev.map((c) => ({
          ...c,
          isAcceptedAnswer: c._id === targetCommentId,
        }))
      );
    } catch (err) {
      alert(err.message || 'Failed to update accepted answer status.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading discussion...</p>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Discussion Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error || 'This post may have been removed.'}</p>
        <Link
          to="/discussions"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discussions Feed
        </Link>
      </div>
    );
  }

  const typeConfig = TYPE_CONFIG[discussion.type] || TYPE_CONFIG.discussion;
  const TypeIcon = typeConfig.icon;
  const isAuthor = user && discussion.author && user._id === discussion.author._id;
  const canModify = isAuthor || isAdmin;
  const isQuestion = discussion.type === 'question';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/discussions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </Link>

        {canModify && (
          <div className="flex items-center gap-2">
            <Link
              to={`/discussions/${id}/edit`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Post</span>
            </Link>
            <button
              type="button"
              onClick={() => setDeletePostDialogOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      <article className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {discussion.author?.avatarUrl ? (
              <img
                src={discussion.author.avatarUrl}
                alt={discussion.author.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-brand-500/20"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold text-sm flex items-center justify-center ring-2 ring-brand-500/20">
                {discussion.author?.name ? discussion.author.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {discussion.author?.name || 'Campus Student'}
                </span>
                {discussion.author?.role === 'admin' && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-[10px] font-bold uppercase">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {discussion.author?.department && `${discussion.author.department} • `}
                {formatRelativeTime(discussion.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {discussion.isResolved && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Resolved Question
              </span>
            )}
            <Badge variant={discussion.type} size="sm" className="gap-1 capitalize">
              <TypeIcon className="w-3.5 h-3.5" />
              {discussion.type}
            </Badge>
            <Badge variant={discussion.category} size="sm">
              {discussion.category}
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {discussion.title}
          </h1>

          {discussion.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-96">
              <img
                src={discussion.imageUrl}
                alt={discussion.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.parentElement.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
            {discussion.content}
          </div>

          {discussion.resourceUrl && (
            <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/60 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-700 dark:text-brand-300">
                  Attached Educational Resource
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {discussion.resourceUrl}
                </p>
              </div>
              <a
                href={discussion.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition shrink-0"
              >
                <span>Visit Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {discussion.tags && discussion.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2">
              {discussion.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVote}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                hasUpvoted
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 dark:hover:text-brand-400'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-white' : ''}`} />
              <span>{upvoteCount} Upvotes</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                hasSaved
                  ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${hasSaved ? 'fill-amber-600 dark:fill-amber-400' : ''}`} />
              <span>{hasSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            {discussion.views > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {discussion.views} views
              </span>
            )}
            <button
              type="button"
              onClick={() => setReportModalData({ open: true, commentId: null })}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
              title="Report this discussion"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
          </div>
        </div>
      </article>

      <section id="comments" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {comments.length} {isQuestion ? 'Answers & Solutions' : 'Comments & Replies'}
            </h2>
          </div>

          {isQuestion && (
            <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
              Author can mark the best answer as Accepted
            </span>
          )}
        </div>

        {isAuthenticated ? (
          <form onSubmit={handleAddComment} className="space-y-3">
            {commentError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {commentError}
              </div>
            )}
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                isQuestion
                  ? 'Write your answer or explanation to help the student...'
                  : 'Add to the conversation or share your perspective...'
              }
              required
              className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition leading-relaxed"
            />
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Be constructive and adhere to campus guidelines
              </span>
              <button
                type="submit"
                disabled={commentSubmitting || !newComment.trim()}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                {commentSubmitting
                  ? 'Posting...'
                  : isQuestion
                  ? 'Post Answer'
                  : 'Post Comment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 dark:text-slate-300">
              Want to contribute to this discussion or answer this question?
            </span>
            <Link
              to="/login"
              className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition"
            >
              Log in to Reply
            </Link>
          </div>
        )}

        <div className="space-y-4 pt-2">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
              {isQuestion
                ? 'No answers yet. Be the first to provide a helpful answer!'
                : 'No comments yet. Start the conversation above.'}
            </div>
          ) : (
            comments.map((c) => {
              const isAccepted = c.isAcceptedAnswer;
              const isCommentAuthor = user && c.author && user._id === c.author._id;
              const canModifyComment = isCommentAuthor || isAdmin;
              const canMarkAccepted = isAuthor || isAdmin;
              const isEditing = editingCommentId === c._id;

              return (
                <div
                  key={c._id}
                  className={`p-4 sm:p-5 rounded-2xl border transition ${
                    isAccepted
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {isAccepted && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold mb-3 shadow-xs">
                      <Award className="w-3.5 h-3.5" />
                      <span>Accepted Answer</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center">
                        {c.author?.name ? c.author.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {c.author?.name || 'Student'}
                          </span>
                          {c.author?.role === 'admin' && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[9px] font-bold uppercase">
                              Admin
                            </span>
                          )}
                          {discussion.author?._id === c.author?._id && (
                            <span className="px-1.5 py-0.2 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-[9px] font-bold uppercase">
                              Author
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {formatRelativeTime(c.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isQuestion && canMarkAccepted && (
                        <button
                          type="button"
                          onClick={() => handleToggleAcceptedAnswer(c)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                            isAccepted
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-700'
                          }`}
                          title={isAccepted ? 'Click to unmark accepted answer' : 'Mark as Accepted Answer'}
                        >
                          <Check className="w-3 h-3" />
                          <span>{isAccepted ? 'Accepted' : 'Accept Answer'}</span>
                        </button>
                      )}

                      {canModifyComment && !isEditing && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(c._id);
                              setEditingContent(c.content);
                            }}
                            className="p-1 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded transition"
                            title="Edit Comment"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCommentTarget(c)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition"
                            title="Delete Comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {isAuthenticated && !isCommentAuthor && (
                        <button
                          type="button"
                          onClick={() =>
                            setReportModalData({ open: true, commentId: c._id })
                          }
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition"
                          title="Report Comment"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 mt-2">
                      <textarea
                        rows={3}
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingCommentId(null)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditComment(c._id)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap pl-1">
                      {c.content}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <ConfirmDialog
        isOpen={deletePostDialogOpen}
        onClose={() => setDeletePostDialogOpen(false)}
        onConfirm={handleDeleteDiscussion}
        title="Delete Discussion"
        message="Are you sure you want to permanently delete this discussion? All comments, answers, upvotes, and bookmarks will be removed."
        confirmText="Delete Discussion"
        danger
      />

      <ConfirmDialog
        isOpen={!!deleteCommentTarget}
        onClose={() => setDeleteCommentTarget(null)}
        onConfirm={handleDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        confirmText="Delete Comment"
        danger
      />

      <ReportModal
        isOpen={reportModalData.open}
        onClose={() => setReportModalData({ open: false, commentId: null })}
        postId={id}
        commentId={reportModalData.commentId}
        targetTitle={discussion.title}
      />
    </div>
  );
};

export default DiscussionDetailsPage;
