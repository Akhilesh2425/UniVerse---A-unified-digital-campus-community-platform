import React, { useState, useEffect } from 'react';
import { announcementApi } from '../../api/announcementApi';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

const CATEGORIES = [
  'Academic',
  'Events',
  'Administrative',
  'Campus Updates',
  'General',
];

const AdminAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: CATEGORIES[0],
    priority: 'normal',
    isPublished: true,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await announcementApi.getAnnouncements({ includeDrafts: 'true' });
      if (res && res.announcements) {
        setAnnouncements(res.announcements);
      }
    } catch (err) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: CATEGORIES[0],
      priority: 'normal',
      isPublished: true,
    });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      priority: item.priority || 'normal',
      isPublished: Boolean(item.isPublished),
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in title and content.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        priority: formData.priority,
        isPublished: formData.isPublished,
      };

      if (editingId) {
        await announcementApi.updateAnnouncement(editingId, payload);
        setSuccessMessage('Announcement updated successfully.');
      } else {
        await announcementApi.createAnnouncement(payload);
        setSuccessMessage('Announcement created successfully.');
      }

      setModalOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (err) {
      alert(err.message || 'Error saving announcement');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTogglePublish = async (item) => {
    try {
      const updatedStatus = !item.isPublished;
      await announcementApi.updateAnnouncement(item._id, { isPublished: updatedStatus });
      setSuccessMessage(
        updatedStatus
          ? `Published "${item.title}" to student feed.`
          : `Unpublished "${item.title}" (moved to draft).`
      );
      fetchAnnouncements();
    } catch (err) {
      alert(err.message || 'Error updating publish status');
    }
  };

  const openDeleteDialog = (item) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    setDeleteLoading(true);
    try {
      await announcementApi.deleteAnnouncement(deletingItem._id);
      setSuccessMessage(`Notice "${deletingItem.title}" has been deleted.`);
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchAnnouncements();
    } catch (err) {
      alert(err.message || 'Failed to delete announcement');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Campus Notices & Announcements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Publish institutional notices, manage drafts, and configure priority alerts
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Announcement
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-xs text-emerald-700 dark:text-emerald-300 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">Loading notices...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-md mx-auto">
          <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No notices found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create an announcement to communicate with students.</p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
          >
            Create Notice
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Title & Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {announcements.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm max-w-md truncate">
                        {item.title}
                      </div>
                      <div className="mt-1">
                        <Badge variant={item.category} size="xs">
                          {item.category}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.priority === 'important' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 text-xs">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                          Important
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 text-xs">Normal</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                          item.isPublished
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800'
                        }`}
                        title="Click to toggle publish status"
                      >
                        {item.isPublished ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {item.publishedAt
                        ? new Date(item.publishedAt).toLocaleDateString()
                        : 'Unpublished'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition"
                          title="Edit Announcement"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteDialog(item)}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Announcement' : 'Create Campus Announcement'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleFormChange}
              placeholder="e.g. End Semester Examination Schedule Published"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="important">Important (Pinned alert)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Content *
            </label>
            <textarea
              name="content"
              required
              rows={6}
              value={formData.content}
              onChange={handleFormChange}
              placeholder="Write the detailed circular, instructions, deadlines, or contact info..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleFormChange}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 dark:border-slate-600 focus:ring-brand-500"
            />
            <label htmlFor="isPublished" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              Publish immediately (visible to all students)
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {formLoading ? (
                <>
                  <Spinner size="sm" className="border-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingId ? 'Update Notice' : 'Publish Notice'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Announcement"
        message={`Are you sure you want to permanently delete "${deletingItem?.title}"?`}
        confirmText="Delete Notice"
        danger={true}
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminAnnouncementsPage;
