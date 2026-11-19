import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationApi } from '../../api/notificationApi';
import Spinner from '../../components/common/Spinner';
import {
  Bell,
  CheckCheck,
  Calendar,
  MessageSquare,
  Users,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Trash2,
  Settings,
  Filter,
  ExternalLink,
} from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterRead, setFilterRead] = useState('all'); 
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const isReadParam =
        filterRead === 'unread' ? false : filterRead === 'read' ? true : undefined;

      const res = await notificationApi.getMyNotifications({
        isRead: isReadParam,
        page,
        limit: 15,
      });

      if (res && res.notifications) {
        setNotifications(res.notifications);
        setTotal(res.total);
        setUnreadCount(res.unreadCount);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filterRead]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await notificationApi.markAsRead(notif._id).catch(() => {});
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'event_update':
      case 'event_cancelled':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'announcement_published':
        return <Bell className="w-4 h-4 text-amber-500" />;
      case 'group_join_request':
      case 'group_join_decision':
      case 'group_role_update':
        return <Users className="w-4 h-4 text-emerald-500" />;
      case 'discussion_comment':
      case 'discussion_accepted_answer':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'campus_issue_update':
      case 'campus_issue_resolved':
      case 'campus_issue_reopened':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'account_status':
      case 'account_role':
        return <ShieldCheck className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell className="w-4 h-4 text-brand-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Campus Notifications
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with event schedules, campus notices, group requests, and issue updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 text-brand-700 dark:text-brand-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-brand-200/60 dark:border-brand-800/60"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}

          <Link
            to="/settings/notifications"
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Settings className="w-4 h-4" />
            Preferences
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => {
            setFilterRead('all');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filterRead === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Notifications ({total})
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterRead('unread');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filterRead === 'unread'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-brand-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterRead('read');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filterRead === 'read'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Read
        </button>
      </div>

      <div className="space-y-2.5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Spinner size="md" />
            <p className="mt-2 text-xs text-slate-500 font-medium">Fetching notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-[#0b1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
            <CheckCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No notifications to display
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              When campus events are rescheduled, new circulars are published, or your issues progress, you will receive updates here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                !n.isRead
                  ? 'bg-brand-50/50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900/60 shadow-xs'
                  : 'bg-white dark:bg-[#0b1322] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                {getTypeIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-sm font-bold ${
                        !n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {n.title}
                    </h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {n.message}
                </p>

                {n.actionUrl && (
                  <div className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                    View Resource <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 self-center">
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={(e) => handleMarkAsRead(n._id, e)}
                    title="Mark as Read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => handleDelete(n._id, e)}
                  title="Delete notification"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}

        {totalPages > 1 && (
          <div className="pt-4 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-medium"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
