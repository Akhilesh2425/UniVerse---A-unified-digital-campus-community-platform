import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import discussionApi from '../../api/discussionApi';
import Spinner from '../../components/common/Spinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  ShieldAlert,
  Flag,
  CheckCircle,
  EyeOff,
  Trash2,
  XCircle,
  AlertCircle,
  MessageSquare,
  FileText,
  User,
  ExternalLink,
} from 'lucide-react';

const STATUS_FILTERS = ['pending', 'resolved', 'dismissed'];

const ModerationReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeActionReport, setActiveActionReport] = useState(null);
  const [actionType, setActionType] = useState(null); // 'dismiss' | 'hide' | 'delete'
  const [actionNotes, setActionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await discussionApi.getModerationReports({
        status: selectedStatus,
        limit: 50,
      });
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message || 'Failed to load moderation reports.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExecuteAction = async () => {
    if (!activeActionReport || !actionType) return;
    setSubmitting(true);

    let resolution = 'dismissed';
    let newStatus = 'dismissed';

    if (actionType === 'hide') {
      resolution = 'hidden';
      newStatus = 'resolved';
    } else if (actionType === 'delete') {
      resolution = 'deleted';
      newStatus = 'resolved';
    }

    try {
      await discussionApi.resolveReport(activeActionReport.id || activeActionReport._id, {
        status: newStatus,
        resolution,
        resolutionNotes: actionNotes.trim() || `Moderation action taken: ${resolution}`,
      });

      // Remove or update from local list
      setReports((prev) =>
        prev.filter((r) => (r.id || r._id) !== (activeActionReport.id || activeActionReport._id))
      );

      setActiveActionReport(null);
      setActionType(null);
      setActionNotes('');
    } catch (err) {
      alert(err.message || 'Failed to execute moderation action.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            <span>Campus Content Moderation Queue</span>
          </h1>
          <p className="text-xs text-slate-500">
            Review reported discussions and comments to ensure campus safety and educational standards
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                selectedStatus === s
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs font-semibold text-slate-500">Loading moderation queue...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-white border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
          <p className="text-xs text-rose-700">{error}</p>
          <button
            type="button"
            onClick={fetchReports}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No {selectedStatus} reports in queue
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {selectedStatus === 'pending'
              ? 'All reported discussions and comments have been reviewed and resolved.'
              : `There are currently no reports with status "${selectedStatus}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => {
            const isPost = r.targetType === 'post';
            return (
              <div
                key={r.id || r._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
              >
                {/* Report Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                      <Flag className="w-3.5 h-3.5" />
                      {r.reason}
                    </span>
                    <span className="text-xs text-slate-500">
                      Reported by <strong className="text-slate-700">{r.reporter?.name || 'Anonymous'}</strong> ({r.reporter?.email || 'Student'})
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Reporter notes if any */}
                {r.details && (
                  <div className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-700">
                    <span className="font-bold text-slate-900">Reporter's notes:</span> {r.details}
                  </div>
                )}

                {/* Reported Content Preview Card */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1.5 capitalize text-slate-700">
                      {isPost ? <FileText className="w-3.5 h-3.5 text-indigo-600" /> : <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />}
                      Reported {r.targetType}
                    </span>

                    {r.targetContent && isPost && (
                      <Link
                        to={`/discussions/${r.targetId}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                      >
                        <span>Open Post</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  {r.targetContent ? (
                    <div>
                      {isPost && (
                        <h4 className="text-sm font-bold text-slate-900 mb-1">
                          {r.targetContent.title}
                        </h4>
                      )}
                      <p className="text-xs text-slate-700 whitespace-pre-wrap line-clamp-4 leading-relaxed">
                        {r.targetContent.content}
                      </p>
                      <div className="text-[11px] text-slate-400 mt-2">
                        Author: <strong className="text-slate-600">{r.targetContent.author?.name || 'Student'}</strong> ({r.targetContent.author?.department || 'Department'})
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      This content was previously removed or does not exist.
                    </p>
                  )}
                </div>

                {/* Moderation Actions (for pending reports) */}
                {selectedStatus === 'pending' && (
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveActionReport(r);
                        setActionType('dismiss');
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      Dismiss Report
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveActionReport(r);
                        setActionType('hide');
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                    >
                      Hide Content
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveActionReport(r);
                        setActionType('delete');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition"
                    >
                      Delete Content
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Execution Dialog */}
      <ConfirmDialog
        isOpen={!!activeActionReport}
        onClose={() => {
          setActiveActionReport(null);
          setActionType(null);
        }}
        onConfirm={handleExecuteAction}
        title={
          actionType === 'delete'
            ? 'Delete Reported Content'
            : actionType === 'hide'
            ? 'Hide Reported Content'
            : 'Dismiss Report'
        }
        message={
          actionType === 'delete'
            ? 'Are you sure you want to permanently delete this content? This cannot be undone.'
            : actionType === 'hide'
            ? 'Are you sure you want to hide this content from the campus feed?'
            : 'Dismiss this report without altering the content?'
        }
        confirmText={
          submitting
            ? 'Processing...'
            : actionType === 'delete'
            ? 'Delete Content'
            : actionType === 'hide'
            ? 'Hide Content'
            : 'Dismiss Report'
        }
        danger={actionType === 'delete'}
      />
    </div>
  );
};

export default ModerationReportsPage;
