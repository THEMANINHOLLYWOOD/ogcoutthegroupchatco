import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, UserPlus, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  getNotifications,
  markNotificationsRead,
  getUnreadCount,
  respondToFriendRequest,
  getFriendshipStatus,
  type NotificationWithUser,
} from '@/lib/friendService';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithUser[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [notifs, count] = await Promise.all([
      getNotifications(user.id),
      getUnreadCount(user.id),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    await fetchData();
    setLoading(false);

    // Mark all as read
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markNotificationsRead(unreadIds);
      setUnreadCount(0);
    }
  };

  const handleAccept = async (notification: NotificationWithUser) => {
    if (!user) return;
    const friendship = await getFriendshipStatus(notification.from_user_id, user.id);
    if (friendship) {
      await respondToFriendRequest(friendship.id, true, notification.from_user_id);
      fetchData();
    }
  };

  const handleDecline = async (notification: NotificationWithUser) => {
    if (!user) return;
    const friendship = await getFriendshipStatus(notification.from_user_id, user.id);
    if (friendship) {
      await respondToFriendRequest(friendship.id, false, notification.from_user_id);
      fetchData();
    }
  };

  const getInitials = (name: string | null, email?: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return (email || '??').slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 relative"
        onClick={handleOpen}
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="absolute right-0 top-12 z-50 w-80 sm:w-96 max-h-[70vh] overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="text-base font-semibold">Notifications</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Notifications list */}
              <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                    />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Bell className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notif, i) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                        className={`px-5 py-4 flex items-start gap-3 ${
                          !notif.read ? 'bg-primary/[0.03]' : ''
                        }`}
                      >
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={notif.from_user?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(notif.from_user?.full_name ?? null, notif.from_user?.email)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug">
                            <span className="font-medium">
                              {notif.from_user?.full_name || 'Someone'}
                            </span>{' '}
                            {notif.type === 'friend_request'
                              ? 'sent you a friend request'
                              : 'accepted your friend request'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                          </p>

                          {notif.type === 'friend_request' && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                className="h-8 rounded-xl text-xs px-4"
                                onClick={() => handleAccept(notif)}
                              >
                                <UserCheck className="w-3.5 h-3.5 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-xl text-xs px-4"
                                onClick={() => handleDecline(notif)}
                              >
                                Decline
                              </Button>
                            </div>
                          )}

                          {notif.type === 'friend_accepted' && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-accent">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>You're now friends</span>
                            </div>
                          )}
                        </div>

                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
