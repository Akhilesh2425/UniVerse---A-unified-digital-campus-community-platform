import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventApi } from '../../api/eventApi';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  CalendarCheck,
} from 'lucide-react';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await eventApi.getEventById(id);
      if (res && res.event) {
        setEvent(res.event);
      }
    } catch (err) {
      setError(err.message || 'Event could not be found or loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    setActionLoading(true);
    setSuccessMessage('');
    setError(null);

    try {
      const res = await eventApi.registerForEvent(id);
      setSuccessMessage('Registration confirmed! You have been added to the attendee list.');
      setEvent((prev) => ({
        ...prev,
        isUserRegistered: true,
        registeredCount: res.registeredCount,
        remainingSpots: res.remainingSpots,
      }));
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    setActionLoading(true);
    setSuccessMessage('');
    setError(null);

    try {
      const res = await eventApi.cancelRegistration(id);
      setShowCancelDialog(false);
      setSuccessMessage('Your registration has been cancelled.');
      setEvent((prev) => ({
        ...prev,
        isUserRegistered: false,
        registeredCount: res.registeredCount,
        remainingSpots:
          prev.maxCapacity !== null
            ? Math.max(0, prev.maxCapacity - res.registeredCount)
            : null,
      }));
    } catch (err) {
      setError(err.message || 'Cancellation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'TBA';
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">Loading event details...</p>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Event Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">{error}</p>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all events
        </Link>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-3 text-rose-800 dark:text-rose-200 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {event.posterUrl ? (
          <div className="w-full h-64 sm:h-80 relative overflow-hidden bg-slate-900">
            <img
              src={event.posterUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div className="space-y-2">
                <Badge variant={event.category} size="md">
                  {event.category}
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                  {event.title}
                </h1>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-brand-950 text-white p-8 sm:p-10">
            <Badge variant={event.category} size="md">
              {event.category}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-3">
              {event.title}
            </h1>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  Starts
                </p>
                <p className="font-bold text-slate-800 dark:text-slate-100">{formatDateTime(event.startDate)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  Campus Venue
                </p>
                <p className="font-bold text-slate-800 dark:text-slate-100">{event.venue}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  Registration Capacity
                </p>
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  {event.maxCapacity
                    ? `${event.registeredCount || 0} / ${event.maxCapacity} seats filled`
                    : 'Unlimited Capacity'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">About This Event</h2>
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Duration & Timeline:</p>
              <p>End: {formatDateTime(event.endDate)}</p>
              {event.registrationDeadline && (
                <p className="mt-1 text-amber-700 dark:text-amber-400 font-medium">
                  Registration Deadline: {formatDateTime(event.registrationDeadline)}
                </p>
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Organized By:</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">{event.createdBy?.name || 'Campus Student Affairs'}</p>
              <p className="text-slate-400">{event.createdBy?.email}</p>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {event.isUserRegistered ? (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    You have an active registration for this event!
                  </p>
                </div>
              ) : event.isFull ? (
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  Event capacity is completely filled. Registration is closed.
                </p>
              ) : !event.isRegistrationOpen ? (
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  Registration for this event is currently closed.
                </p>
              ) : (
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {event.remainingSpots !== null
                    ? `${event.remainingSpots} spot${event.remainingSpots === 1 ? '' : 's'} remaining. Secure your seat now.`
                    : 'Open enrollment for all verified students.'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {event.isUserRegistered ? (
                <button
                  type="button"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Registration
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={actionLoading || !event.isRegistrationOpen}
                  className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <>
                      <Spinner size="sm" className="border-white" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="w-4 h-4" />
                      <span>
                        {isAuthenticated ? 'Register for Event' : 'Sign in to Register'}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelRegistration}
        title="Cancel Event Registration"
        message={`Are you sure you want to cancel your registration for "${event.title}"? Your spot will be released to other students.`}
        confirmText="Yes, Cancel Registration"
        danger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default EventDetailsPage;
