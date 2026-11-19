import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formApi } from '../../api/formApi';
import Spinner from '../../components/common/Spinner';
import {
  Bookmark,
  Calendar,
  Clock,
  ExternalLink,
  Trash2,
  Bell,
  BellOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Mail,
  Send,
} from 'lucide-react';

const FormWishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [triggeringReminders, setTriggeringReminders] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadWishlist = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await formApi.getMyWishlist();
      setWishlist(res.wishlist || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load wishlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleToggleReminder = async (formId) => {
    try {
      setTogglingId(formId);
      const res = await formApi.toggleReminders(formId);
      setWishlist((prev) =>
        prev.map((item) =>
          (item.form?._id || item.form) === formId
            ? { ...item, remindersEnabled: res.wishlistEntry.remindersEnabled }
            : item
        )
      );
      setStatusMsg(
        res.wishlistEntry.remindersEnabled
          ? 'Daily email reminders enabled for this opportunity.'
          : 'Reminders muted for this opportunity.'
      );
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to toggle reminders.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleRemove = async (formId) => {
    try {
      await formApi.removeFromWishlist(formId);
      setWishlist((prev) => prev.filter((item) => (item.form?._id || item.form) !== formId));
      setStatusMsg('Opportunity removed from wishlist.');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to remove from wishlist.');
    }
  };

  const handleTriggerDailyReminders = async () => {
    try {
      setTriggeringReminders(true);
      setStatusMsg('');
      const res = await formApi.triggerReminders();
      setStatusMsg(`Reminder scan complete! Processed ${res.processed} wishlisted forms, delivered ${res.remindersSent} reminder notification(s).`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to trigger reminders.');
    } finally {
      setTriggeringReminders(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
            <Link to="/forms" className="hover:text-brand-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> All Campus Opportunities
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-brand-600" />
            My Opportunities Wishlist
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track pending forms and manage automated daily email alerts before deadlines close.
          </p>
        </div>

        {wishlist.length > 0 && (
          <button
            type="button"
            disabled={triggeringReminders}
            onClick={handleTriggerDailyReminders}
            className="px-4 py-2.5 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 hover:bg-brand-100 font-bold text-xs transition flex items-center gap-2 shadow-xs"
          >
            {triggeringReminders ? (
              <>
                <Spinner size="sm" />
                <span>Checking deadlines...</span>
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 text-brand-600" />
                <span>Test Daily Reminder Scan</span>
              </>
            )}
          </button>
        )}
      </div>

      {statusMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-xs text-slate-500 font-medium">Loading saved opportunities...</p>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
          <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Browse campus opportunities and click the bookmark icon to save forms and receive daily countdown reminders.
          </p>
          <Link
            to="/forms"
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition inline-flex items-center gap-1.5 shadow-sm"
          >
            Explore Opportunities
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {wishlist.map((item) => {
            const form = item.form;
            if (!form) return null;

            const deadline = new Date(form.deadline);
            const now = new Date();
            const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
            const isExpired = diffDays < 0;

            return (
              <div
                key={item._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-brand-700 dark:text-brand-300">
                      {form.category}
                    </span>
                    {isExpired ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Expired
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          diffDays <= 3
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                        }`}
                      >
                        {diffDays} {diffDays === 1 ? 'day' : 'days'} remaining
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {form.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
                    {form.description}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Deadline: {deadline.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={togglingId === form._id}
                    onClick={() => handleToggleReminder(form._id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      item.remindersEnabled
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {item.remindersEnabled ? (
                      <>
                        <Bell className="w-3.5 h-3.5 text-amber-600" />
                        <span>Reminders Active</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3.5 h-3.5" />
                        <span>Reminders Muted</span>
                      </>
                    )}
                  </button>

                  <a
                    href={form.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Open Form</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleRemove(form._id)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FormWishlistPage;
