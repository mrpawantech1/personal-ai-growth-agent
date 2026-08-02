'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/helpers';
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Calendar,
  BarChart3,
  Lightbulb,
  CheckCircle,
  Bell,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/infrastructure/supabase/client';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/content', label: 'Content', icon: FileText },
  { href: '/trends', label: 'Trends', icon: TrendingUp },
  { href: '/planner', label: 'Planner', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/knowledge', label: 'Knowledge', icon: Lightbulb },
  { href: '/approvals', label: 'Approvals', icon: CheckCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <aside className="glass-dark flex h-full w-72 flex-col border-r border-white/5 p-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="rounded-lg bg-primary/20 p-2">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">AI Growth</h1>
          <p className="text-xs text-muted-foreground">Personal Marketing Team</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary shadow-lg shadow-primary/5'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
              {item.label === 'Approvals' && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  3
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="space-y-2 border-t border-white/5 pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:bg-white/5 hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
        <div className="rounded-lg bg-primary/5 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            AI Agent <span className="text-primary">●</span> Active
          </p>
        </div>
      </div>
    </aside>
  );
}
