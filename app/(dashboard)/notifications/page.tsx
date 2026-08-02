'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bell,
  CheckCheck,
  X,
  Sparkles,
  TrendingUp,
  Calendar,
  MessageCircle,
  FileText,
  User,
  Clock,
  Loader2,
  Settings
} from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils/helpers';

// Mock notifications
const mockNotifications = [
  {
    id: 1,
    type: 'trend',
    title: 'New Trend Detected: AI Automation',
    description: 'AI Automation is trending with 28.4K mentions. Opportunity score: 94%.',
    time: new Date(Date.now() - 1000 * 60 * 10),
    read: false,
    action: 'View Trend',
  },
  {
    id: 2,
    type: 'approval',
    title: 'Reply Draft Ready for Approval',
    description: 'AI has drafted a reply to @founder_john on Twitter. Review before publishing.',
    time: new Date(Date.now() - 1000 * 60 * 45),
    read: false,
    action: 'Review Now',
  },
  {
    id: 3,
    type: 'plan',
    title: 'Daily Plan Generated',
    description: 'CEO Agent has created today\'s content plan. 4 tasks ready for execution.',
    time: new Date(Date.now() - 1000 * 60 * 120),
    read: true,
    action: 'View Plan',
  },
  {
    id: 4,
    type: 'analytics',
    title: 'Weekly Analytics Report',
    description: 'Your engagement is up 12% this week. Best time: 9:00 AM on Twitter.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: true,
    action: 'View Report',
  },
  {
    id: 5,
    type: 'content',
    title: 'Content Published Successfully',
    description: 'Your Twitter thread on "AI in SaaS" was published and is getting traction.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 8),
    read: true,
    action: 'View Post',
  },
  {
    id: 6,
    type: 'system',
    title: 'System Update Completed',
    description: 'AI Knowledge Base was updated with new product features. All agents reconfigured.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    action: 'View Changes',
  },
];

const notificationIcons = {
  trend: TrendingUp,
  approval: MessageCircle,
  plan: Calendar,
  analytics: Sparkles,
  content: FileText,
  system: Settings,
};

const notificationColors = {
  trend: 'bg-blue-500/20 text-blue-400',
  approval: 'bg-yellow-500/20 text-yellow-400',
  plan: 'bg-purple-500/20 text-purple-400',
  analytics: 'bg-green-500/20 text-green-400',
  content: 'bg-indigo-500/20 text-indigo-400',
  system: 'bg-gray-500/20 text-gray-400',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated on what your AI team is doing.
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-1">
              <CheckCheck className="h-4 w-4" />
              Mark All Read ({unreadCount})
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-red-400">
            <X className="h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{notifications.length}</p>
            </div>
            <Bell className="h-8 w-8 text-muted-foreground opacity-20" />
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unread</p>
              <p className="text-2xl font-bold text-yellow-400">{unreadCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400/20" />
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Read</p>
              <p className="text-2xl font-bold text-green-400">{notifications.length - unreadCount}</p>
            </div>
            <CheckCheck className="h-8 w-8 text-green-400/20" />
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="glass">
        <CardContent className="p-0 divide-y divide-white/5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No notifications yet.</p>
              <p className="text-xs text-muted-foreground">Your AI team will notify you when something happens.</p>
            </div>
          ) : (
            notifications.map((notification, idx) => {
              const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || Bell;
              const color = notificationColors[notification.type as keyof typeof notificationColors] || 'bg-gray-500/20 text-gray-400';

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 p-4 transition-all hover:bg-white/5 cursor-pointer",
                    !notification.read ? 'bg-primary/5 border-l-4 border-l-primary' : '',
                    "animate-fade-in"
                  )}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className={cn("rounded-full p-2 shrink-0", color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {timeAgo(notification.time)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {notification.description}
                    </p>
                    {notification.action && (
                      <Button size="sm" variant="ghost" className="mt-2 h-7 px-3 text-xs text-primary hover:bg-primary/10">
                        {notification.action}
                      </Button>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
