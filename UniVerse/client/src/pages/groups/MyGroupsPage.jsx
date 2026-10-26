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
  Sparkles,
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
  const [activeTab, setActiveTab] = useState('memberships'); // 'memberships' | 'pending'
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'owner' | 'moderator' | 'member'

  // Action feedback & leave modal
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
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Create Group
            </Link>
          </div>
        </div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback('')}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchMyGroups}
            className="text-xs font-bold text-rose-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('memberships')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'memberships'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending Requests ({pendingRequests.length})
          </button>
        </div>

        {activeTab === 'memberships' && groups.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  roleFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('owner')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  roleFilter === 'owner' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('moderator')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  roleFilter === 'moderator' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                Moderator
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('member')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  roleFilter === 'member' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Member
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner size="lg" className="border-indigo-600 mb-4" />
          <p className="text-sm text-slate-500 font-medium">Fetching your communities...</p>
        </div>
      ) : activeTab === 'memberships' ? (
        /* Joined Communities Tab */
        filteredGroups.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 font-extrabold text-2xl">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {roleFilter === 'all'
                ? "You haven't joined any communities yet"
                : `No communities found where you are a ${roleFilter}`}
            </h3>
            <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
              Discover student clubs, technical teams, and creative societies to expand your campus network
              and collaborate on real projects.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/groups"
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
              >
                Browse Campus Groups
              </Link>
              <Link
                to="/groups/create"
                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
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
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col overflow-hidden group"
              >
                {/* Banner / Cover */}
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

                  {/* Badges */}
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

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {group.shortDescription}
                    </p>

                    <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-400 font-medium">
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

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/groups/${group._id}`}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      Open Hub
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => setLeaveGroupId(group._id)}
                        className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
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
        /* Pending Applications Tab */
        pendingRequests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 font-extrabold text-2xl">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Pending Join Requests</h3>
            <p className="text-xs text-slate-500 mt-2 mb-6">
              When you request to join private campus communities, your applications will be tracked here
              until an owner or moderator approves them.
            </p>
            <Link
              to="/groups"
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition inline-block"
            >
              Discover Private Communities
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map(({ requestId, status, createdAt, group }) => (
              <div
                key={requestId}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900">{group.name}</h4>
                      <Badge variant={group.category}>{group.category}</Badge>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        PENDING APPROVAL
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{group.shortDescription}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Submitted on {new Date(createdAt).toLocaleDateString()} • Pending community owner review
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/groups/${group._id}`}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    View Community
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Leave Group Confirmation Dialog */}
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
