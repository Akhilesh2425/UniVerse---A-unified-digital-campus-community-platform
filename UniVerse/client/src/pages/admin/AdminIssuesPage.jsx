import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { issueApi } from '../../api/issueApi';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  RefreshCw,
  PlusCircle,
  Eye,
  Edit,
  Check,
  X,
  Lock,
  Globe,
  Star,
  FileText,
  UserCheck,
  Send,
  Wrench,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

const DEPARTMENTS = [
  'All',
  'Campus Administration',
  'Electrical Maintenance',
  'Civil Maintenance',
  'Plumbing & Water Supply',
  'IT Support',
  'Hostel Administration',
  'Library Administration',
  'Transport Department',
  'Food Services',
  'Security Department',
  'Sanitation & Housekeeping',
  'Other',
];

const STATUSES = [
  'All',
  'submitted',
  'under_review',
  'approved',
  'assigned',
  'in_progress',
  'on_hold',
  'resolved',
  'closed',
  'rejected',
  'duplicate',
  'reopened',
];

const AdminIssuesPage = () => {
  const { user } = useAuth();

  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [statusModalIssue, setStatusModalIssue] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusExplanation, setStatusExplanation] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [assignModalIssue, setAssignModalIssue] = useState(null);
  const [assignDepartment, setAssignDepartment] = useState('Campus Administration');
  const [assignTargetDate, setAssignTargetDate] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const [resolveModalIssue, setResolveModalIssue] = useState(null);
  const [resolveSummary, setResolveSummary] = useState('');
  const [resolveActionTaken, setResolveActionTaken] = useState('');
  const [resolveEvidenceUrl, setResolveEvidenceUrl] = useState('');
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  const [updateModalIssue, setUpdateModalIssue] = useState(null);
  const [updateContent, setUpdateContent] = useState('');
  const [updateVisibility, setUpdateVisibility] = useState('public');
  const [updateSubmitting, setUpdateSubmitting] = useState(false);

  const [auditModalIssue, setAuditModalIssue] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenRequests, setReopenRequests] = useState([]);
  const [reopenLoading, setReopenLoading] = useState(false);
  const [reviewExplanationMap, setReviewExplanationMap] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 15,
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (selectedPriority !== 'All') params.priority = selectedPriority;
      if (selectedDepartment !== 'All') params.department = selectedDepartment;

      const [issuesRes, statsRes] = await Promise.all([
        issueApi.getAdminIssues(params),
        issueApi.getAdminStatistics().catch(() => ({ statistics: null })),
      ]);

      if (issuesRes && issuesRes.issues) {
        setIssues(issuesRes.issues);
        setTotal(issuesRes.total || 0);
        setTotalPages(issuesRes.totalPages || 1);
      }
      if (statsRes && statsRes.statistics) {
        setStats(statsRes.statistics);
      }
    } catch (err) {
      console.error('Failed to load admin issues:', err);
      setError(err.message || 'Failed to load administrative issue workspace.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedStatus, selectedPriority, selectedDepartment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus || !statusModalIssue) return;

    try {
      setStatusSubmitting(true);
      await issueApi.updateStatus(statusModalIssue._id, {
        status: newStatus,
        explanation: statusExplanation.trim(),
      });
      setStatusModalIssue(null);
      setNewStatus('');
      setStatusExplanation('');
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update issue status.');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignDepartment || !assignModalIssue) return;

    try {
      setAssignSubmitting(true);
      await issueApi.assignDepartment(assignModalIssue._id, {
        department: assignDepartment,
        targetResolutionDate: assignTargetDate || null,
        instructions: assignInstructions.trim(),
      });
      setAssignModalIssue(null);
      setAssignInstructions('');
      setAssignTargetDate('');
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to assign department.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveSummary.trim() || !resolveActionTaken.trim() || !resolveModalIssue) {
      alert('Please provide both resolution summary and action taken.');
      return;
    }

    try {
      setResolveSubmitting(true);
      await issueApi.resolveIssue(resolveModalIssue._id, {
        summary: resolveSummary.trim(),
        actionTaken: resolveActionTaken.trim(),
        evidenceUrl: resolveEvidenceUrl.trim(),
      });
      setResolveModalIssue(null);
      setResolveSummary('');
      setResolveActionTaken('');
      setResolveEvidenceUrl('');
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to resolve issue.');
    } finally {
      setResolveSubmitting(false);
    }
  };

  const handleAddUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateContent.trim() || !updateModalIssue) return;

    try {
      setUpdateSubmitting(true);
      await issueApi.addUpdate(updateModalIssue._id, {
        content: updateContent.trim(),
        visibility: updateVisibility,
      });
      setUpdateModalIssue(null);
      setUpdateContent('');
      setUpdateVisibility('public');
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to post update.');
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const handleOpenAudit = async (issue) => {
    setAuditModalIssue(issue);
    setAuditLoading(true);
    try {
      const res = await issueApi.getIssueAuditHistory(issue._id);
      if (res && res.audit) {
        setAuditData(res.audit);
      }
    } catch (err) {
      alert(err.message || 'Failed to fetch audit history.');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleOpenReopenModal = async () => {
    setShowReopenModal(true);
    setReopenLoading(true);
    try {
      const res = await issueApi.getReopenRequests({ status: 'pending' });
      if (res && res.requests) {
        setReopenRequests(res.requests);
      }
    } catch (err) {
      console.error('Failed to load reopen requests:', err);
    } finally {
      setReopenLoading(false);
    }
  };

  const handleReviewReopen = async (issueId, requestId, decision) => {
    const explanation = reviewExplanationMap[requestId] || '';
    try {
      await issueApi.reviewReopenRequest(issueId, requestId, {
        decision,
        reviewExplanation: explanation,
      });
      setReopenRequests((prev) => prev.filter((r) => r._id !== requestId));
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to review reopen request.');
    }
  };

  const formatStatus = (st) => {
    if (!st) return 'Submitted';
    return st
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Campus Issues & Resolution Workspace
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review submitted student reports, assign responsible campus departments, publish operational updates, and verify resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {stats?.pendingReopens > 0 && (
            <button
              type="button"
              onClick={handleOpenReopenModal}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm animate-pulse"
            >
              <RefreshCw className="w-4 h-4" />
              {stats.pendingReopens} Reopen {stats.pendingReopens === 1 ? 'Request' : 'Requests'}
            </button>
          )}

          <Link
            to="/issues"
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Public Feed View
          </Link>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200/80 dark:border-slate-800 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200/80 dark:border-slate-800 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Submitted</p>
            <p className="text-2xl font-extrabold text-slate-700 dark:text-slate-300">{stats.submitted}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200/80 dark:border-slate-800 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Under Review</p>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{stats.underReview}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200/80 dark:border-slate-800 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">In Progress</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats.inProgress}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200/80 dark:border-slate-800 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Resolved</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.resolved}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200/80 dark:border-slate-800 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Critical Priority</p>
            <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{stats.critical}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#0b1322] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference, title, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st === 'All' ? 'All Statuses' : formatStatus(st)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="All">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Loading issue records...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
          {error}
        </div>
      ) : issues.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0b1322] rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="text-base font-bold text-slate-900 dark:text-white">No Issues Match Filters</p>
          <p className="text-xs text-slate-500">All campus tickets under this filter criteria are cleared.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0b1322] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Issue Title & Location</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Reporter</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {issues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                      <Link to={`/issues/${issue._id}`} className="hover:underline">
                        {issue.referenceId}
                      </Link>
                      <div className="text-[10px] text-slate-400 font-sans font-normal">
                        {issue.visibility === 'private' ? 'Confidential' : 'Public'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {issue.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {issue.location} {issue.room && `(${issue.room})`}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant={issue.priority} size="xs">
                        <span className="capitalize">{issue.priority}</span>
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant={issue.status} size="xs">
                        {formatStatus(issue.status)}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 dark:text-slate-200 font-medium">
                      {issue.assignedDepartment || (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {issue.reporter?.name || 'Anonymous'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatDateTime(issue.createdAt)}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setStatusModalIssue(issue);
                            setNewStatus('');
                            setStatusExplanation('');
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          title="Transition Status"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAssignModalIssue(issue);
                            setAssignDepartment(issue.assignedDepartment || 'Campus Administration');
                            setAssignInstructions('');
                            setAssignTargetDate(
                              issue.targetResolutionDate
                                ? new Date(issue.targetResolutionDate).toISOString().split('T')[0]
                                : ''
                            );
                          }}
                          className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition"
                          title="Assign Department"
                        >
                          <Building className="w-3.5 h-3.5" />
                        </button>

                        {issue.status !== 'resolved' && issue.status !== 'closed' && (
                          <button
                            type="button"
                            onClick={() => {
                              setResolveModalIssue(issue);
                              setResolveSummary('');
                              setResolveActionTaken('');
                              setResolveEvidenceUrl('');
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition"
                            title="Resolve Issue"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setUpdateModalIssue(issue);
                            setUpdateContent('');
                            setUpdateVisibility('public');
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition"
                          title="Add Update / Internal Note"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAudit(issue)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                          title="View Full Audit History"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500">
                Page <strong className="text-slate-900 dark:text-white">{page}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white">{totalPages}</strong> (Total {total} issues)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={Boolean(statusModalIssue)}
        onClose={() => setStatusModalIssue(null)}
        title={`Update Status: ${statusModalIssue?.referenceId}`}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs sm:text-sm">
          <p className="text-xs text-slate-500">
            Current Status: <strong className="text-slate-800 dark:text-slate-200">{formatStatus(statusModalIssue?.status)}</strong>
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            >
              <option value="">Select Target Status</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
              <option value="duplicate">Duplicate</option>
              <option value="reopened">Reopened</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Explanation / Administrative Reason
            </label>
            <textarea
              rows={3}
              value={statusExplanation}
              onChange={(e) => setStatusExplanation(e.target.value)}
              placeholder="Mandatory for rejected, duplicate, and on-hold transitions..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStatusModalIssue(null)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={statusSubmitting || !newStatus}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              {statusSubmitting ? <Spinner size="sm" /> : <Check className="w-3.5 h-3.5" />}
              Save Transition
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(assignModalIssue)}
        onClose={() => setAssignModalIssue(null)}
        title={`Assign Department: ${assignModalIssue?.referenceId}`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Responsible Department
            </label>
            <select
              value={assignDepartment}
              onChange={(e) => setAssignDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            >
              {DEPARTMENTS.slice(1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Resolution Date (Optional)
            </label>
            <input
              type="date"
              value={assignTargetDate}
              onChange={(e) => setAssignTargetDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Instructions for Maintenance Team
            </label>
            <textarea
              rows={3}
              value={assignInstructions}
              onChange={(e) => setAssignInstructions(e.target.value)}
              placeholder="e.g. Bring replacement 15m HDMI cable and ceiling mount ladder..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAssignModalIssue(null)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignSubmitting}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              {assignSubmitting ? <Spinner size="sm" /> : <Building className="w-3.5 h-3.5" />}
              Dispatch Assignment
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(resolveModalIssue)}
        onClose={() => setResolveModalIssue(null)}
        title={`Mark Issue Resolved: ${resolveModalIssue?.referenceId}`}
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Resolution Summary <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={resolveSummary}
              onChange={(e) => setResolveSummary(e.target.value)}
              placeholder="e.g. Replaced burnt HDMI transmitter module and recalibrated projector"
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Action Taken & Technical Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={resolveActionTaken}
              onChange={(e) => setResolveActionTaken(e.target.value)}
              placeholder="Describe physical parts replaced, testing executed, and technician name..."
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Verification Photo URL (Optional)
            </label>
            <input
              type="url"
              value={resolveEvidenceUrl}
              onChange={(e) => setResolveEvidenceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setResolveModalIssue(null)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resolveSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              {resolveSubmitting ? <Spinner size="sm" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Confirm Resolution
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(updateModalIssue)}
        onClose={() => setUpdateModalIssue(null)}
        title={`Add Update: ${updateModalIssue?.referenceId}`}
      >
        <form onSubmit={handleAddUpdateSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Update Type / Visibility
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={updateVisibility === 'public'}
                  onChange={() => setUpdateVisibility('public')}
                />
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                Public Progress Update (Visible to Student)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="visibility"
                  value="internal"
                  checked={updateVisibility === 'internal'}
                  onChange={() => setUpdateVisibility('internal')}
                />
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                Internal Note (Admins Only)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note Content
            </label>
            <textarea
              rows={4}
              value={updateContent}
              onChange={(e) => setUpdateContent(e.target.value)}
              placeholder="e.g. Technician arrived on site; replacement parts ordered under PO-9281..."
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setUpdateModalIssue(null)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateSubmitting || !updateContent.trim()}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              {updateSubmitting ? <Spinner size="sm" /> : <Send className="w-3.5 h-3.5" />}
              Publish Update
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(auditModalIssue)}
        onClose={() => setAuditModalIssue(null)}
        title={`Audit Trail: ${auditModalIssue?.referenceId}`}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
          {auditLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : !auditData ? (
            <p className="text-slate-400">No audit records found.</p>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-400">
                  Status Transition Progression
                </h4>
                <div className="space-y-2">
                  {auditData.statusHistory?.map((h) => (
                    <div key={h._id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>{formatStatus(h.previousStatus)} → <strong className="text-brand-600">{formatStatus(h.newStatus)}</strong></span>
                        <span>{formatDateTime(h.createdAt)}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mt-1">{h.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {auditData.assignmentHistory?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-slate-400">
                    Assignment Records
                  </h4>
                  <div className="space-y-2">
                    {auditData.assignmentHistory.map((a) => (
                      <div key={a._id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center text-[11px] text-slate-400">
                          <span className="font-bold text-purple-600">{a.department}</span>
                          <span>{formatDateTime(a.createdAt)}</span>
                        </div>
                        {a.instructions && <p className="text-slate-600 mt-1">Instructions: {a.instructions}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-400">
                  All Updates & Internal Notes
                </h4>
                <div className="space-y-2">
                  {auditData.updates?.map((u) => (
                    <div
                      key={u._id}
                      className={`p-2.5 rounded-xl border ${
                        u.visibility === 'internal'
                          ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between text-[11px]">
                        <span className={`font-bold uppercase ${u.visibility === 'internal' ? 'text-amber-700' : 'text-slate-400'}`}>
                          {u.visibility === 'internal' ? '🔒 Internal Note' : 'Public Update'}
                        </span>
                        <span className="text-slate-400">{formatDateTime(u.createdAt)}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mt-1">{u.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        title="Pending Reopen Requests"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
          {reopenLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : reopenRequests.length === 0 ? (
            <p className="text-slate-400 italic text-center py-6">
              No pending reopen requests to review.
            </p>
          ) : (
            reopenRequests.map((req) => (
              <div
                key={req._id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                      {req.issue?.referenceId}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {req.issue?.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Requested by {req.requestedBy?.name} on {formatDateTime(req.createdAt)}
                    </p>
                  </div>
                  <Badge variant="reopened" size="xs">
                    Pending Review
                  </Badge>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Student Explanation:</p>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5 italic">"{req.reason}"</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Administrative Review Response
                  </label>
                  <input
                    type="text"
                    placeholder="Provide justification for approval or dismissal..."
                    value={reviewExplanationMap[req._id] || ''}
                    onChange={(e) =>
                      setReviewExplanationMap((prev) => ({
                        ...prev,
                        [req._id]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleReviewReopen(req.issue?._id, req._id, 'rejected')}
                    className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-xl font-bold hover:bg-rose-100 transition"
                  >
                    Dismiss Request
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewReopen(req.issue?._id, req._id, 'approved')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve & Reopen Issue
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminIssuesPage;
