import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { issueApi } from '../../api/issueApi';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  AlertTriangle,
  MapPin,
  Clock,
  ThumbsUp,
  MessagesSquare,
  CheckCircle2,
  Copy,
  Check,
  Building,
  ShieldAlert,
  ArrowLeft,
  Share2,
  Calendar,
  Lock,
  Globe,
  User,
  Star,
  RefreshCw,
  Edit2,
  Trash2,
  Send,
  EyeOff,
  Wrench,
  CheckCircle,
  XCircle,
  HelpCircle,
} from 'lucide-react';

const TIMELINE_STAGES = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

const IssueDetailsPage = () => {
  const { issueId } = useParams();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [deleteCommentTarget, setDeleteCommentTarget] = useState(null);

  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [wasResolvedChoice, setWasResolvedChoice] = useState(true);
  const [reopenReasonInput, setReopenReasonInput] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [standaloneReopenReason, setStandaloneReopenReason] = useState('');
  const [reopenSubmitting, setReopenSubmitting] = useState(false);

  const fetchIssueDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [issueRes, commentsRes] = await Promise.all([
        issueApi.getIssueById(issueId),
        issueApi.getComments(issueId).catch(() => ({ comments: [] })),
      ]);

      if (issueRes && issueRes.issue) {
        setIssue(issueRes.issue);
      }
      if (commentsRes && commentsRes.comments) {
        setComments(commentsRes.comments);
      }
    } catch (err) {
      console.error('Error fetching issue:', err);
      setError(err.message || 'Failed to load campus issue details.');
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    fetchIssueDetails();
  }, [fetchIssueDetails]);

  const handleCopyRef = () => {
    if (issue?.referenceId) {
      navigator.clipboard.writeText(issue.referenceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleToggleSupport = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (issue.isReporter || supportLoading) return;

    setSupportLoading(true);
    const prevSupported = issue.hasSupported;
    const prevCount = issue.supportCount || 0;
    const nextSupported = !prevSupported;
    const nextCount = nextSupported ? prevCount + 1 : Math.max(0, prevCount - 1);

    setIssue((prev) => ({
      ...prev,
      hasSupported: nextSupported,
      supportCount: nextCount,
    }));

    try {
      if (nextSupported) {
        await issueApi.supportIssue(issue._id);
      } else {
        await issueApi.removeSupport(issue._id);
      }
    } catch (err) {
      console.error('Support toggle failed:', err);
      setIssue((prev) => ({
        ...prev,
        hasSupported: prevSupported,
        supportCount: prevCount,
      }));
    } finally {
      setSupportLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || commentSubmitting) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setCommentSubmitting(true);
      const res = await issueApi.createComment(issue._id, {
        content: commentText.trim(),
      });
      if (res && res.comment) {
        setComments((prev) => [...prev, res.comment]);
        setCommentText('');
        setIssue((prev) => ({
          ...prev,
          commentCount: (prev.commentCount || 0) + 1,
        }));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      alert(err.message || 'Failed to post comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await issueApi.updateComment(issue._id, commentId, {
        content: editCommentText.trim(),
      });
      if (res && res.comment) {
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? res.comment : c))
        );
        setEditingCommentId(null);
      }
    } catch (err) {
      console.error('Failed to update comment:', err);
      alert(err.message || 'Failed to update comment.');
    }
  };

  const handleDeleteCommentConfirm = async () => {
    if (!deleteCommentTarget) return;
    try {
      await issueApi.deleteComment(issue._id, deleteCommentTarget._id);
      setComments((prev) => prev.filter((c) => c._id !== deleteCommentTarget._id));
      setIssue((prev) => ({
        ...prev,
        commentCount: Math.max(0, (prev.commentCount || 1) - 1),
      }));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert(err.message || 'Failed to delete comment.');
    } finally {
      setDeleteCommentTarget(null);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      setFeedbackSubmitting(true);
      const res = await issueApi.submitFeedback(issue._id, {
        rating: feedbackRating,
        feedback: feedbackText.trim(),
        wasResolved: wasResolvedChoice,
        requestReopen: !wasResolvedChoice && reopenReasonInput.trim().length > 0,
        reopenReason: reopenReasonInput.trim(),
      });

      if (res && res.feedback) {
        setIssue((prev) => ({
          ...prev,
          feedback: res.feedback,
        }));
        setFeedbackSuccess(true);
        fetchIssueDetails();
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert(err.message || 'Failed to record resolution feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleStandaloneReopenSubmit = async (e) => {
    e.preventDefault();
    if (!standaloneReopenReason.trim() || standaloneReopenReason.trim().length < 5) {
      alert('Please provide a reason of at least 5 characters.');
      return;
    }

    try {
      setReopenSubmitting(true);
      await issueApi.createReopenRequest(issue._id, {
        reason: standaloneReopenReason.trim(),
      });
      setShowReopenModal(false);
      setStandaloneReopenReason('');
      fetchIssueDetails();
    } catch (err) {
      console.error('Failed to request reopen:', err);
      alert(err.message || 'Failed to submit reopen request.');
    } finally {
      setReopenSubmitting(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatStatus = (st) => {
    if (!st) return 'Submitted';
    return st
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Loading issue timeline & records...
        </p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="py-16 max-w-lg mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Unable to Load Issue
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {error || 'The requested campus issue report does not exist or you do not have permission to view it.'}
        </p>
        <Link
          to="/issues"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campus Issues
        </Link>
      </div>
    );
  }

  const stageOrder = ['submitted', 'under_review', 'approved', 'assigned', 'in_progress', 'resolved', 'closed'];
  const currentStageIndex = stageOrder.indexOf(issue.status);
  const isSpecialStatus = ['rejected', 'duplicate', 'on_hold', 'reopened'].includes(issue.status);

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/issues"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campus Issues
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin/issues"
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Manage in Admin Workspace
            </Link>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            {shared ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            {shared ? 'Copied Link' : 'Share'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0b1322] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div
            onClick={handleCopyRef}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 font-mono font-bold text-xs cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900 transition"
            title="Click to copy Reference ID"
          >
            <span>{issue.referenceId}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-brand-500" />}
          </div>

          <Badge variant={issue.status} size="sm">
            {formatStatus(issue.status)}
          </Badge>

          <Badge variant={issue.priority} size="sm">
            <span className="capitalize">{issue.priority} Priority</span>
          </Badge>

          <Badge variant={issue.category} size="sm">
            {issue.category}
          </Badge>

          <Badge variant={issue.visibility} size="sm">
            <span className="capitalize">{issue.visibility}</span>
          </Badge>

          {issue.isAnonymousToPublic && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <EyeOff className="w-3 h-3" /> Anonymous
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {issue.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{issue.location}</span>
            {issue.building && <span>• {issue.building}</span>}
            {issue.room && <span>({issue.room})</span>}
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Reported {formatDateTime(issue.createdAt)}</span>
          </div>

          {issue.reporter && (
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Reported by <strong className="text-slate-700 dark:text-slate-300">{issue.reporter.name}</strong></span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#0b1322] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            Resolution Progress Tracker
          </h2>

          {isSpecialStatus && (
            <Badge variant={issue.status} size="sm">
              Status: {formatStatus(issue.status)}
            </Badge>
          )}
        </div>

        <div className="relative pt-4 pb-2">
          <div className="hidden md:flex items-center justify-between relative z-10">
            {TIMELINE_STAGES.map((stage, idx) => {
              const isPastOrCurrent = currentStageIndex >= idx;
              const isCurrent = currentStageIndex === idx;

              return (
                <div key={stage.key} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCurrent
                        ? 'bg-brand-600 text-white ring-4 ring-brand-500/20 shadow-md scale-110'
                        : isPastOrCurrent
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isPastOrCurrent && !isCurrent ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-semibold text-center ${
                      isCurrent
                        ? 'text-brand-600 dark:text-brand-400 font-bold'
                        : isPastOrCurrent
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block absolute top-[34px] left-[7%] right-[7%] h-0.5 bg-slate-200 dark:bg-slate-700 z-0">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-brand-600 transition-all duration-500"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, (currentStageIndex / (stageOrder.length - 1)) * 100)
                )}%`,
              }}
            />
          </div>

          <div className="md:hidden p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Current Phase:</span>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
              {formatStatus(issue.status)}
            </span>
          </div>
        </div>

        {isSpecialStatus && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Notice regarding status: {formatStatus(issue.status)}</p>
              <p className="mt-0.5 opacity-90 leading-relaxed">
                {issue.status === 'on_hold' &&
                  'Work on this issue is temporarily paused pending replacement materials or campus clearance.'}
                {issue.status === 'reopened' &&
                  'This issue has been reopened for additional repairs or re-inspection.'}
                {issue.status === 'rejected' &&
                  'This report was not accepted for campus maintenance action. Please inspect history updates for details.'}
                {issue.status === 'duplicate' &&
                  'This report references a campus issue already recorded in another active ticket.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-[#0b1322] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Issue Description
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {issue.description}
            </p>

            {(issue.imageUrl || (issue.images && issue.images.length > 0)) && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Attached Photo Evidence:
                </p>
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 max-w-lg">
                  <img
                    src={issue.imageUrl || issue.images[0]}
                    alt="Supporting Evidence"
                    className="w-full max-h-80 object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {(issue.status === 'resolved' || issue.status === 'closed') && issue.resolution?.summary && (
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-50/30 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-emerald-950/30 rounded-3xl p-6 sm:p-8 border border-emerald-300/80 dark:border-emerald-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-100">
                    Official Resolution Summary
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Resolved {formatDateTime(issue.resolution.resolvedAt)}
                    {issue.resolution.resolvedBy && ` by ${issue.resolution.resolvedBy.name}`}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs sm:text-sm">
                <div>
                  <p className="font-semibold text-emerald-950 dark:text-emerald-200">Summary:</p>
                  <p className="text-emerald-900/90 dark:text-emerald-200/90 mt-0.5 leading-relaxed">
                    {issue.resolution.summary}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-emerald-950 dark:text-emerald-200">Action Executed:</p>
                  <p className="text-emerald-900/90 dark:text-emerald-200/90 mt-0.5 leading-relaxed">
                    {issue.resolution.actionTaken}
                  </p>
                </div>

                {issue.resolution.evidenceUrl && (
                  <div className="pt-2">
                    <p className="font-semibold text-emerald-950 dark:text-emerald-200 mb-1">Resolution Verification Photo:</p>
                    <img
                      src={issue.resolution.evidenceUrl}
                      alt="Resolution Evidence"
                      className="rounded-xl max-h-48 object-cover border border-emerald-200 dark:border-emerald-800"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {(issue.status === 'resolved' || issue.status === 'closed') && issue.isReporter && (
            <div className="bg-white dark:bg-[#0b1322] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Reporter Resolution Feedback
                  </h3>
                </div>
                {issue.feedback && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Feedback Submitted
                  </span>
                )}
              </div>

              {issue.feedback ? (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Your Rating:</span>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= issue.feedback.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">Issue Satisfactorily Resolved:</strong>{' '}
                    {issue.feedback.wasResolved ? 'Yes' : 'No'}
                  </p>

                  {issue.feedback.feedback && (
                    <p className="text-slate-600 dark:text-slate-400 italic">
                      "{issue.feedback.feedback}"
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    As the original reporter, your feedback ensures accountability and high service standards across campus departments.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Rate the Resolution Quality (1 to 5 Stars):
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="p-1 hover:scale-110 transition"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= feedbackRating
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-2">
                        {feedbackRating} of 5 Stars
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Was the problem genuinely fixed?
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setWasResolvedChoice(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                          wasResolvedChoice
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Yes, Completely Resolved
                      </button>
                      <button
                        type="button"
                        onClick={() => setWasResolvedChoice(false)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                          !wasResolvedChoice
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-500 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        No, Still Broken / Incomplete
                      </button>
                    </div>
                  </div>

                  {!wasResolvedChoice && (
                    <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
                      <label className="block text-xs font-bold text-rose-900 dark:text-rose-200">
                        Reason for Reopening Request:
                      </label>
                      <textarea
                        rows={3}
                        value={reopenReasonInput}
                        onChange={(e) => setReopenReasonInput(e.target.value)}
                        placeholder="Explain what is still not functioning properly..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Additional Comments <span className="font-normal text-slate-400">(Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Share compliments, technician punctuality, or helpful suggestions..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={feedbackSubmitting}
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
                  >
                    {feedbackSubmitting ? <Spinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          )}

          {issue.reopenRequests && issue.reopenRequests.length > 0 && (
            <div className="bg-white dark:bg-[#0b1322] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-brand-600" />
                Issue Reopen Requests
              </h3>

              <div className="space-y-3">
                {issue.reopenRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Requested by {req.requestedBy?.name || 'Reporter'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : req.status === 'rejected'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Justification:</strong> {req.reason}
                    </p>

                    {req.reviewExplanation && (
                      <p className="text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <strong>Admin Response:</strong> {req.reviewExplanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-[#0b1322] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-brand-600" />
              Administrative Updates & Milestones
            </h3>

            {(!issue.updates || issue.updates.length === 0) ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                No administrative updates have been posted yet.
              </p>
            ) : (
              <div className="space-y-3">
                {issue.updates.map((upd) => (
                  <div
                    key={upd._id}
                    className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-1.5 ${
                      upd.visibility === 'internal'
                        ? 'bg-amber-50/50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        {upd.visibility === 'internal' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full text-[10px] uppercase">
                            <Lock className="w-3 h-3" /> Internal Admin Note
                          </span>
                        ) : (
                          <span className="font-bold text-brand-600 dark:text-brand-400">
                            {upd.author?.name || 'Campus Operations'}
                          </span>
                        )}
                        <span>•</span>
                        <span>{formatDateTime(upd.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                      {upd.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#0b1322] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessagesSquare className="w-4 h-4 text-brand-600" />
                Community Discussion ({comments.length})
              </h3>
            </div>

            {isAuthenticated ? (
              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share useful context, report if you noticed the same issue, or suggest solutions..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentText.trim() || commentSubmitting}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    {commentSubmitting ? <Spinner size="sm" /> : <Send className="w-3.5 h-3.5" />}
                    Post Comment
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-center text-xs text-slate-500 space-y-2">
                <p>Log in with your student credentials to participate in this discussion.</p>
                <Link
                  to="/login"
                  className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl font-bold"
                >
                  Log In
                </Link>
              </div>
            )}

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  No comments yet. Start the conversation!
                </p>
              ) : (
                comments.map((comment) => {
                  const isAuthor =
                    user && comment.author && user._id === comment.author._id;
                  const canDelete = isAuthor || isAdmin;
                  const isEditing = editingCommentId === comment._id;

                  return (
                    <div
                      key={comment._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs sm:text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center">
                            {comment.author?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                              {comment.author?.name || 'Campus Student'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatDateTime(comment.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {isAuthor && !isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(comment._id);
                                setEditCommentText(comment.content);
                              }}
                              className="p-1.5 text-slate-400 hover:text-brand-600 transition"
                              title="Edit comment"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteCommentTarget(comment)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2 pt-2">
                          <textarea
                            rows={3}
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingCommentId(null)}
                              className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateComment(comment._id)}
                              className="px-3 py-1 bg-brand-600 text-white rounded-lg text-xs font-semibold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                          {comment.content}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0b1322] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Community Action
            </h4>

            {issue.visibility === 'public' ? (
              <button
                type="button"
                onClick={handleToggleSupport}
                disabled={issue.isReporter || supportLoading}
                className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition shadow-sm ${
                  issue.hasSupported
                    ? 'bg-brand-600 text-white shadow-brand-600/30 ring-2 ring-brand-500/30'
                    : issue.isReporter
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-600 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${issue.hasSupported ? 'fill-current' : ''}`} />
                <span>
                  {issue.hasSupported
                    ? 'Supported'
                    : issue.isReporter
                    ? 'Your Reported Issue'
                    : 'Support This Issue'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-xs">
                  {issue.supportCount || 0}
                </span>
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Private issue reports cannot receive community supports.</span>
              </div>
            )}

            {issue.isReporter && (issue.status === 'resolved' || issue.status === 'closed') && (
              <button
                type="button"
                onClick={() => setShowReopenModal(true)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Request Issue Reopening
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-[#0b1322] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-brand-500" />
              Operational Assignment
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400">Assigned Department:</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {issue.assignedDepartment || 'Pending Assignment'}
                </p>
              </div>

              {issue.assignedTo && (
                <div>
                  <p className="text-slate-400">Assigned Staff:</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {issue.assignedTo.name} ({issue.assignedTo.department || 'Staff'})
                  </p>
                </div>
              )}

              {issue.targetResolutionDate && (
                <div>
                  <p className="text-slate-400">Target Resolution:</p>
                  <p className="font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    {new Date(issue.targetResolutionDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#0b1322] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Reported By
            </h4>

            {issue.reporter && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold text-sm flex items-center justify-center shrink-0">
                  {issue.reporter.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {issue.reporter.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {issue.reporter.department || 'Student'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteCommentTarget)}
        title="Delete Comment"
        message="Are you sure you want to remove this comment from the issue discussion? This action cannot be undone."
        confirmText="Delete Comment"
        onConfirm={handleDeleteCommentConfirm}
        onCancel={() => setDeleteCommentTarget(null)}
      />

      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0b1322] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-rose-600" />
              Request Issue Reopening
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide a clear reason why this issue requires re-inspection or additional repairs. Campus administrators will examine your request.
            </p>
            <form onSubmit={handleStandaloneReopenSubmit} className="space-y-4">
              <textarea
                rows={4}
                value={standaloneReopenReason}
                onChange={(e) => setStandaloneReopenReason(e.target.value)}
                placeholder="e.g. The leak resumed after heavy rain this morning..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopenSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {reopenSubmitting ? <Spinner size="sm" /> : <Send className="w-3.5 h-3.5" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueDetailsPage;
