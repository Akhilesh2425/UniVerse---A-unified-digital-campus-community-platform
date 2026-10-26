import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { groupApi } from '../../api/groupApi';
import Spinner from '../../components/common/Spinner';
import {
  Users,
  Globe,
  Lock,
  Image as ImageIcon,
  BookOpen,
  Tag,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
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

const CreateGroupPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    category: 'Technical',
    coverImage: PRESET_BANNERS[0].url,
    visibility: 'public',
    rules: '1. Be respectful to all campus members.\n2. No spam or promotional flooding.\n3. Keep discussions relevant to the community topic.',
    tags: 'campus, students, collaboration',
  });

  const [customImageUrl, setCustomImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectPreset = (url) => {
    setFormData((prev) => ({ ...prev, coverImage: url }));
    setCustomImageUrl('');
  };

  const handleCustomImageChange = (e) => {
    const val = e.target.value;
    setCustomImageUrl(val);
    setFormData((prev) => ({ ...prev, coverImage: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setError('Group name must be at least 3 characters long.');
      return;
    }
    if (!formData.shortDescription.trim()) {
      setError('Please provide a short summary description for discovery cards.');
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

    setLoading(true);

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

      const res = await groupApi.createGroup(payload);
      if (res && res.group) {
        navigate(`/groups/${res.group._id}`);
      } else {
        navigate('/groups');
      }
    } catch (err) {
      setError(err.message || 'Failed to create group. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back button */}
      <div>
        <Link
          to="/groups"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Communities
        </Link>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Module 3 • Communities
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Found a Campus Community
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Create an official campus club, academic research circle, or student group. You'll be
            designated as the founding owner with full moderation authority.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error creating group</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Community Identity
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Give your community a clear name, category, and concise description for the campus registry.
            </p>
          </div>

          <div className="space-y-4">
            {/* Group Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-700">
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
                placeholder="e.g. Google Developer Student Club, Algorithmic Knights"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Primary Category <span className="text-rose-500">*</span>
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

            {/* Short Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="shortDescription" className="text-xs font-bold uppercase tracking-wider text-slate-700">
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
                placeholder="A one-sentence summary displayed on community discovery cards..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            {/* Detailed Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Full Community Description <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Markdown supported</span>
              </div>
              <textarea
                id="description"
                name="description"
                rows={5}
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your community's goals, regular meetups, projects, membership expectations, and upcoming campus initiatives..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-y leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Visibility & Access Settings */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              Membership & Access Policy
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Choose how students join and discover this community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Public Option */}
            <label
              className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.visibility === 'public'
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-sm shadow-indigo-100'
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
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Any verified student can discover the community and join directly with one click.
                Discussions and members are visible to the entire campus.
              </p>
            </label>

            {/* Private Option */}
            <label
              className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.visibility === 'private'
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-sm shadow-indigo-100'
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
                    <span className="block text-[11px] font-semibold text-amber-600">Approval Required</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Students discover the club but must submit a join request. Group owners and moderators
                review and approve each member before granting access to discussions.
              </p>
            </label>
          </div>
        </div>

        {/* Section 3: Visual Cover & Media */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-600" />
              Cover Banner & Branding
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select a curated campus theme banner or provide a custom high-resolution image URL.
            </p>
          </div>

          {/* Live Preview */}
          <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner">
            {formData.coverImage ? (
              <img
                src={formData.coverImage}
                alt="Cover Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = PRESET_BANNERS[0].url;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                No cover image selected
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
              <div className="text-white">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                  Live Banner Preview
                </span>
                <p className="text-base font-extrabold truncate">
                  {formData.name || 'Your Community Name'}
                </p>
              </div>
            </div>
          </div>

          {/* Preset Banners */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Quick Theme Presets
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

          {/* Custom URL */}
          <div>
            <label htmlFor="customImage" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Or Custom Image URL
            </label>
            <input
              id="customImage"
              type="url"
              value={customImageUrl}
              onChange={handleCustomImageChange}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>
        </div>

        {/* Section 4: Rules & Guidelines & Tags */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Community Guidelines & Tags
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Establish code of conduct rules and searchable campus keywords.
            </p>
          </div>

          <div className="space-y-4">
            {/* Rules */}
            <div>
              <label htmlFor="rules" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Community Rules (One rule per line)
              </label>
              <textarea
                id="rules"
                name="rules"
                rows={4}
                value={formData.rules}
                onChange={handleChange}
                placeholder="1. Rule one...&#10;2. Rule two...&#10;3. Rule three..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition font-mono text-xs leading-relaxed"
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Discovery Tags (Comma-separated)
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="algorithms, hackathons, robotics, python"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            to="/groups"
            className="px-6 py-3 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition flex items-center justify-center min-w-[170px] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" className="border-white" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Create Community
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroupPage;
