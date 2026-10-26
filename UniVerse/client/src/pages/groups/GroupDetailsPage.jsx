import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { groupApi } from '../../api/groupApi';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import {
  Users,
  MessageSquare,
  Shield,
  ShieldCheck,
  Lock,
  Globe,
  Settings,
  Plus,
  Send,
  Trash2,
  Edit2,
  Check,
  X,
  UserPlus,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const GroupDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('discussions'); // 'discussions', 'members', 'requests', 'about'

  // Membership action states
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Discussion / Post states
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', imageUrl: '' });
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Active comments mapping: postId -> comments array & comment input
  const [postComments, setPostComments] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState({});

  // Member management states
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Join requests states
  const [joinRequests, setJoinRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Delete / Action Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fetchGroup = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await groupApi.getGroupById(id);
      if (res && res.group) {
        setGroup(res.group);
      }
    } catch (err) {
      setError(err.message || 'Group could not be found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  // Load Tab Content
  useEffect(() => {
    if (!group) return;

    if (activeTab === 'discussions' && group.canAccessDiscussions) {
      loadPosts();
    } else if (activeTab === 'members') {
      loadMembers();
    } else if (activeTab === 'requests' && group.canManageGroup) {
      loadJoinRequests();
    }
  }, [activeTab, group?.canAccessDiscussions]);

  const loadPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await groupApi.getGroupPosts(id);
      setPosts(res.posts || []);
    } catch (err) {
      console.warn('Error loading posts:', err.message);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    try {
      const res = await groupApi.getGroupMembers(id);
      setMembers(res.members || []);
    } catch (err) {
      console.warn('Error loading members:', err.message);
    } finally {
      setMembersLoading(false);
    }
  };

  const loadJoinRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await groupApi.getJoinRequests(id);
      setJoinRequests(res.requests || []);
    } catch (err) {
      console.warn('Error loading join requests:', err.message);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Join or Request Membership
  const handleJoinOrRequest = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/groups/${id}` } } });
      return;
    }

    setMembershipLoading(true);
    setFeedbackMessage('');

    try {
      const res = await groupApi.joinGroup(id);
      setFeedbackMessage(res.message);
      fetchGroup();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setMembershipLoading(false);
    }
  };

  // Leave Group
  const handleConfirmLeave = async () => {
    setMembershipLoading(true);
    try {
      const res = await groupApi.leaveGroup(id);
      setShowLeaveDialog(false);
      setFeedbackMessage(res.message);
      fetchGroup();
    } catch (err) {
      alert(err.message || 'Failed to leave group');
    } finally {
      setMembershipLoading(false);
    }
  };

  // Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim()) return;

    setPostSubmitting(true);
    try {
      const res = await groupApi.createGroupPost(id, newPost);
      setPosts((prev) => [res.post, ...prev]);
      setNewPost({ title: '', content: '', imageUrl: '' });
      setGroup((prev) => ({ ...prev, postCount: prev.postCount + 1 }));
    } catch (err) {
      alert(err.message || 'Failed to publish post');
    } finally {
      setPostSubmitting(false);
    }
  };

  // Delete Post
  const handleDeletePost = (postId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Discussion Post',
      message: 'Are you sure you want to permanently delete this post and its comments?',
      onConfirm: async () => {
        try {
          await groupApi.deleteGroupPost(id, postId);
          setPosts((prev) => prev.filter((p) => p._id !== postId));
          setGroup((prev) => ({ ...prev, postCount: Math.max(0, prev.postCount - 1) }));
          setConfirmDialog((c) => ({ ...c, isOpen: false }));
        } catch (err) {
          alert(err.message || 'Failed to delete post');
        }
      },
    });
  };

  // Toggle & Load Comments for a Post
  const toggleComments = async (postId) => {
    const isExpanded = !!expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: !isExpanded }));

    if (!isExpanded && !postComments[postId]) {
      try {
        const res = await groupApi.getPostComments(id, postId);
        setPostComments((prev) => ({ ...prev, [postId]: res.comments || [] }));
      } catch (err) {
        console.warn('Error loading comments:', err.message);
      }
    }
  };

  // Create Comment
  const handleCreateComment = async (postId) => {
    const content = commentInputs[postId];
    if (!content || !content.trim()) return;

    setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await groupApi.createPostComment(id, postId, { content: content.trim() });
      setPostComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.comment],
      }));
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      // Update post commentCount in UI
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, commentCount: p.commentCount + 1 } : p))
      );
    } catch (err) {
      alert(err.message || 'Failed to add comment');
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Delete Comment
  const handleDeleteComment = async (postId, commentId) => {
    try {
      await groupApi.deletePostComment(id, postId, commentId);
      setPostComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c._id !== commentId),
      }));
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p))
      );
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  // Review Join Request (Approve/Reject)
  const handleReviewRequest = async (requestId, status) => {
    try {
      await groupApi.reviewJoinRequest(id, requestId, status);
      setJoinRequests((prev) => prev.filter((r) => r._id !== requestId));
      if (status === 'approved') {
        setGroup((prev) => ({ ...prev, memberCount: prev.memberCount + 1 }));
      }
    } catch (err) {
      alert(err.message || `Failed to ${status} request`);
    }
  };

  // Promote / Demote Member Role
  const handleUpdateRole = async (userId, targetRole) => {
    try {
      await groupApi.updateMemberRole(id, userId, targetRole);
      setMembers((prev) =>
        prev.map((m) => (m.user._id === userId ? { ...m, role: targetRole } : m))
      );
    } catch (err) {
      alert(err.message || 'Failed to update member role');
    }
  };

  // Remove Member
  const handleRemoveMember = (userId, memberName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Member',
      message: `Are you sure you want to remove ${memberName} from this community?`,
      onConfirm: async () => {
        try {
          await groupApi.removeMember(id, userId);
          setMembers((prev) => prev.filter((m) => m.user._id !== userId));
          setGroup((prev) => ({ ...prev, memberCount: Math.max(1, prev.memberCount - 1) }));
          setConfirmDialog((c) => ({ ...c, isOpen: false }));
        } catch (err) {
          alert(err.message || 'Failed to remove member');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading community...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold text-slate-900">Community Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">{error || 'This group may have been removed.'}</p>
        <Link
          to="/groups"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/groups"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all communities
        </Link>
      </div>

      {feedbackMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage('')}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Header Area */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="relative h-48 sm:h-64 w-full bg-slate-900 overflow-hidden">
          {group.coverImage ? (
            <img
              src={group.coverImage}
              alt={group.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={group.category}>{group.category}</Badge>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md ${
                    group.visibility === 'public'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {group.visibility === 'public' ? (
                    <>
                      <Globe className="w-3 h-3" /> Public Community
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" /> Private (Approval Required)
                    </>
                  )}
                </span>
                {group.userRole && (
                  <Badge variant={group.userRole}>
                    {group.userRole.toUpperCase()}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                {group.name}
              </h1>
            </div>

            {/* Quick Actions (Join / Leave / Edit) */}
            <div className="flex items-center gap-2.5">
              {group.isOwner || group.isModerator ? (
                <Link
                  to={`/groups/${group._id}/edit`}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md border border-white/20 transition flex items-center gap-1.5"
                >
                  <Settings className="w-4 h-4" />
                  Manage Group
                </Link>
              ) : null}

              {group.isMember ? (
                <button
                  type="button"
                  onClick={() => setShowLeaveDialog(true)}
                  disabled={membershipLoading}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition"
                >
                  Leave Group
                </button>
              ) : group.hasPendingRequest ? (
                <span className="px-4 py-2 bg-amber-500/80 text-white text-xs font-bold rounded-xl backdrop-blur-md">
                  Request Pending
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleJoinOrRequest}
                  disabled={membershipLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {membershipLoading ? (
                    <Spinner size="sm" className="border-white" />
                  ) : group.visibility === 'public' ? (
                    <>
                      <UserPlus className="w-4 h-4" /> Join Community
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Request Membership
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sub-bar with member counts and tab navigation */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-bold text-slate-900">
              <Users className="w-4 h-4 text-indigo-600" />
              {group.memberCount} Members
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              {group.postCount} Discussions
            </span>
            <span className="text-slate-400">
              Founded by <span className="font-semibold text-slate-700">{group.owner?.name}</span>
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b sm:border-b-0 border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('discussions')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'discussions'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Discussions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'members'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Members ({group.memberCount})
            </button>
            {group.canManageGroup && group.visibility === 'private' && (
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                  activeTab === 'requests'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                Requests
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'about'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              About & Rules
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Active Tab Views */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: DISCUSSIONS */}
          {activeTab === 'discussions' && (
            <div className="space-y-6">
              {!group.canAccessDiscussions ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Private Community Content</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Discussion threads and member resources are private. Request membership to participate in discussions.
                  </p>
                  {!group.hasPendingRequest && (
                    <button
                      type="button"
                      onClick={handleJoinOrRequest}
                      className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
                    >
                      Request Membership
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Post Composer for Members */}
                  {group.isMember ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Start a Discussion in {group.name}</span>
                      </div>

                      <form onSubmit={handleCreatePost} className="space-y-3">
                        <input
                          type="text"
                          value={newPost.title}
                          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                          placeholder="Discussion title or topic (optional)..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />

                        <textarea
                          rows={3}
                          required
                          value={newPost.content}
                          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                          placeholder="Share a question, project update, algorithm solution, or resource..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <input
                            type="url"
                            value={newPost.imageUrl}
                            onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                            placeholder="Optional image URL..."
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={postSubmitting || !newPost.content.trim()}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {postSubmitting ? (
                              <Spinner size="sm" className="border-white" />
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Publish Post</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                      <span>Join this community to share posts and ask questions.</span>
                      <button
                        type="button"
                        onClick={handleJoinOrRequest}
                        className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                      >
                        Join to Participate
                      </button>
                    </div>
                  )}

                  {/* Posts Feed */}
                  {postsLoading ? (
                    <div className="py-12 flex justify-center">
                      <Spinner size="md" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                      <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-800">No discussions posted yet</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Be the first to share an update or project idea with this community.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <div
                          key={post._id}
                          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
                        >
                          {/* Post Author Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                {post.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">
                                  {post.author?.name}
                                </h4>
                                <p className="text-[10px] text-slate-400">
                                  {post.author?.department} •{' '}
                                  {new Date(post.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {/* Delete Post Action */}
                            {(user?._id === post.author?._id || group.canManageGroup) && (
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post._id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Post"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Post Content */}
                          <div className="space-y-2">
                            {post.title && (
                              <h3 className="text-base font-bold text-slate-900 leading-snug">
                                {post.title}
                              </h3>
                            )}
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                              {post.content}
                            </p>
                            {post.imageUrl && (
                              <div className="mt-3 rounded-xl overflow-hidden max-h-80 bg-slate-100 border border-slate-100">
                                <img
                                  src={post.imageUrl}
                                  alt="Post attachment"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>

                          {/* Comment Toggle Bar */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => toggleComments(post._id)}
                              className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-700"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{post.commentCount || 0} Comments</span>
                            </button>
                          </div>

                          {/* Comments Section Drawer */}
                          {expandedComments[post._id] && (
                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 bg-slate-50/70 p-4 rounded-xl">
                              {/* Comments List */}
                              {postComments[post._id]?.length === 0 ? (
                                <p className="text-xs text-slate-400 italic text-center py-2">
                                  No comments yet. Join the conversation!
                                </p>
                              ) : (
                                <div className="space-y-2.5">
                                  {postComments[post._id]?.map((cmt) => (
                                    <div
                                      key={cmt._id}
                                      className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs space-y-1"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-800">
                                            {cmt.author?.name}
                                          </span>
                                          <span className="text-[10px] text-slate-400">
                                            {new Date(cmt.createdAt).toLocaleDateString()}
                                          </span>
                                        </div>

                                        {(user?._id === cmt.author?._id || group.canManageGroup) && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteComment(post._id, cmt._id)}
                                            className="text-slate-400 hover:text-rose-600 transition"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-slate-700 leading-relaxed">
                                        {cmt.content}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Comment Input Box for Members */}
                              {group.isMember && (
                                <div className="flex items-center gap-2 pt-2">
                                  <input
                                    type="text"
                                    value={commentInputs[post._id] || ''}
                                    onChange={(e) =>
                                      setCommentInputs({
                                        ...commentInputs,
                                        [post._id]: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleCreateComment(post._id);
                                    }}
                                    placeholder="Write a comment..."
                                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleCreateComment(post._id)}
                                    disabled={commentSubmitting[post._id]}
                                    className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                                  >
                                    Post
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: MEMBERS ROSTER */}
          {activeTab === 'members' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Community Members ({members.length})
              </h3>

              {membersLoading ? (
                <div className="py-12 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {members.map(({ membershipId, role, joinedAt, user: memberUser }) => (
                    <div
                      key={membershipId}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-indigo-700 flex items-center justify-center font-bold text-xs ring-2 ring-slate-100">
                          {memberUser.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {memberUser.name}
                            </span>
                            <Badge variant={role} size="xs">
                              {role}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {memberUser.department} • Member since{' '}
                            {new Date(joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Role Management Actions for Group Owner */}
                      {group.isOwner && memberUser._id !== user?._id && (
                        <div className="flex items-center gap-2">
                          {role === 'member' ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateRole(memberUser._id, 'moderator')}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition"
                            >
                              Make Moderator
                            </button>
                          ) : role === 'moderator' ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateRole(memberUser._id, 'member')}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                            >
                              Demote to Member
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleRemoveMember(memberUser._id, memberUser.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: JOIN REQUESTS (OWNER / MODERATOR ONLY) */}
          {activeTab === 'requests' && group.canManageGroup && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Pending Join Requests ({joinRequests.length})
              </h3>
              <p className="text-xs text-slate-500">
                Review and approve student admission requests for this private community.
              </p>

              {requestsLoading ? (
                <div className="py-12 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : joinRequests.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No pending join requests at this time.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {joinRequests.map((req) => (
                    <div
                      key={req._id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                          {req.user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{req.user?.name}</p>
                          <p className="text-xs text-slate-500">
                            {req.user?.department} • Requested{' '}
                            {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReviewRequest(req._id, 'approved')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewRequest(req._id, 'rejected')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ABOUT & RULES */}
          {activeTab === 'about' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Detailed Community Overview</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {group.description}
                </p>
              </div>

              {group.rules && group.rules.length > 0 && (
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Community Guidelines & Rules
                  </h3>
                  <ul className="space-y-2">
                    {group.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Supporting Sidebar */}
        <div className="space-y-6">
          {/* Group Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              About Community
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">{group.shortDescription}</p>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Created:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(group.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="font-semibold text-slate-800">{group.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Access:</span>
                <span className="font-semibold capitalize text-slate-800">{group.visibility}</span>
              </div>
            </div>

            {/* Tags */}
            {group.tags && group.tags.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Tags & Topics
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Group Leadership Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Community Leadership
            </h3>
            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                {group.owner?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{group.owner?.name}</p>
                <p className="text-[10px] text-slate-500">Group Owner • {group.owner?.department}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Group Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        onConfirm={handleConfirmLeave}
        title="Leave Community"
        message={`Are you sure you want to leave ${group.name}? You will lose access to member discussions and resources.`}
        confirmText="Leave Community"
        danger={true}
        loading={membershipLoading}
      />

      {/* Action Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((c) => ({ ...c, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Confirm"
        danger={true}
      />
    </div>
  );
};

export default GroupDetailsPage;
