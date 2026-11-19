import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import discussionApi from '../../api/discussionApi';
import ImageUploadPicker from '../../components/common/ImageUploadPicker';
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
  },
  {
    id: 'discussion',
    label: 'Discussion',
    desc: 'Start an open campus discussion or share perspectives',
    icon: FileText,
  },
  {
    id: 'resource',
    label: 'Resource',
    desc: 'Share learning roadmaps, articles, tutorials, or cheatsheets',
    icon: BookOpen,
  },
  {
    id: 'project',
    label: 'Project',
    desc: 'Showcase technical work or recruit student collaborators',
    icon: FolderGit2,
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
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <Link
          to="/discussions"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Create Discussion</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Publish questions, resources, or conversations for the campus community
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
                      ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-650 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{pt.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{pt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              2. Title & Category <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
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
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
              />
            </div>

            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
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

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              3. Content / Body <span className="text-rose-500">*</span>
            </label>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setIsPreview(false)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
                  !isPreview
                    ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Write
              </button>
              <button
                type="button"
                onClick={() => setIsPreview(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
                  isPreview
                    ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition font-sans leading-relaxed"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                <span>Minimum 10 characters</span>
                <span>{content.length} characters</span>
              </div>
            </div>
          ) : (
            <div className="min-h-[220px] p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {content.trim() ? content : <span className="text-slate-400 dark:text-slate-500 italic">No content to preview yet.</span>}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            4. Tags & External Resources <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span>
          </label>

          <div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type a tag and press Enter (e.g., algorithms, leetcode, react)..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
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
                className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Add Tag
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-xs font-semibold border border-brand-200/60 dark:border-brand-800"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                External Resource URL
              </label>
              <input
                type="url"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="https://github.com/... or documentation link"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="pt-2">
              <ImageUploadPicker
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
                namePrefix="discussion"
                label="Cover Image / Diagram Attachment (Optional)"
                subLabel="Upload a diagram, screenshot, or photo from your computer, or take an image."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/discussions"
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 transition shadow-md shadow-brand-500/20 disabled:opacity-50"
          >
            {loading ? 'Publishing Discussion...' : 'Publish Discussion'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDiscussionPage;
