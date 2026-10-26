import React, { useState, useEffect } from 'react';
import { eventApi } from '../../api/eventApi';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Users,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Workshops',
  'Clubs',
  'Competitions',
  'Other',
];

const AdminEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    venue: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    maxCapacity: '',
    posterUrl: '',
  });

  // Attendees Modal State
  const [attendeesModalOpen, setAttendeesModalOpen] = useState(false);
  const [attendeesList, setAttendeesList] = useState([]);
  const [attendeesEventTitle, setAttendeesEventTitle] = useState('');
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  // Delete Confirmation Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await eventApi.getEvents({ timeframe: 'all', sort: 'date-asc' });
      if (res && res.events) {
        setEvents(res.events);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: CATEGORIES[0],
      venue: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      maxCapacity: '',
      posterUrl: '',
    });
    setEditingEventId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (evt) => {
    setEditingEventId(evt._id);

    // Format ISO dates to format suitable for datetime-local: YYYY-MM-DDTHH:mm
    const toInputDate = (d) => {
      if (!d) return '';
      const dateObj = new Date(d);
      const tzOffset = dateObj.getTimezoneOffset() * 60000;
      return new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setFormData({
      title: evt.title,
      description: evt.description,
      category: evt.category,
      venue: evt.venue,
      startDate: toInputDate(evt.startDate),
      endDate: toInputDate(evt.endDate),
      registrationDeadline: toInputDate(evt.registrationDeadline),
      maxCapacity: evt.maxCapacity !== null && evt.maxCapacity !== undefined ? String(evt.maxCapacity) : '',
      posterUrl: evt.posterUrl || '',
    });

    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim() || !formData.venue.trim() || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields (title, description, venue, start date, end date).');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert('End date must be after start date.');
      return;
    }

    setFormLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        venue: formData.venue.trim(),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline) : null,
        maxCapacity: formData.maxCapacity ? Number(formData.maxCapacity) : null,
        posterUrl: formData.posterUrl.trim(),
      };

      if (editingEventId) {
        await eventApi.updateEvent(editingEventId, payload);
        setSuccessMessage('Event updated successfully.');
      } else {
        await eventApi.createEvent(payload);
        setSuccessMessage('Event created successfully.');
      }

      setModalOpen(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Error saving event.');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteDialog = (evt) => {
    setDeletingEvent(evt);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;

    setDeleteLoading(true);
    try {
      await eventApi.deleteEvent(deletingEvent._id);
      setSuccessMessage(`Event "${deletingEvent.title}" and its registered attendee records were deleted.`);
      setDeleteDialogOpen(false);
      setDeletingEvent(null);
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Failed to delete event');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenAttendees = async (evt) => {
    setAttendeesEventTitle(evt.title);
    setAttendeesModalOpen(true);
    setAttendeesLoading(true);

    try {
      const res = await eventApi.getEventAttendees(evt._id);
      setAttendeesList(res.attendees || []);
    } catch (err) {
      alert(err.message || 'Failed to load attendee roster.');
    } finally {
      setAttendeesLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Event Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, update, monitor attendee rosters, and manage capacity for campus events
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Event
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-xs text-emerald-700 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Events List / Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading events catalogue...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No events found</h3>
          <p className="text-xs text-slate-500 mt-1">Start by creating your first campus event.</p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
          >
            Create Event
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Event Title & Category</th>
                  <th className="py-3.5 px-4">Date & Timeline</th>
                  <th className="py-3.5 px-4">Venue</th>
                  <th className="py-3.5 px-4">Attendees / Capacity</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {events.map((evt) => (
                  <tr key={evt._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{evt.title}</div>
                      <div className="mt-1">
                        <Badge variant={evt.category} size="xs">
                          {evt.category}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">
                        {new Date(evt.startDate).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(evt.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[150px] truncate">{evt.venue}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenAttendees(evt)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition"
                        title="Click to view attendee roster"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {evt.registeredCount || 0}
                          {evt.maxCapacity ? ` / ${evt.maxCapacity}` : ' (Open)'}
                        </span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(evt)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Event"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteDialog(evt)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Event"
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

      {/* Create / Edit Modal Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEventId ? 'Edit Campus Event' : 'Create New Campus Event'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleFormChange}
              placeholder="e.g. Annual Autonomous Robotics Challenge"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Venue Location *
              </label>
              <input
                type="text"
                name="venue"
                required
                value={formData.venue}
                onChange={handleFormChange}
                placeholder="e.g. Auditorium Hall 2"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Event Description *
            </label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleFormChange}
              placeholder="Provide event overview, rules, schedule, prizes, and speaker details..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                name="startDate"
                required
                value={formData.startDate}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                name="endDate"
                required
                value={formData.endDate}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Registration Deadline (Optional)
              </label>
              <input
                type="datetime-local"
                name="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Max Capacity (Empty for unlimited)
              </label>
              <input
                type="number"
                name="maxCapacity"
                min="1"
                value={formData.maxCapacity}
                onChange={handleFormChange}
                placeholder="e.g. 100"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Poster Image URL (Optional)
            </label>
            <input
              type="url"
              name="posterUrl"
              value={formData.posterUrl}
              onChange={handleFormChange}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {formLoading ? (
                <>
                  <Spinner size="sm" className="border-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingEventId ? 'Update Event' : 'Publish Event'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Attendees Roster Modal */}
      <Modal
        isOpen={attendeesModalOpen}
        onClose={() => setAttendeesModalOpen(false)}
        title={`Registered Attendees — ${attendeesEventTitle}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {attendeesLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : attendeesList.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No students have registered for this event yet.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-2">Student Name</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Academic Year</th>
                    <th className="pb-2">Registered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendeesList.map((att) => (
                    <tr key={att.registrationId} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold text-slate-900">{att.user?.name || 'Unknown'}</td>
                      <td className="py-2.5 text-slate-600">{att.user?.email || 'N/A'}</td>
                      <td className="py-2.5 text-slate-600">{att.user?.department || 'N/A'}</td>
                      <td className="py-2.5 text-slate-500">{att.user?.academicYear || 'N/A'}</td>
                      <td className="py-2.5 text-slate-400">
                        {new Date(att.registeredAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setAttendeesModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Event Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Campus Event"
        message={`Are you sure you want to permanently delete "${deletingEvent?.title}"? All existing student registrations for this event will be cascade-removed.`}
        confirmText="Delete Event"
        danger={true}
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminEventsPage;
