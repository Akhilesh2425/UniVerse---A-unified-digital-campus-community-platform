import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { announcementApi } from '../../api/announcementApi';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import {
  Bell,
  Search,
  Calendar,
  User,
  AlertCircle,
  X,
  ChevronRight,
  Plus,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Academic',
  'Events',
  'Administrative',
  'Campus Updates',
  'General',
];

const AnnouncementsListPage = () => {
  const { user, isAdmin } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { category };
      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await announcementApi.getAnnouncements(params);
      if (res && res.announcements) {
        setAnnouncements(res.announcements);
      }
    } catch (err) {
      setError(err.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAnnouncements();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
              Campus Announcements
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official institutional circulars, academic schedules, and administrative alerts
          </p>
        </div>

        {isAdmin && (
          <Link
            to="/admin/announcements"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-brand-600/20 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create & Manage Notices
          </Link>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search circulars by keywords..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchAnnouncements();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition shadow-xs"
          >
            Filter
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
            Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                category === cat
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">Loading campus notices...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto mb-4 flex items-center justify-center">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No announcements found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            No official notices match your filter criteria at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelectedAnnouncement(item)}
              className={`p-6 rounded-3xl border transition-all cursor-pointer group hover:shadow-lg dark:hover:shadow-black/50 ${
                item.priority === 'important'
                  ? 'bg-gradient-to-r from-rose-50/60 via-white to-white dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900 border-rose-200 dark:border-rose-900/70 hover:border-rose-300 dark:hover:border-rose-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={item.category}>{item.category}</Badge>
                  {item.priority === 'important' && (
                    <Badge variant="important">Urgent Notice</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(item.publishedAt)}</span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {item.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                {item.content}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {item.author?.name || 'Campus Administration'}
                  </span>
                </div>
                <span className="text-brand-600 dark:text-brand-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  Read full notice <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAnnouncement && (
        <Modal
          isOpen={!!selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          title={selectedAnnouncement.title}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Badge variant={selectedAnnouncement.category}>
                {selectedAnnouncement.category}
              </Badge>
              {selectedAnnouncement.priority === 'important' && (
                <Badge variant="important">Important Priority</Badge>
              )}
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                Published: {formatDate(selectedAnnouncement.publishedAt)}
              </span>
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line py-2">
              {selectedAnnouncement.content}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Issued by: {selectedAnnouncement.author?.name || 'Campus Administration'}</span>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition"
              >
                Close Notice
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AnnouncementsListPage;
