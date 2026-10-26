import React from 'react';
import {
  Search,
  X,
  Flame,
  Clock,
  ThumbsUp,
  HelpCircle,
  FileText,
  BookOpen,
  FolderGit2,
  Filter,
} from 'lucide-react';

const CATEGORIES = [
  'All',
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
  { id: '', label: 'All Types' },
  { id: 'question', label: 'Questions', icon: HelpCircle },
  { id: 'discussion', label: 'Discussions', icon: FileText },
  { id: 'resource', label: 'Resources', icon: BookOpen },
  { id: 'project', label: 'Projects', icon: FolderGit2 },
];

const SORT_OPTIONS = [
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'newest', label: 'Newest', icon: Clock },
  { id: 'top', label: 'Most Upvoted', icon: ThumbsUp },
  { id: 'unanswered', label: 'Unanswered', icon: HelpCircle },
];

const DiscussionFilters = ({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedType,
  setSelectedType,
  selectedSort,
  setSelectedSort,
  onReset,
}) => {
  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedType !== '' ||
    selectedSort !== 'trending';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Search Bar + Sort Tabs */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discussions by title, question, or #tag..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Pill Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
          {SORT_OPTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = selectedSort === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSort(s.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Post Type filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1 pr-1 hidden sm:inline">
          Type:
        </span>
        {POST_TYPES.map((pt) => {
          const Icon = pt.icon;
          const isSelected = selectedType === pt.id;
          return (
            <button
              key={pt.id}
              type="button"
              onClick={() => setSelectedType(pt.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition ${
                isSelected
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {Icon && <Icon className="w-3 h-3" />}
              <span>{pt.label}</span>
            </button>
          );
        })}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="ml-auto inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1 pr-1 hidden sm:inline">
          Category:
        </span>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition ${
                isSelected
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DiscussionFilters;
