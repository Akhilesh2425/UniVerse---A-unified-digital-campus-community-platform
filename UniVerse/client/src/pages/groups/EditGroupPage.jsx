import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { groupApi } from '../../api/groupApi';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ImageUploadPicker from '../../components/common/ImageUploadPicker';
import {
  Users,
  Globe,
  Lock,
  Image as ImageIcon,
  BookOpen,
  Tag,
  ArrowLeft,
  Settings,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Save,
} from 'lucide-react';

const CATEGORIES = [
  'Technical',
  'Coding & Competitive Programming',
  'Artificial Intelligence & Machine Learning',
  'Academic & Research',
  'Cultural',
  'Sports & Fitness',
  'Entrepreneurship',
  'Arts & Photography',
  'Social Impact',
  'Other',
];

const EditGroupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [initialLoading, setInitialLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    category: 'Technical',
    coverImage: '',
    visibility: 'public',
    rules: '',
    tags: '',
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setInitialLoading(true);
        setError('');
        const res = await groupApi.getGroupById(id);
        const group = res.group;

        if (!group) {
          setError('Community not found');
          return;
        }

        if (!group.canManageGroup) {
          setError('Permission denied: You do not have manager privileges for this community.');
          return;
        }

        setIsOwner(group.isOwner);

        setFormData({
          name: group.name || '',
          shortDescription: group.shortDescription || '',
          description: group.description || '',
          category: group.category || 'Technical',
          coverImage: group.coverImage || '',
          visibility: group.visibility || 'public',
          rules: Array.isArray(group.rules) ? group.rules.join('\n') : group.rules || '',
          tags: Array.isArray(group.tags) ? group.tags.join(', ') : group.tags || '',
        });
      } catch (err) {
        setError(err.message || 'Failed to load community details.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchGroupData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectPreset = (url) => {
    setFormData((prev) => ({ ...prev, coverImage: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setError('Group name must be at least 3 characters long.');
      return;
    }
    if (!formData.shortDescription.trim()) {
      setError('Please provide a short summary description.');
      return;
    }
    if (formData.shortDescription.trim().length > 250) {
      setError('Short description cannot exceed 250 characters.');
      return;
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setError('Detailed description must be at least 10 characters.');
      return;
    }

    setSaveLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim(),
        category: formData.category,
        coverImage: formData.coverImage.trim(),
        visibility: formData.visibility,
        rules: formData.rules,
        tags: formData.tags,
      };

      const res = await groupApi.updateGroup(id, payload);
      setSuccess('Community settings saved successfully!');
      setTimeout(() => {
        navigate(`/groups/${id}`);
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    setDeleteLoading(true);
    try {
      await groupApi.deleteGroup(id);
      navigate('/groups');
    } catch (err) {
      alert(err.message || 'Failed to delete community');
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" className="border-brand-600 mb-4" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading community settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <Link
          to={`/groups/${id}`}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Community Page
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-900 mb-2">
            <Settings className="w-3.5 h-3.5" />
            Community Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Edit Community Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Update name, discovery category, rules, cover image, and membership policies.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <p className="font-semibold">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error</p>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Community Identity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Update name, category, and public overview.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Group / Club Name <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {formData.name.length} / 100 characters
                </span>
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={100}
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="shortDescription" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Short Tagline / Summary <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {formData.shortDescription.length} / 250 characters
                </span>
              </div>
              <input
                id="shortDescription"
                name="shortDescription"
                type="text"
                required
                maxLength={250}
                value={formData.shortDescription}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Full Community Description <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Detailed description</span>
              </div>
              <textarea
                id="description"
                name="description"
                rows={5}
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition resize-y leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Membership & Access Policy
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Choose how students join and discover this community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.visibility === 'public'
                  ? 'border-brand-600 bg-brand-50/40 dark:bg-brand-950/40 shadow-sm shadow-brand-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">Public Community</span>
                    <span className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Open Access</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={handleChange}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Direct join for all verified campus accounts.
              </p>
            </label>

            <label
              className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.visibility === 'private'
                  ? 'border-brand-600 bg-brand-50/40 dark:bg-brand-950/40 shadow-sm shadow-brand-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">Private Community</span>
                    <span className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400">Approval Required</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={handleChange}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Requires join request and owner/moderator approval.
              </p>
            </label>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <ImageUploadPicker
            value={formData.coverImage}
            onChange={(url) => setFormData((prev) => ({ ...prev, coverImage: url }))}
            title={formData.name}
            namePrefix="group"
            label="Cover Banner & Branding"
            subLabel="Upload a new banner from your computer, capture with camera, or choose a theme preset."
          />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Community Guidelines & Tags
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Guidelines and search tags.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="rules" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Rules (One per line)
              </label>
              <textarea
                id="rules"
                name="rules"
                rows={4}
                value={formData.rules}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition font-mono text-xs leading-relaxed"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Tags (Comma-separated)
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to={`/groups/${id}`}
            className="px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saveLoading}
            className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-600/20 transition flex items-center justify-center min-w-[160px] disabled:opacity-50"
          >
            {saveLoading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" className="border-white" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </span>
            )}
          </button>
        </div>
      </form>

      {isOwner && (
        <div className="mt-12 bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl border border-rose-200 dark:border-rose-900/60 p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold flex-shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950 dark:text-rose-200">Danger Zone: Disband Community</h3>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 leading-relaxed">
                Permanently deletes this campus community along with all memberships, discussion posts,
                comments, and join requests. This action cannot be reversed.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Disband Group Permanently
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteGroup}
        title="Disband Community"
        message="Are you completely sure you want to permanently delete this group? All discussion feeds, comments, and member records will be permanently erased."
        confirmText="Yes, Delete Permanently"
        cancelText="Keep Community"
        danger={true}
        loading={deleteLoading}
      />
    </div>
  );
};

export default EditGroupPage;
