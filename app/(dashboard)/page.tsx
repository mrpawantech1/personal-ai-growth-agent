'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Loader2,
  Zap,
  Clock
} from 'lucide-react';
import { cn, formatDate, timeAgo } from '@/lib/utils/helpers';

// Mock data — will be replaced with real API calls
const mockStats = {
  totalPosts: 47,
  engagement: 2847,
  growth: 12.4,
  pendingApprovals: 3,
};

const mockRecentActivity = [
  { id: 1, action: 'Post published on Twitter', time: new Date(Date.now() - 1000 * 60 * 30), status: 'success' },
  { id: 2, action: 'Reply drafted for LinkedIn comment', time: new Date(Date.now() - 1000 * 60 * 120), status: 'pending' },
  { id: 3, action: 'Trend detected: "AI in SaaS"', time: new Date(Date.now() - 1000 * 60 * 180), status: 'info' },
  { id: 4, action: 'Weekly plan generated', time: new Date(Date.now() - 1000 * 60 * 240), status: 'success' },
  { id: 5, action: 'CEO made daily decisions', time: new Date(Date.now() - 1000 * 60 * 300), status: 'info' },
];

const mockTrends = [
  { keyword: 'AI Automation', score: 92, direction: 'up' },
  { keyword: 'No-code SaaS', score: 85, direction: 'up' },
  { keyword: 'Indie Hacking', score: 78, direction: 'down' },
  { keyword: 'Product Hunt Launch', score: 74, direction: 'up' },
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);

  // Simulate refresh
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your AI marketing team is live. Here's your growth overview.
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Refresh Insights
            </>
          )}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass hover:shadow-lg transition-all animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Posts
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">+2 this week</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all animate-fade-in [animation-delay:100ms]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Engagement
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.engagement.toLocaleString()}</div>
            <p className="text-xs text-green-400">↑ 12% from last month</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all animate-fade-in [animation-delay:200ms]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Growth Rate
            </CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.growth}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all animate-fade-in [animation-delay:300ms]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.pendingApprovals}</div>
            <Button variant="link" className="h-auto p-0 text-xs text-primary">
              Review now →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Two columns: Recent Activity + Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card className="glass hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>What your AI team has been up to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((item, idx) => (
                <div 
                  key={item.id}
                  className="flex items-start gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0 animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={cn(
                    "mt-1 h-2 w-2 rounded-full shrink-0",
                    item.status === 'success' ? 'bg-green-400' : 
                    item.status === 'pending' ? 'bg-yellow-400' : 'bg-blue-400'
                  )} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(item.time)}</p>
                  </div>
                  {item.status === 'pending' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      Review
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trending Now */}
        <Card className="glass hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle>Trending Now</CardTitle>
            <CardDescription>Opportunities ranked by AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTrends.map((trend, idx) => (
                <div 
                  key={trend.keyword}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-3 transition-all hover:bg-white/10 animate-fade-in"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{trend.keyword}</span>
                    <span className={cn(
                      "text-xs font-medium",
                      trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
                    )}>
                      {trend.direction === 'up' ? (
                        <ArrowUpRight className="inline h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="inline h-3 w-3" />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500"
                        style={{ width: `${trend.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold">{trend.score}%</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground">
              View all trends →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Bar */}
      <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Quick Actions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="h-8">
            Generate Content
          </Button>
          <Button size="sm" variant="outline" className="h-8">
            Check Trends
          </Button>
          <Button size="sm" variant="default" className="h-8">
            Run CEO Decision
          </Button>
        </div>
      </div>
    </div>
  );
            }
