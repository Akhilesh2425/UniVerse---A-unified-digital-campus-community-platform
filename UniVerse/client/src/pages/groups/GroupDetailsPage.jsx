import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { groupApi } from '../../api/groupApi';
import { uploadApi } from '../../api/uploadApi';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import QRCode from 'qrcode';
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
  BookOpen,
  Share2,
  QrCode,
  Download,
  Copy,
  ExternalLink,
  FileText,
  Calendar,
  MapPin,
  Video,
  Mail,
  ChevronDown,
  Camera,
  UploadCloud,
  Image as ImageIcon,
} from 'lucide-react';

const GroupDetailsPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('discussions'); 

  const [membershipLoading, setMembershipLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [userEmailPref, setUserEmailPref] = useState('all');

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', imageUrl: '' });
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postImageUploading, setPostImageUploading] = useState(false);
  const postFileInputRef = useRef(null);
  const postCameraInputRef = useRef(null);

  const [postComments, setPostComments] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState({});

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [joinRequests, setJoinRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resourceSubmitting, setResourceSubmitting] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    resourceType: 'notes',
    fileUrl: '',
    externalUrl: '',
  });

  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activitySubmitting, setActivitySubmitting] = useState(false);
  const [activityForm, setActivityForm] = useState({
    title: '',
    description: '',
    activityType: 'study_session',
    startTime: '',
    endTime: '',
    location: '',
    meetingUrl: '',
  });

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

  useEffect(() => {
    const qrToken = searchParams.get('qr');
    if (qrToken && isAuthenticated) {
      const joinFromQr = async () => {
        try {
          const res = await groupApi.joinViaQrInvitation(qrToken);
          setFeedbackMessage(res.message || 'Joined group successfully via QR code!');
          fetchGroup();
        } catch (err) {
          console.warn('QR join warning:', err.message);
        }
      };
      joinFromQr();
    }
  }, [searchParams, isAuthenticated]);

  useEffect(() => {
    if (!group) return;

    if (activeTab === 'discussions' && group.canAccessDiscussions) {
      loadPosts();
    } else if (activeTab === 'resources') {
      loadResources();
    } else if (activeTab === 'activities') {
      loadActivities();
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

  const loadResources = async () => {
    setResourcesLoading(true);
    try {
      const res = await groupApi.getGroupResources(id);
      setResources(res.resources || []);
    } catch (err) {
      console.warn('Error loading resources:', err.message);
    } finally {
      setResourcesLoading(false);
    }
  };

  const loadActivities = async () => {
    setActivitiesLoading(true);
    try {
      const res = await groupApi.getGroupActivities(id);
      setActivities(res.activities || []);
    } catch (err) {
      console.warn('Error loading activities:', err.message);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    try {
      const res = await groupApi.getGroupMembers(id);
      setMembers(res.members || []);
      const me = (res.members || []).find((m) => m.user?._id === user?._id);
      if (me?.emailPreference) {
        setUserEmailPref(me.emailPreference);
      }
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

  const handleOpenQrModal = async () => {
    setQrModalOpen(true);
    setQrLoading(true);
    try {
      const res = await groupApi.generateGroupInvitation(id);
      const url = `${window.location.origin}/groups/${id}?qr=${res.invitation?.token}`;
      setInviteUrl(url);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      alert(err.message || 'Failed to generate invitation QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 3000);
  };

  const handleEmailPreferenceChange = async (newPref) => {
    setUserEmailPref(newPref);
    try {
      await groupApi.updateGroupEmailPreference(id, newPref);
      setFeedbackMessage(`Email updates set to: ${newPref.replace('_', ' ')}`);
      setTimeout(() => setFeedbackMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update email preference');
    }
  };

  const handlePostImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP, GIF)');
      return;
    }

    setPostImageUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (evt) => {
        try {
          const img = new Image();
          img.src = evt.target.result;
          img.onload = async () => {
            let width = img.width;
            let height = img.height;
            const maxWidth = 1200;
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            const uploadRes = await uploadApi.uploadImage(dataUrl, 'group-post');
            setNewPost((p) => ({ ...p, imageUrl: uploadRes?.url || dataUrl }));
            setPostImageUploading(false);
          };
        } catch (err) {
          console.error(err);
          setPostImageUploading(false);
        }
      };
    } catch (err) {
      console.error(err);
      setPostImageUploading(false);
    }
  };

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
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, commentCount: p.commentCount + 1 } : p))
      );
    } catch (err) {
      alert(err.message || 'Failed to add comment');
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

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

  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!resourceForm.title.trim()) return;
    try {
      setResourceSubmitting(true);
      const res = await groupApi.createGroupResource(id, resourceForm);
      setResources((prev) => [res.resource, ...prev]);
      setResourceModalOpen(false);
      setResourceForm({ title: '', description: '', resourceType: 'notes', fileUrl: '', externalUrl: '' });
      setFeedbackMessage('Resource shared with community members.');
      setTimeout(() => setFeedbackMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to share resource');
    } finally {
      setResourceSubmitting(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      await groupApi.deleteGroupResource(id, resourceId);
      setResources((prev) => prev.filter((r) => r._id !== resourceId));
    } catch (err) {
      alert(err.message || 'Failed to delete resource');
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    if (!activityForm.title.trim() || !activityForm.startTime) return;
    try {
      setActivitySubmitting(true);
      const res = await groupApi.createGroupActivity(id, activityForm);
      setActivities((prev) => [...prev, res.activity].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
      setActivityModalOpen(false);
      setActivityForm({ title: '', description: '', activityType: 'study_session', startTime: '', endTime: '', location: '', meetingUrl: '' });
      setFeedbackMessage('New activity scheduled.');
      setTimeout(() => setFeedbackMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to schedule activity');
    } finally {
      setActivitySubmitting(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      await groupApi.deleteGroupActivity(id, activityId);
      setActivities((prev) => prev.filter((a) => a._id !== activityId));
    } catch (err) {
      alert(err.message || 'Failed to delete activity');
    }
  };

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
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">Loading community...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Community Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">{error || 'This group may have been removed.'}</p>
        <Link
          to="/groups"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/groups"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all communities
        </Link>
      </div>

      {feedbackMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage('')}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="relative min-h-[220px] sm:min-h-[280px] w-full bg-slate-900 overflow-hidden flex flex-col justify-end p-6 sm:p-8">
          {group.coverImage ? (
            <img
              src={group.coverImage}
              alt={group.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-brand-900 via-navy-900 to-slate-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-auto">
            <div className="space-y-2 max-w-2xl">
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

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleOpenQrModal}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md border border-white/20 transition flex items-center gap-1.5"
                title="Generate Group QR Invitation"
              >
                <QrCode className="w-4 h-4 text-brand-300" />
                <span>Invite via QR</span>
              </button>

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
                  className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/30 backdrop-blur-md transition"
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
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
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

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              {group.memberCount} Members
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              {group.postCount} Discussions
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Founded by <span className="font-semibold text-slate-800 dark:text-slate-200">{group.owner?.name}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('discussions')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                activeTab === 'discussions'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Discussions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('resources')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'resources'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Notes & Resources
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('activities')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'activities'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Timetable & Schedule
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                activeTab === 'members'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Members ({group.memberCount})
            </button>
            {group.canManageGroup && group.visibility === 'private' && (
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'requests'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                }`}
              >
                Requests ({joinRequests.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                activeTab === 'about'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              About & Rules
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'discussions' && (
            <div className="space-y-6">
              {!group.canAccessDiscussions ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Private Community Content</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Discussion threads and member resources are private. Request membership to participate in discussions.
                  </p>
                  {!group.hasPendingRequest && (
                    <button
                      type="button"
                      onClick={handleJoinOrRequest}
                      className="mt-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                    >
                      Request to Join Community
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {group.isMember && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        Start a Group Discussion
                      </h3>
                      <form onSubmit={handleCreatePost} className="space-y-3">
                        <input
                          type="text"
                          value={newPost.title}
                          onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
                          placeholder="Discussion title or topic (optional)..."
                          className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <textarea
                          rows={3}
                          required
                          value={newPost.content}
                          onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))}
                          placeholder="Share an update, study question, or campus resource with group members..."
                          className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                        />
                        <input
                          ref={postFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePostImageFile}
                          className="hidden"
                        />
                        <input
                          ref={postCameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePostImageFile}
                          className="hidden"
                        />

                        {newPost.imageUrl && (
                          <div className="relative rounded-xl overflow-hidden max-h-48 border border-slate-200 dark:border-slate-700 bg-slate-900 group/img">
                            <img
                              src={newPost.imageUrl}
                              alt="Post attachment preview"
                              className="w-full h-full object-cover max-h-48"
                            />
                            <button
                              type="button"
                              onClick={() => setNewPost((p) => ({ ...p, imageUrl: '' }))}
                              className="absolute top-2 right-2 p-1 rounded-full bg-slate-950/70 hover:bg-rose-600 text-white transition shadow-sm"
                              title="Remove attached photo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                            <button
                              type="button"
                              disabled={postImageUploading}
                              onClick={() => postFileInputRef.current?.click()}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                            >
                              <UploadCloud className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                              Attach Photo
                            </button>

                            <button
                              type="button"
                              disabled={postImageUploading}
                              onClick={() => postCameraInputRef.current?.click()}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                            >
                              <Camera className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                              Take Photo
                            </button>

                            {postImageUploading && (
                              <span className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 font-semibold animate-pulse">
                                <Spinner size="sm" className="border-brand-600" /> Uploading...
                              </span>
                            )}
                          </div>

                          <button
                            type="submit"
                            disabled={postSubmitting || postImageUploading || !newPost.content.trim()}
                            className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 ml-auto"
                          >
                            {postSubmitting ? (
                              <Spinner size="sm" className="border-white" />
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" /> Post
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {postsLoading ? (
                    <div className="py-12 flex justify-center">
                      <Spinner size="md" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No discussions yet</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Be the first member to start a conversation in this group.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <div
                          key={post._id}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                                {post.author?.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                  {post.author?.name}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {new Date(post.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {(group.isOwner || group.isModerator || post.author?._id === user?._id) && (
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post._id)}
                                className="text-slate-400 hover:text-rose-600 transition p-1"
                                title="Delete post"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {post.title && (
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{post.title}</h4>
                          )}
                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {post.content}
                          </p>

                          {post.imageUrl && (
                            <div className="rounded-xl overflow-hidden max-h-72 border border-slate-100 dark:border-slate-800">
                              <img src={post.imageUrl} alt="Post attachment" className="w-full h-full object-cover" />
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => toggleComments(post._id)}
                              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              {post.commentCount || 0} Comments
                            </button>
                          </div>

                          {expandedComments[post._id] && (
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                              <div className="space-y-2">
                                {(postComments[post._id] || []).map((comment) => (
                                  <div
                                    key={comment._id}
                                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-start justify-between gap-2"
                                  >
                                    <div>
                                      <p className="text-[11px] font-bold text-slate-900 dark:text-white">
                                        {comment.author?.name}
                                        <span className="text-[9px] font-normal text-slate-400 ml-2">
                                          {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
                                      </p>
                                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                                        {comment.content}
                                      </p>
                                    </div>
                                    {(group.isOwner || group.isModerator || comment.author?._id === user?._id) && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComment(post._id, comment._id)}
                                        className="text-slate-400 hover:text-rose-500 transition p-1"
                                        title="Delete comment"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {group.isMember && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={commentInputs[post._id] || ''}
                                    onChange={(e) =>
                                      setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))
                                    }
                                    placeholder="Write a reply..."
                                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-brand-500"
                                  />
                                  <button
                                    type="button"
                                    disabled={commentSubmitting[post._id] || !commentInputs[post._id]?.trim()}
                                    onClick={() => handleCreateComment(post._id)}
                                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                                  >
                                    Reply
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

          {activeTab === 'resources' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Shared Study Notes & Resources</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Repository of lecture summaries, cheat sheets, code links, and study materials.
                  </p>
                </div>
                {group.isMember && (
                  <button
                    type="button"
                    onClick={() => setResourceModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Share Resource
                  </button>
                )}
              </div>

              {resourcesLoading ? (
                <div className="py-12 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : resources.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                  <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No resources shared yet</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload notes or share links to help fellow group members.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resources.map((item) => (
                    <div
                      key={item._id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {item.resourceType}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              by {item.uploadedBy?.name} • {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                          {item.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.fileUrl || item.externalUrl ? (
                          <a
                            href={item.fileUrl || item.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-brand-600 dark:text-brand-300 text-xs font-bold transition flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : null}

                        {(group.isOwner || group.isModerator || item.uploadedBy?._id === user?._id) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteResource(item._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                            title="Delete resource"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Timetable & Scheduled Activities</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track study sessions, group project syncs, assignment milestones, and lab meetups.
                  </p>
                </div>
                {group.isMember && (
                  <button
                    type="button"
                    onClick={() => setActivityModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Schedule Activity
                  </button>
                )}
              </div>

              {activitiesLoading ? (
                <div className="py-12 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : activities.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                  <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No scheduled activities</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Plan an upcoming study group or project discussion.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((act) => (
                    <div
                      key={act._id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                              {act.activityType?.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {new Date(act.startTime).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{act.title}</h4>
                          {act.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{act.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                            {act.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {act.location}
                              </span>
                            )}
                            {act.meetingUrl && (
                              <a
                                href={act.meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <Video className="w-3.5 h-3.5" /> Join Virtual Meeting
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {(group.isOwner || group.isModerator || act.createdBy?._id === user?._id) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(act._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition self-start sm:self-center"
                          title="Delete activity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Community Members</h3>
              {membersLoading ? (
                <div className="py-8 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {members.map((member) => (
                    <div key={member._id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                          {member.user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {member.user?.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {member.user?.department || 'Student'} • Joined{' '}
                            {new Date(member.joinedAt || member.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={member.role}>{member.role?.toUpperCase()}</Badge>
                        {group.canManageGroup && member.role !== 'owner' && (
                          <div className="flex items-center gap-1">
                            {member.role === 'member' ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateRole(member.user._id, 'moderator')}
                                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-brand-600 hover:bg-brand-50"
                              >
                                Make Mod
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateRole(member.user._id, 'member')}
                                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 hover:bg-slate-200"
                              >
                                Demote
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.user._id, member.user?.name)}
                              className="p-1 text-slate-400 hover:text-rose-500"
                              title="Remove member"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && group.canManageGroup && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending Join Requests</h3>
              {requestsLoading ? (
                <div className="py-8 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : joinRequests.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                  No pending membership requests.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {joinRequests.map((req) => (
                    <div key={req._id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                          {req.user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{req.user?.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{req.user?.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleReviewRequest(req._id, 'approved')}
                          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewRequest(req._id, 'rejected')}
                          className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-600 dark:text-slate-300 text-xs font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Community Overview</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {group.description}
                </p>
              </div>

              {group.rules && group.rules.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    Community Guidelines & Rules
                  </h3>
                  <ul className="space-y-2">
                    {group.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                        <span className="w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
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

        <div className="space-y-6">
          {group.isMember && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-600" /> Email Updates
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Choose how often you want email notifications for this group:
              </p>
              <select
                value={userEmailPref}
                onChange={(e) => handleEmailPreferenceChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="all">All Discussions & Resources</option>
                <option value="announcements_only">Announcements Only</option>
                <option value="digest">Weekly Activity Digest</option>
                <option value="muted">Mute All Email Alerts</option>
              </select>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              About Community
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{group.shortDescription}</p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500">Created:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(group.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{group.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500">Access:</span>
                <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">{group.visibility}</span>
              </div>
            </div>

            {group.tags && group.tags.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Tags & Topics
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Community Leadership
            </h3>
            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm ring-2 ring-purple-500/20">
                {group.owner?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{group.owner?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Group Owner • {group.owner?.department}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Group Invitation QR Code</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Students can scan this code using their phone camera to instantly join or request membership in{' '}
              <strong className="text-slate-800 dark:text-slate-200">{group.name}</strong>.
            </p>

            {qrLoading ? (
              <div className="py-12 flex justify-center">
                <Spinner size="md" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <img src={qrDataUrl} alt="Group QR Code" className="w-56 h-56 mx-auto" />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    {copiedInvite ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <a
                    href={qrDataUrl}
                    download={`${group.name}-qrcode.png`}
                    className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download QR
                  </a>
                  <button
                    type="button"
                    onClick={() => setQrModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {resourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Share Notes or Study Material</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add shared notes, cheat sheets, code links, or PDFs for group members.
            </p>
            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm((r) => ({ ...r, title: e.target.value }))}
                  placeholder="e.g. Midterm 1 Study Guide & Solutions"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Resource Type
                  </label>
                  <select
                    value={resourceForm.resourceType}
                    onChange={(e) => setResourceForm((r) => ({ ...r, resourceType: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="notes">Notes / Summary</option>
                    <option value="pdf">PDF Document</option>
                    <option value="document">Document</option>
                    <option value="code">Code / Repository</option>
                    <option value="link">External Link</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Resource Link / URL
                  </label>
                  <input
                    type="url"
                    value={resourceForm.fileUrl || resourceForm.externalUrl}
                    onChange={(e) =>
                      setResourceForm((r) => ({ ...r, fileUrl: e.target.value, externalUrl: e.target.value }))
                    }
                    placeholder="https://drive.google.com/... or link"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm((r) => ({ ...r, description: e.target.value }))}
                  placeholder="Notes overview, chapters covered..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResourceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resourceSubmitting}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {resourceSubmitting ? 'Sharing...' : 'Share Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Schedule Group Activity</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add a study session, lab discussion, or project sync to the group timetable.
            </p>
            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  value={activityForm.title}
                  onChange={(e) => setActivityForm((a) => ({ ...a, title: e.target.value }))}
                  placeholder="e.g. CS201 Assignment 2 Group Study Session"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Activity Type
                  </label>
                  <select
                    value={activityForm.activityType}
                    onChange={(e) => setActivityForm((a) => ({ ...a, activityType: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="study_session">Study Session</option>
                    <option value="meeting">Meeting</option>
                    <option value="exam">Exam Prep</option>
                    <option value="deadline">Project Milestone</option>
                    <option value="social">Social Meetup</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={activityForm.startTime}
                    onChange={(e) => setActivityForm((a) => ({ ...a, startTime: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    value={activityForm.location}
                    onChange={(e) => setActivityForm((a) => ({ ...a, location: e.target.value }))}
                    placeholder="e.g. Library Study Room 4B"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Virtual Link (Meet/Zoom)
                  </label>
                  <input
                    type="url"
                    value={activityForm.meetingUrl}
                    onChange={(e) => setActivityForm((a) => ({ ...a, meetingUrl: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivityModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={activitySubmitting}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {activitySubmitting ? 'Scheduling...' : 'Schedule Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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