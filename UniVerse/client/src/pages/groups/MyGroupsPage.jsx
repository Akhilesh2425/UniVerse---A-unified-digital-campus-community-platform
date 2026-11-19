import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { groupApi } from '../../api/groupApi';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  Users,
  Clock,
  PlusCircle,
  Compass,
  ArrowRight,
  Shield,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Globe,
  LogOut,
  Calendar,
} from 'lucide-react';

const MyGroupsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('memberships'); 
  const [roleFilter, setRoleFilter] = useState('all'); 

  const [leaveGroupId, setLeaveGroupId] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await groupApi.getMyGroups();
      setGroups(res.groups || []);
      setPendingRequests(res.pendingRequests || []);
    } catch (err) {
      setError(err.message || 'Failed to load your communities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const handleConfirmLeave = async () => {
    if (!leaveGroupId) return;
    setLeaveLoading(true);
    try {
      const res = await groupApi.leaveGroup(leaveGroupId);
      setFeedback(res.message || 'You have left the community.');
      setLeaveGroupId(null);
      fetchMyGroups();
    } catch (err) {
      alert(err.message || 'Failed to leave group');
      setLeaveGroupId(null);
    } finally {
      setLeaveLoading(false);
    }
  };

  const filteredGroups = groups.filter((item) => {
    if (roleFilter === 'all') return true;
    return item.role === roleFilter;
  });

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-gradient-to-r from-navy via-brand-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden border border-brand-800/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              <Users className="w-3.5 h-3.5" />
              My Campus Memberships
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              My Groups & Communities
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              Manage all campus clubs, technical societies, and study groups you belong to or lead.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/groups"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              Explore All
            </Link>
            <Link
              to="/groups/create"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Create Group
            </Link>
          </div>
        </div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback('')}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchMyGroups}
            className="text-xs font-bold text-rose-700 dark:text-rose-300 underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('memberships')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'memberships'
                ? 'bg-slate-900 text-white dark:bg-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Joined Communities ({groups.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-slate-900 text-white dark:bg-brand-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending Requests ({pendingRequests.length})
          </button>
        </div>

        {activeTab === 'memberships' && groups.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Role:</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  roleFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('owner')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  roleFilter === 'owner'
                    ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('moderator')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  roleFilter === 'moderator'
                    ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Moderator
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('member')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  roleFilter === 'member'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Member
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner size="lg" className="border-brand-600 mb-4" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Fetching your communities...</p>
        </div>
      ) : activeTab === 'memberships' ? (
        filteredGroups.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4 font-extrabold text-2xl">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {roleFilter === 'all'
                ? "You haven't joined any communities yet"
                : `No communities found where you are a ${roleFilter}`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
              Discover student clubs, technical teams, and creative societies to expand your campus network
              and collaborate on real projects.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/groups"
                className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition shadow-md"
              >
                Browse Campus Groups
              </Link>
              <Link
                to="/groups/create"
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Found a Club
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map(({ membershipId, role, joinedAt, group }) => (
              <div
                key={membershipId}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col overflow-hidden group"
              >
                <div className="relative h-32 w-full bg-slate-900 overflow-hidden">
                  {group.coverImage ? (
                    <img
                      src={group.coverImage}
                      alt={group.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <Badge variant={group.category}>{group.category}</Badge>
                    <Badge variant={role}>{role.toUpperCase()}</Badge>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-base font-bold text-white truncate drop-shadow-sm">
                      {group.name}
                    </h3>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {group.shortDescription}
                    </p>

                    <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {group.memberCount} members
                      </span>
                      <span className="flex items-center gap-1">
                        {group.visibility === 'public' ? (
                          <>
                            <Globe className="w-3.5 h-3.5 text-emerald-500" /> Public
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-500" /> Private
                          </>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Joined {new Date(joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <Link
                      to={`/groups/${group._id}`}
                      className="px-4 py-2 bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      Open Hub
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => setLeaveGroupId(group._id)}
                        className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition"
                      >
                        Leave
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        pendingRequests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 font-extrabold text-2xl">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Pending Join Requests</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
              When you request to join private campus communities, your applications will be tracked here
              until an owner or moderator approves them.
            </p>
            <Link
              to="/groups"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition inline-block shadow-md"
            >
              Discover Private Communities
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map(({ requestId, status, createdAt, group }) => (
              <div
                key={requestId}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold flex-shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{group.name}</h4>
                      <Badge variant={group.category}>{group.category}</Badge>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        PENDING APPROVAL
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{group.shortDescription}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Submitted on {new Date(createdAt).toLocaleDateString()} • Pending community owner review
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/groups/${group._id}`}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                  >
                    View Community
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <ConfirmDialog
        isOpen={!!leaveGroupId}
        onClose={() => setLeaveGroupId(null)}
        onConfirm={handleConfirmLeave}
        title="Leave Community"
        message="Are you sure you want to leave this community? You will lose access to member discussions and private resources."
        confirmText="Leave Community"
        cancelText="Stay a Member"
        danger={true}
        loading={leaveLoading}
      />
    </div>
  );
};

export default MyGroupsPage;
