import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { groupApi } from '../../api/groupApi';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
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

const PRESET_BANNERS = [
  {
    name: 'Tech / Cyber Matrix',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Coding / Software',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'AI & Data Science',
    url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Campus / Academic',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Design & Photography',
    url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Innovation & Startup',
    url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
  },
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

        // Check if user is owner or moderator
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
        <Spinner size="lg" className="border-indigo-600 mb-4" />
        <p className="text-sm text-slate-500 font-medium">Loading community settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back button */}
      <div>
        <Link
          to={`/groups/${id}`}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Community Page
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
            <Settings className="w-3.5 h-3.5" />
            Community Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Edit Community Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Update name, discovery category, rules, cover image, and membership policies.
          </p>
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="font-semibold">{success}</p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Identity Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Identity & Overview
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Community Name <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {formData.name.length} / 100
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition bg-white"
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
                <label htmlFor="shortDescription" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Short Tagline <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {formData.shortDescription.length} / 250
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-y leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              Access & Visibility Setting
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.visibility === 'public'
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900">Public Community</span>
                    <span className="block text-[11px] font-semibold text-emerald-600">Open Access</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Direct one-click join for campus students. Content and posts are open.
              </p>
            </label>

            <label
              className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.visibility === 'private'
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900">Private Community</span>
                    <span className="block text-[11px] font-semibold text-amber-600">Request Required</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Requires join request review and approval by community moderators.
              </p>
            </label>
          </div>
        </div>

        {/* Media & Presets */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-600" />
              Cover Image
            </h2>
          </div>

          <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
            {formData.coverImage ? (
              <img
                src={formData.coverImage}
                alt="Banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = PRESET_BANNERS[0].url;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                No cover image
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
              <p className="text-white font-bold text-base truncate">{formData.name}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESET_BANNERS.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => handleSelectPreset(preset.url)}
                  className={`group relative h-20 rounded-xl overflow-hidden border-2 text-left transition ${
                    formData.coverImage === preset.url
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 p-2 flex items-end">
                    <span className="text-[11px] font-bold text-white leading-tight">
                      {preset.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="customCover" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Custom Image URL
            </label>
            <input
              id="customCover"
              name="coverImage"
              type="url"
              value={formData.coverImage}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>
        </div>

        {/* Rules & Tags */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Rules & Tags
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="rules" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Rules (One per line)
              </label>
              <textarea
                id="rules"
                name="rules"
                rows={4}
                value={formData.rules}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition font-mono text-xs leading-relaxed"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tags (Comma-separated)
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to={`/groups/${id}`}
            className="px-6 py-3 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saveLoading}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition flex items-center justify-center min-w-[160px] disabled:opacity-50"
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

      {/* Danger Zone: Delete Community (Owner only) */}
      {isOwner && (
        <div className="mt-12 bg-rose-50/50 rounded-3xl border border-rose-200 p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold flex-shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950">Danger Zone: Disband Community</h3>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">
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

      {/* Delete Confirmation Dialog */}
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
