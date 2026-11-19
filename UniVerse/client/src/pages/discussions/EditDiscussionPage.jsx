import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import discussionApi from '../../api/discussionApi';
import Spinner from '../../components/common/Spinner';
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
  { id: 'question', label: 'Question', icon: HelpCircle },
  { id: 'discussion', label: 'Discussion', icon: FileText },
  { id: 'resource', label: 'Resource', icon: BookOpen },
  { id: 'project', label: 'Project', icon: FolderGit2 },
];

const EditDiscussionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [type, setType] = useState('question');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [resourceUrl, setResourceUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDiscussion = async () => {
      try {
        const res = await discussionApi.getDiscussionById(id);
        const d = res.discussion;
        setTitle(d.title || '');
        setContent(d.content || '');
        setType(d.type || 'question');
        setCategory(d.category || CATEGORIES[0]);
        setTags(d.tags || []);
        setResourceUrl(d.resourceUrl || '');
        setImageUrl(d.imageUrl || '');
      } catch (err) {
        setError(err.message || 'Failed to load discussion for editing.');
      } finally {
        setFetching(false);
      }
    };
    loadDiscussion();
  }, [id]);

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
      setError('Content must be at least 10 characters long.');
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

    setSaving(true);

    try {
      await discussionApi.updateDiscussion(id, {
        title: title.trim(),
        content: content.trim(),
        type,
        category,
        tags,
        resourceUrl: resourceUrl.trim(),
        imageUrl: imageUrl.trim(),
      });
      navigate(`/discussions/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading discussion details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <Link
          to={`/discussions/${id}`}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Edit Discussion</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Update title, content, tags, or attached resources</p>
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
            Post Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {POST_TYPES.map((pt) => {
              const Icon = pt.icon;
              const isSelected = type === pt.id;
              return (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setType(pt.id)}
                  className={`p-3 rounded-xl border flex items-center gap-2 transition ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-bold'
                      : 'border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{pt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
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

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Discussion Body
          </label>
          <textarea
            rows={9}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Tags & Media
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
                  placeholder="Add a tag..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
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
                placeholder="https://..."
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
            to={`/discussions/${id}`}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 transition shadow-md shadow-brand-500/20 disabled:opacity-50"
          >
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDiscussionPage;
