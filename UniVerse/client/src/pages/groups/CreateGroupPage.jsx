import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { groupApi } from '../../api/groupApi';
import Spinner from '../../components/common/Spinner';
import ImageUploadPicker, { DEFAULT_PRESET_BANNERS } from '../../components/common/ImageUploadPicker';
import {
  Users,
  Globe,
  Lock,
  Image as ImageIcon,
  BookOpen,
  Tag,
  ArrowLeft,
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

const CreateGroupPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    category: 'Technical',
    coverImage: DEFAULT_PRESET_BANNERS[0].url,
    visibility: 'public',
    rules: '1. Be respectful to all campus members.\n2. No spam or promotional flooding.\n3. Keep discussions relevant to the community topic.',
    tags: 'campus, students, collaboration',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
      <div>
        <Link
          to="/groups"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Communities
        </Link>
      </div>

      <div className="bg-white dark:bg-[#172033] border border-slate-200/90 dark:border-[#334155] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Users className="w-3.5 h-3.5" />
            Campus Groups
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create a Student Group
          </h1>
          <p className="text-slate-600 dark:text-[#A8B4C7] text-sm max-w-2xl leading-relaxed">
            Create an academic study circle, project team, or student interest group. You will be designated as the group owner.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error creating group</p>
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
              Give your community a clear name, category, and concise description for the campus registry.
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
                placeholder="e.g. Google Developer Student Club, Algorithmic Knights"
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
                placeholder="A one-sentence summary displayed on community discovery cards..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Full Community Description <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Detailed mission and activities</span>
              </div>
              <textarea
                id="description"
                name="description"
                rows={5}
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your community's goals, regular meetups, projects, membership expectations, and upcoming campus initiatives..."
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
                Any verified student can discover the community and join directly with one click.
                Discussions and members are visible to the entire campus.
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
                Students discover the club but must submit a join request. Group owners and moderators
                review and approve each member before granting access to discussions.
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
            label="Cover Banner & Media"
            subLabel="Upload a banner photo from your computer, capture via camera, or choose a curated theme."
          />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Community Guidelines & Tags
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Establish code of conduct rules and searchable campus keywords.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="rules" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Community Rules (One rule per line)
              </label>
              <textarea
                id="rules"
                name="rules"
                rows={4}
                value={formData.rules}
                onChange={handleChange}
                placeholder="1. Rule one...&#10;2. Rule two...&#10;3. Rule three..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition font-mono text-xs leading-relaxed"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Discovery Tags (Comma-separated)
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="algorithms, hackathons, robotics, python"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            to="/groups"
            className="px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-600/20 transition flex items-center justify-center min-w-[170px] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" className="border-white" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Create Group
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroupPage;
