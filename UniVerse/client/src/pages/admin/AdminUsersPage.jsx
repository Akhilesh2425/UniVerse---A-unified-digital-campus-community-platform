import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  AlertTriangle,
  Eye,
  CheckCircle,
  Clock,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';

const AdminUsersPage = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const [inspectUser, setInspectUser] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [roleModalUser, setRoleModalUser] = useState(null);

  const [newStatus, setNewStatus] = useState('active');
  const [statusReason, setStatusReason] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({
        q: search,
        role: roleFilter,
        status: statusFilter,
        department: departmentFilter,
        page,
        limit: 15,
      });

      if (res && res.users) {
        setUsers(res.users);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, departmentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleInspect = async (u) => {
    try {
      setInspectLoading(true);
      const res = await adminApi.getUserById(u._id);
      if (res) {
        setInspectUser(res);
      }
    } catch (err) {
      console.error('Error fetching user detail:', err);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusModalUser) return;
    try {
      setActionLoading(true);
      setActionError('');
      await adminApi.updateUserStatus(statusModalUser._id, {
        status: newStatus,
        reason: statusReason,
      });
      setActionSuccess(`Status for ${statusModalUser.name} updated to ${newStatus}.`);
      setTimeout(() => {
        setStatusModalUser(null);
        setActionSuccess('');
        fetchUsers();
      }, 1200);
    } catch (err) {
      setActionError(err.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleModalUser) return;
    try {
      setActionLoading(true);
      setActionError('');
      await adminApi.updateUserRole(roleModalUser._id, { role: newRole });
      setActionSuccess(`Role for ${roleModalUser.name} updated to ${newRole}.`);
      setTimeout(() => {
        setRoleModalUser(null);
        setActionSuccess('');
        fetchUsers();
      }, 1200);
    } catch (err) {
      setActionError(err.message || 'Failed to update user role.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            User Administration
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review campus accounts, manage platform roles, and update student access status
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
              placeholder="Search by student name or university email..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-hidden focus:border-brand-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-hidden font-medium"
            >
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="admin">Administrators</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-hidden font-medium"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Spinner size="md" />
            <p className="mt-2 text-xs text-slate-500 font-medium">Fetching registered users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No matching campus users found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search criteria or role filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department & Year</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {users.map((u) => {
                  const isCurrentAdmin = u._id === currentAdmin?._id || u._id === currentAdmin?.id;
                  return (
                    <tr
                      key={u._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs uppercase">
                              {u.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                              {u.name}
                              {isCurrentAdmin && (
                                <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-extrabold uppercase">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-400">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                            u.role === 'admin'
                              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {u.role === 'admin' && <Shield className="w-3 h-3 mr-1 text-amber-600" />}
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900 dark:text-slate-200">
                          {u.department}
                        </p>
                        <p className="text-[10px] text-slate-400">{u.academicYear}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                            u.status === 'active' || !u.status
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : u.status === 'suspended'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {u.status || 'active'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleInspect(u)}
                            title="Inspect User Details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!isCurrentAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setStatusModalUser(u);
                                  setNewStatus(u.status || 'active');
                                  setStatusReason('');
                                  setActionError('');
                                }}
                                title="Update Account Status"
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                              >
                                Status
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRoleModalUser(u);
                                  setNewRole(u.role === 'admin' ? 'student' : 'admin');
                                  setActionError('');
                                }}
                                title="Change User Role"
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 hover:bg-brand-100 transition"
                              >
                                Role
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing page {page} of {totalPages} ({total} users)
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

      {inspectUser && (
        <Modal
          isOpen={!!inspectUser}
          onClose={() => setInspectUser(null)}
          title="Campus Account Profile"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-base uppercase">
                {inspectUser.user.name.charAt(0)}
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {inspectUser.user.name}
                </p>
                <p className="text-slate-500">{inspectUser.user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={inspectUser.user.role === 'admin' ? 'important' : 'primary'}>
                    {inspectUser.user.role}
                  </Badge>
                  <span className="capitalize text-slate-400">
                    Status: {inspectUser.user.status || 'active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Department</p>
                <p className="font-semibold text-xs mt-0.5">{inspectUser.user.department}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Academic Year</p>
                <p className="font-semibold text-xs mt-0.5">{inspectUser.user.academicYear}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
              <p className="font-bold text-slate-900 dark:text-white mb-2">
                Platform Activity Summary
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50">
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {inspectUser.activitySummary?.eventsRegistered || 0}
                  </p>
                  <p className="text-[10px] text-slate-500">Events</p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {inspectUser.activitySummary?.groupsJoined || 0}
                  </p>
                  <p className="text-[10px] text-slate-500">Groups</p>
                </div>
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50">
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {inspectUser.activitySummary?.discussionsAuthored || 0}
                  </p>
                  <p className="text-[10px] text-slate-500">Posts</p>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                  <p className="text-lg font-bold text-rose-700 dark:text-rose-300">
                    {inspectUser.activitySummary?.issuesReported || 0}
                  </p>
                  <p className="text-[10px] text-slate-500">Issues</p>
                </div>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                type="button"
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {statusModalUser && (
        <Modal
          isOpen={!!statusModalUser}
          onClose={() => setStatusModalUser(null)}
          title={`Update Status: ${statusModalUser.name}`}
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium">
                {actionSuccess}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="active">Active (Normal Access)</option>
                <option value="suspended">Suspended (Blocked from Login)</option>
                <option value="deactivated">Deactivated (Account Closed)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason / Administrative Note (Required for suspensions)
              </label>
              <textarea
                rows={3}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Explain the reason for this account status update..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold flex items-center gap-1.5"
              >
                {actionLoading && <Spinner size="xs" />}
                Confirm Status Update
              </button>
            </div>
          </form>
        </Modal>
      )}

      {roleModalUser && (
        <Modal
          isOpen={!!roleModalUser}
          onClose={() => setRoleModalUser(null)}
          title={`Change Platform Role: ${roleModalUser.name}`}
        >
          <form onSubmit={handleRoleSubmit} className="space-y-4 text-xs">
            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium">
                {actionSuccess}
              </div>
            )}

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                <strong>Security Notice:</strong> Changing a user to Administrator grants full access to platform moderation, user status updates, campus issue resolution, and system audit logs.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="student">Student (Standard User)</option>
                <option value="admin">Administrator (Command Center Access)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold flex items-center gap-1.5"
              >
                {actionLoading && <Spinner size="xs" />}
                Confirm Role Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsersPage;
