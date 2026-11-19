import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { issueApi } from '../../api/issueApi';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import {
  BookmarkCheck,
  Search,
  PlusCircle,
  Copy,
  Check,
  MapPin,
  Clock,
  ArrowRight,
  Filter,
  AlertTriangle,
  Building,
  CheckCircle2,
  Lock,
  Globe,
} from 'lucide-react';

const STATUS_FILTERS = [
  'All',
  'submitted',
  'under_review',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
  'rejected',
];

const MyReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {};
        if (statusFilter !== 'All') params.status = statusFilter;
        if (searchTerm.trim()) params.search = searchTerm.trim();

        const res = await issueApi.getMyReports(params);
        if (res && res.issues) {
          setReports(res.issues);
        }
      } catch (err) {
        console.error('Failed to load my reports:', err);
        setError(err.message || 'Failed to fetch personal reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [statusFilter, searchTerm]);

  const handleCopy = (e, refId) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(refId);
    setCopiedId(refId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatStatus = (st) => {
    if (!st) return 'Submitted';
    return st
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Campus Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track all campus issues you have raised, including private confidential reports and live progress updates.
          </p>
        </div>

        <Link
          to="/issues/create"
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Report Another Issue
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {STATUS_FILTERS.map((st) => {
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st === 'All' ? 'All My Reports' : formatStatus(st)}
              </button>
            );
          })}
        </div>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, location, or reference ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Loading your reported issues...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center space-y-2">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0b1322] border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <BookmarkCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Reports Found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            You haven't reported any campus issues matching this filter. If you notice problems with facilities or equipment, raise a report to get it fixed.
          </p>
          <Link
            to="/issues/create"
            className="inline-block px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Report an Issue Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Link
              key={report._id}
              to={`/issues/${report._id}`}
              className="block group bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/50 shadow-xs hover:shadow-md transition p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      onClick={(e) => handleCopy(e, report.referenceId)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold cursor-pointer hover:bg-slate-200 transition"
                      title="Copy Reference ID"
                    >
                      <span>{report.referenceId}</span>
                      {copiedId === report.referenceId ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </div>

                    <Badge variant={report.status} size="xs">
                      {formatStatus(report.status)}
                    </Badge>

                    <Badge variant={report.priority} size="xs">
                      <span className="capitalize">{report.priority}</span>
                    </Badge>

                    <Badge variant={report.category} size="xs">
                      {report.category}
                    </Badge>

                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {report.visibility === 'private' ? (
                        <>
                          <Lock className="w-3 h-3 text-amber-500" /> Private
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3 text-emerald-500" /> Public
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {report.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-500" />
                      <span className="text-slate-700 dark:text-slate-300">{report.location}</span>
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatRelativeTime(report.createdAt)}
                    </span>

                    {report.assignedDepartment && (
                      <span className="inline-flex items-center gap-1 font-medium text-purple-700 dark:text-purple-300">
                        <Building className="w-3.5 h-3.5" />
                        {report.assignedDepartment}
                      </span>
                    )}
                  </div>

                  {report.latestPublicUpdate && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 mt-2">
                      <strong className="text-brand-600 dark:text-brand-400 font-semibold">Latest Update:</strong>{' '}
                      {report.latestPublicUpdate.content}
                    </div>
                  )}
                </div>

                <div className="self-center sm:self-auto shrink-0 flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                  <span>Track Issue</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
