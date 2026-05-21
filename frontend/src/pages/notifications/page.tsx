import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Inbox,
  Trash2,
  CheckCheck,
  Loader2,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService, Notification } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'unread';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  };

  const handleMarkOne = async (id: number) => {
    await notificationService.markAsRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification removed');
    } catch {
      toast.error('Failed to delete notification');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await handleMarkOne(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Bell className="w-6 h-6 text-indigo-500" />
            Notifications
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                filter === 'all'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                filter === 'unread'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              Unread
              {unreadCount > 0 && (
                <span className="w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-semibold">Loading notifications…</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-20 flex flex-col items-center gap-4 text-slate-400">
          <Inbox className="w-12 h-12" />
          <div className="text-center">
            <p className="font-bold text-slate-600">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-xs mt-1">
              {filter === 'unread'
                ? 'Switch to "All" to see your notification history.'
                : 'Activity alerts from leaves, payroll, reviews and more will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-50 shadow-sm">
          {displayed.map(notif => (
            <div
              key={notif.id}
              className={cn(
                'group flex items-start gap-4 px-6 py-4 transition-all',
                !notif.is_read ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
              )}
            >
              {/* Unread dot */}
              <div className={cn(
                'mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0',
                notif.is_read ? 'bg-slate-200' : 'bg-indigo-500 ring-4 ring-indigo-100'
              )} />

              {/* Body — clickable */}
              <button
                className="flex-1 text-left min-w-0"
                onClick={() => handleClick(notif)}
              >
                <p className={cn(
                  'text-sm leading-snug',
                  notif.is_read ? 'font-semibold text-slate-600' : 'font-bold text-slate-800'
                )}>
                  {notif.title}
                  {notif.link && (
                    <ExternalLink className="inline w-3.5 h-3.5 ml-1.5 text-slate-300" />
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                  {notif.message}
                </p>
                <p className="text-[10px] text-slate-300 font-semibold mt-1">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </p>
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkOne(notif.id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notif.id)}
                  title="Delete notification"
                  disabled={deletingId === notif.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                >
                  {deletingId === notif.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
