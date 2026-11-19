import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationApi } from '../../api/notificationApi';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckCheck,
  Calendar,
  MessageSquare,
  Users,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Settings,
} from 'lucide-react';

const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationApi.getUnreadCount();
      if (res && typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
    }
  };

  const fetchRecent = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await notificationApi.getMyNotifications({ limit: 5 });
      if (res && res.notifications) {
        setRecentNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications preview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); 
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchRecent();
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await notificationApi.markAsRead(notif._id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setIsOpen(false);
      if (notif.actionUrl) {
        navigate(notif.actionUrl);
      }
    } catch (err) {
      if (notif.actionUrl) navigate(notif.actionUrl);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  if (!isAuthenticated) return null;

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
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Campus Notifications"
        title="Notifications"
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-75">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                Loading notifications...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <CheckCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  All caught up!
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  You have no unread campus notifications.
                </p>
              </div>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    !n.isRead
                      ? 'bg-brand-50/40 dark:bg-brand-950/20'
                      : ''
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs font-bold truncate ${!n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 inline-block">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 text-xs">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1 transition"
            >
              See all notifications
              <ExternalLink className="w-3 h-3" />
            </Link>

            <Link
              to="/settings/notifications"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition"
              title="Notification Settings"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
