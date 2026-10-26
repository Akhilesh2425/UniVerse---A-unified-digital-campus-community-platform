import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import discussionApi from '../../api/discussionApi';
import {
  HelpCircle,
  FileText,
  BookOpen,
  FolderGit2,
  AlertCircle,
  Tag,
  Link as LinkIcon,
  Image as ImageIcon,
  Eye,
  Edit3,
  X,
  ArrowLeft,
} from 'lucide-react';

const CATEGORIES = [
  'Academics',
  'Programming & DSA',
  'Projects',
  'Placements & Internships',
  'Career Guidance',
  'Campus Life',
  'Technology',
  'Research',
  'Events',
  'General Discussion',
];

const POST_TYPES = [
  {
    id: 'question',
    label: 'Question',
    desc: 'Ask an academic or technical question and get accepted answers',
    icon: HelpCircle,
    color: 'amber',
  },
  {
    id: 'discussion',
    label: 'Discussion',
    desc: 'Start an open campus discussion or share perspectives',
    icon: FileText,
    color: 'indigo',
  },
  {
    id: 'resource',
    label: 'Resource',
    desc: 'Share learning roadmaps, articles, tutorials, or cheatsheets',
    icon: BookOpen,
    color: 'emerald',
  },
  {
    id: 'project',
    label: 'Project',
    desc: 'Showcase technical work or recruit student collaborators',
    icon: FolderGit2,
    color: 'purple',
  },
];

const CreateDiscussionPage = () => {
  const navigate = useNavigate();

  const [type, setType] = useState('question');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [resourceUrl, setResourceUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (trimmed && !tags.includes(trimmed) && tags.length < 8) {
        setTags([...tags, trimmed]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim() || title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }

    if (title.trim().length > 200) {
      setError('Title cannot exceed 200 characters.');
      return;
    }

    if (!content.trim() || content.trim().length < 10) {
      setError('Content is required and must be at least 10 characters long.');
      return;
    }

    if (resourceUrl.trim()) {
      try {
        new URL(resourceUrl.trim());
      } catch {
        setError('Please enter a valid HTTP/HTTPS resource URL.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        type,
        category,
        tags,
        resourceUrl: resourceUrl.trim(),
        imageUrl: imageUrl.trim(),
      };

      const res = await discussionApi.createDiscussion(payload);
      const newPostId = res.discussion?.id || res.discussion?._id;
      navigate(`/discussions/${newPostId}`);
    } catch (err) {
      setError(err.message || 'Failed to publish discussion. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Link
          to="/discussions"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Discussion</h1>
          <p className="text-xs text-slate-500">
            Publish questions, resources, or conversations for the campus community
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Post Type Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. Select Post Type <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {POST_TYPES.map((pt) => {
              const Icon = pt.icon;
              const isSelected = type === pt.id;
              return (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setType(pt.id)}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">{pt.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{pt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Post Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Title & Category <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {title.length}/200 characters
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === 'question'
                    ? "What's your academic or technical question? Be specific..."
                    : 'Enter an engaging title for your discussion...'
                }
                maxLength={200}
                required
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Body & Content Editor */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Content / Body <span className="text-rose-500">*</span>
            </label>

            {/* Editor / Preview Mode Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setIsPreview(false)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
                  !isPreview ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Write
              </button>
              <button
                type="button"
                onClick={() => setIsPreview(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
                  isPreview ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            </div>
          </div>

          {!isPreview ? (
            <div>
              <textarea
                rows={9}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share details, problem context, code snippets, or background information..."
                required
                className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-sans leading-relaxed"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1 px-1">
                <span>Minimum 10 characters</span>
                <span>{content.length} characters</span>
              </div>
            </div>
          ) : (
            <div className="min-h-[220px] p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {content.trim() ? content : <span className="text-slate-400 italic">No content to preview yet.</span>}
            </div>
          )}
        </div>

        {/* Step 4: Tags & Optional Links */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            4. Tags & External Resources <span className="text-slate-400 font-normal">(Optional)</span>
          </label>

          {/* Tags Input */}
          <div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type a tag and press Enter (e.g., algorithms, leetcode, react)..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const trimmed = tagInput.trim().toLowerCase().replace(/^#/, '');
                  if (trimmed && !tags.includes(trimmed) && tags.length < 8) {
                    setTags([...tags, trimmed]);
                    setTagInput('');
                  }
                }}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Add Tag
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200/60"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Resource URL and Image URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                External Resource URL
              </label>
              <input
                type="url"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="https://github.com/... or documentation link"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                Cover / Header Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/discussions"
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? 'Publishing Discussion...' : 'Publish Discussion'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDiscussionPage;
