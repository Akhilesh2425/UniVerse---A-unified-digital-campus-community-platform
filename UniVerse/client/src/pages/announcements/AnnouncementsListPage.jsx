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
  ShieldAlert,
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
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  // Detail Modal state
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Campus Announcements
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Official institutional circulars, academic schedules, and administrative alerts
          </p>
        </div>

        {user?.role === 'admin' && (
          <Link
            to="/admin/announcements"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            Create & Manage Notices
          </Link>
        )}
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search circulars by keywords..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchAnnouncements();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition"
          >
            Filter
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                category === cat
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Announcements Feed */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading campus notices...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No announcements found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            No official notices match your filter criteria at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelectedAnnouncement(item)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer group hover:shadow-md ${
                item.priority === 'important'
                  ? 'bg-gradient-to-r from-rose-50/40 via-white to-white border-rose-200 hover:border-rose-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={item.category}>{item.category}</Badge>
                  {item.priority === 'important' && (
                    <Badge variant="important">Urgent Notice</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(item.publishedAt)}</span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {item.title}
              </h2>
              <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                {item.content}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span className="font-medium text-slate-600">
                    {item.author?.name || 'Campus Administration'}
                  </span>
                </div>
                <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  Read full notice <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Notice Modal */}
      {selectedAnnouncement && (
        <Modal
          isOpen={!!selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          title={selectedAnnouncement.title}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
              <Badge variant={selectedAnnouncement.category}>
                {selectedAnnouncement.category}
              </Badge>
              {selectedAnnouncement.priority === 'important' && (
                <Badge variant="important">Important Priority</Badge>
              )}
              <span className="text-xs text-slate-400 ml-auto">
                Published: {formatDate(selectedAnnouncement.publishedAt)}
              </span>
            </div>

            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line py-2">
              {selectedAnnouncement.content}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Issued by: {selectedAnnouncement.author?.name || 'Campus Administration'}</span>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
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
