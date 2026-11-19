import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import {
  History,
  Search,
  Filter,
  Shield,
  Clock,
  ArrowUpDown,
  Lock,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAuditLogs({
        q: search,
        action: actionFilter,
        targetType: targetFilter,
        page,
        limit: 20,
      });

      if (res && res.logs) {
        setLogs(res.logs);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionFilter, targetFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('ROLE') || action.includes('STATUS')) return 'important';
    if (action.includes('RESOLVE') || action.includes('PUBLISH')) return 'resolved';
    if (action.includes('DELETE') || action.includes('CLOSE')) return 'closed';
    return 'primary';
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Security & Operations Audit Trail
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Immutable forensic log of all administrative operations, role promotions, status changes, and resolutions
        </p>
      </div>

      <div className="bg-white dark:bg-[#0b1322] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit descriptions, keywords..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-hidden focus:border-brand-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-hidden font-medium"
            >
              <option value="">All Actions</option>
              <option value="USER_ROLE_CHANGE">User Role Changes</option>
              <option value="USER_STATUS_CHANGE">User Status Changes</option>
              <option value="ISSUE_STATUS_CHANGE">Issue Status Changes</option>
              <option value="ISSUE_ASSIGNMENT">Issue Assignments</option>
              <option value="ISSUE_RESOLVE">Issue Resolutions</option>
              <option value="ANNOUNCEMENT_PUBLISH">Announcements Published</option>
              <option value="DISCUSSION_MODERATE">Discussion Moderation</option>
            </select>

            <select
              value={targetFilter}
              onChange={(e) => {
                setTargetFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-hidden font-medium"
            >
              <option value="">All Targets</option>
              <option value="User">User Accounts</option>
              <option value="CampusIssue">Campus Issues</option>
              <option value="Event">Campus Events</option>
              <option value="Announcement">Announcements</option>
              <option value="Group">Student Groups</option>
              <option value="DiscussionPost">Discussions</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition"
            >
              Filter Logs
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Spinner size="md" />
            <p className="mt-2 text-xs text-slate-500 font-medium">Loading audit history...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Lock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No audit records found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Actions by administrators will automatically be recorded here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Admin Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Target Resource</th>
                  <th className="py-3.5 px-4">Event Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {log.actor?.avatarUrl ? (
                          <img
                            src={log.actor.avatarUrl}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-[10px] uppercase">
                            {log.actor?.name?.charAt(0) || 'A'}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">
                            {log.actor?.name || 'Administrator'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {log.actor?.email || 'admin@universe.edu'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300/40 dark:border-slate-700">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.targetType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-md">
                      <p className="leading-relaxed">{log.description}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing page {page} of {totalPages} ({total} audit events)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-medium"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
