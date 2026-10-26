import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../../api/eventApi';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  BookmarkCheck,
  Calendar,
  Clock,
  MapPin,
  XCircle,
  ArrowRight,
  AlertCircle,
  Ticket,
} from 'lucide-react';

const MyEventsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation dialog state
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMyRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await eventApi.getMyRegistrations();
      if (res && res.registrations) {
        setRegistrations(res.registrations);
      }
    } catch (err) {
      setError(err.message || 'Failed to load your registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRegistrations();
  }, []);

  const openCancelDialog = (eventId, eventTitle) => {
    setSelectedEventId(eventId);
    setSelectedEventTitle(eventTitle);
  };

  const handleConfirmCancel = async () => {
    if (!selectedEventId) return;

    setActionLoading(true);
    try {
      await eventApi.cancelRegistration(selectedEventId);
      // Remove from list
      setRegistrations((prev) =>
        prev.filter((r) => r.event._id !== selectedEventId)
      );
      setSelectedEventId(null);
    } catch (err) {
      alert(`Error cancelling registration: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
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
            <BookmarkCheck className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Registered Events
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track your verified campus passes, schedules, and active registrations
          </p>
        </div>

        <Link
          to="/events"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition"
        >
          <Calendar className="w-4 h-4" />
          Find More Events
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading your registered passes...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No event registrations yet</h3>
          <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            You haven't signed up for any campus events yet. Explore upcoming hackathons, athletic tournaments, and music fests!
          </p>
          <Link
            to="/events"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-200"
          >
            <span>Browse Campus Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {registrations.map(({ registrationId, registeredAt, event }) => (
            <div
              key={registrationId}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={event.category}>{event.category}</Badge>
                  <span className="text-[11px] font-medium text-slate-400">
                    Signed up: {new Date(registeredAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {event.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span className="font-medium">{formatDate(event.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                <Link
                  to={`/events/${event._id}`}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  View Details & Pass
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => openCancelDialog(event._id, event.title)}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel Registration
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Dialog */}
      <ConfirmDialog
        isOpen={!!selectedEventId}
        onClose={() => setSelectedEventId(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Registration"
        message={`Are you sure you want to cancel your spot for "${selectedEventTitle}"?`}
        confirmText="Cancel Spot"
        danger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default MyEventsPage;
