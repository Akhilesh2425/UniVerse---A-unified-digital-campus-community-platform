import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationApi } from '../../api/notificationApi';
import Spinner from '../../components/common/Spinner';
import {
  Bell,
  Settings,
  Calendar,
  Users,
  MessageSquare,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Mail,
  Award,
  FileText,
  Clock,
} from 'lucide-react';

const NotificationPreferencesPage = () => {
  const [preferences, setPreferences] = useState({
    eventUpdates: true,
    announcements: true,
    groupActivity: true,
    membershipUpdates: true,
    discussionActivity: true,
    campusIssueUpdates: true,
    essentialAccountNotices: true,
    emailAnnouncements: true,
    emailNewClubs: true,
    emailGroupActivity: true,
    emailClubUpdates: true,
    emailFormReminders: true,
    emailEventUpdates: true,
    emailDiscussionActivity: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        setLoading(true);
        const res = await notificationApi.getPreferences();
        if (res && res.preferences) {
          setPreferences((prev) => ({
            ...prev,
            ...res.preferences,
            essentialAccountNotices: true, 
          }));
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrefs();
  }, []);

  const handleToggle = (key) => {
    if (key === 'essentialAccountNotices') return; 
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');
      const res = await notificationApi.updatePreferences(preferences);
      if (res && res.preferences) {
        setPreferences((prev) => ({
          ...prev,
          ...res.preferences,
          essentialAccountNotices: true,
        }));
        setSuccessMsg('Your notification and email preferences have been saved to MongoDB Atlas.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="md" />
        <p className="mt-2 text-xs text-slate-500 font-medium">Loading notification settings...</p>
      </div>
    );
  }

  const inAppItems = [
    {
      key: 'eventUpdates',
      title: 'Event Updates & Cancellations',
      desc: 'Receive alerts when registered event venues, timings, or dates are modified.',
      icon: <Calendar className="w-5 h-5 text-blue-500" />,
      optional: true,
    },
    {
      key: 'announcements',
      title: 'Campus Circulars & Notices',
      desc: 'Important notices published by university administration and departments.',
      icon: <Bell className="w-5 h-5 text-amber-500" />,
      optional: true,
    },
    {
      key: 'groupActivity',
      title: 'Community Activity & Requests',
      desc: 'Alerts when students request to join private groups you manage.',
      icon: <Users className="w-5 h-5 text-emerald-500" />,
      optional: true,
    },
    {
      key: 'membershipUpdates',
      title: 'Membership & Role Decisions',
      desc: 'Notifications when your group join requests are approved or role is updated.',
      icon: <Users className="w-5 h-5 text-teal-500" />,
      optional: true,
    },
    {
      key: 'discussionActivity',
      title: 'Discussions & Accepted Solutions',
      desc: 'Replies to your questions and alerts when your solution is accepted.',
      icon: <MessageSquare className="w-5 h-5 text-purple-500" />,
      optional: true,
    },
    {
      key: 'campusIssueUpdates',
      title: 'Campus Issue Resolution Progress',
      desc: 'Milestone progress, department assignment, and resolution notices for your reports.',
      icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
      optional: true,
    },
    {
      key: 'essentialAccountNotices',
      title: 'Essential Account & Security Notices',
      desc: 'Critical security alerts, account status modifications, and platform policies.',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-500" />,
      optional: false,
    },
  ];

  const emailItems = [
    {
      key: 'emailAnnouncements',
      title: 'Official College Announcements by Email',
      desc: 'Send administrative campus notices and urgent alerts directly to your registered inbox.',
      icon: <Bell className="w-5 h-5 text-amber-500" />,
    },
    {
      key: 'emailNewClubs',
      title: 'New Official Club Charters & Proposals',
      desc: 'Get notified via email when official student clubs are approved and launched.',
      icon: <Award className="w-5 h-5 text-purple-500" />,
    },
    {
      key: 'emailGroupActivity',
      title: 'Group Study Resources & Timetable',
      desc: 'Email alerts when notes are uploaded or group activities are scheduled.',
      icon: <Users className="w-5 h-5 text-emerald-500" />,
    },
    {
      key: 'emailClubUpdates',
      title: 'Official Club Events & Workshop Notices',
      desc: 'Updates from clubs you are a verified member of.',
      icon: <Calendar className="w-5 h-5 text-blue-500" />,
    },
    {
      key: 'emailFormReminders',
      title: 'Opportunities & Form Wishlist Daily Reminders',
      desc: 'Automated daily countdown reminders before application deadlines close.',
      icon: <Clock className="w-5 h-5 text-rose-500" />,
    },
    {
      key: 'emailEventUpdates',
      title: 'Event RSVP Confirmations & Adjustments',
      desc: 'Immediate email confirmations when event schedules or locations change.',
      icon: <Calendar className="w-5 h-5 text-indigo-500" />,
    },
    {
      key: 'emailDiscussionActivity',
      title: 'Discussion Replies & Mentions',
      desc: 'Email notifications when another student replies to your forum questions.',
      icon: <MessageSquare className="w-5 h-5 text-slate-500" />,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 px-4">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <Link
          to="/notifications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Notification Center
        </Link>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Notification & Email Preferences
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize in-app platform alerts and automated email delivery independently
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            1. In-App Platform Notifications
          </h2>
          <div className="bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80">
            {inAppItems.map((item) => {
              const isChecked = !!preferences[item.key];
              const isLocked = !item.optional;

              return (
                <div key={item.key} className="p-4 sm:p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <Lock className="w-2.5 h-2.5" /> Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleToggle(item.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      isChecked ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
                    } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                    role="switch"
                    aria-checked={isChecked}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isChecked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            2. Campus Email Notifications (Nodemailer Service)
          </h2>
          <div className="bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80">
            {emailItems.map((item) => {
              const isChecked = !!preferences[item.key];

              return (
                <div key={item.key} className="p-4 sm:p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(item.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      isChecked ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={isChecked}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isChecked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
          >
            {saving && <Spinner size="xs" />}
            Save All Preferences
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationPreferencesPage;