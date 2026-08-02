'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  ThumbsUp,
  Share2,
  MessageCircle,
  Eye,
  ChevronRight,
  CalendarDays,
  Sparkles,
  Loader2
} from 'lucide-react';
import { cn, formatDateShort, truncate } from '@/lib/utils/helpers';

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalImpressions: 45280,
    totalEngagement: 2847,
    avgEngagementRate: 6.3,
    totalPosts: 47,
    totalShares: 384,
    totalLikes: 1532,
    totalComments: 931,
  },
  bestTimes: [
    { time: '9:00 AM', engagement: 94, posts: 8 },
    { time: '12:00 PM', engagement: 87, posts: 6 },
    { time: '4:00 PM', engagement: 82, posts: 5 },
    { time: '7:00 PM', engagement: 76, posts: 4 },
    { time: '11:00 AM', engagement: 71, posts: 3 },
  ],
  topPosts: [
    { id: 1, platform: 'twitter', content: 'AI is not just a buzzword anymore. It\'s the backbone of modern SaaS...', engagement: 342, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
    { id: 2, platform: 'linkedin', content: 'The biggest mistake SaaS founders make is ignoring their personal brand...', engagement: 287, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) },
    { id: 3, platform: 'reddit', content: 'I built an AI that manages my entire marketing. Here\'s the stack...', engagement: 195, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
    { id: 4, platform: 'twitter', content: 'Thread: 5 SaaS growth tactics that actually work in 2026...', engagement: 178, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) },
  ],
  weeklyTrend: [
    { day: 'Mon', posts: 5, engagement: 320 },
    { day: 'Tue', posts: 7, engagement: 410 },
    { day: 'Wed', posts: 6, engagement: 380 },
    { day: 'Thu', posts: 8, engagement: 520 },
    { day: 'Fri', posts: 5, engagement: 290 },
    { day: 'Sat', posts: 3, engagement: 180 },
    { day: 'Sun', posts: 2, engagement: 120 },
  ],
  aiInsight: 'Your best performing content is educational threads on Twitter (avg. 450 engagement). LinkedIn articles perform best when posted on Thursdays at 11 AM. Consider increasing Twitter thread frequency to 3x per week for maximum growth.'
};

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('week');

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const maxEngagement = Math.max(...mockAnalytics.weeklyTrend.map(d => d.engagement));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track performance, discover insights, and optimize your strategy.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
          </select>
          <Button 
            onClick={handleRefresh} 
            disabled={isLoading}
            variant="outline"
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass hover:shadow-lg transition-all animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.overview.totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-green-400">↑ 12% from last week</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all animate-fade-in [animation-delay:100ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.overview.avgEngagementRate}%</div>
            <p className="text-xs text-green-400">↑ 2.1% from last week</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all animate-fade-in [animation-delay:200ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.overview.totalEngagement.toLocaleString()}</div>
            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
              <span><ThumbsUp className="inline h-3 w-3" /> {mockAnalytics.overview.totalLikes}</span>
              <span><MessageCircle className="inline h-3 w-3" /> {mockAnalytics.overview.totalComments}</span>
              <span><Share2 className="inline h-3 w-3" /> {mockAnalytics.overview.totalShares}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all animate-fade-in [animation-delay:300ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.overview.totalPosts}</div>
            <p className="text-xs text-muted-foreground">3.9 posts/day average</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend Chart (bar chart using divs) */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Weekly Performance Trend</CardTitle>
          <CardDescription>Posts vs Engagement over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-48">
            {mockAnalytics.weeklyTrend.map((day, idx) => {
              const height = day.engagement > 0 ? (day.engagement / maxEngagement) * 100 : 5;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center gap-1">
                    <div className="text-xs text-muted-foreground">{day.engagement}</div>
                    <div 
                      className="w-full rounded-t-md bg-gradient-to-t from-primary to-purple-500 transition-all duration-500 hover:opacity-80"
                      style={{ height: `${height}%`, minHeight: '8px' }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-medium">{day.day}</div>
                    <div className="text-[10px] text-muted-foreground">{day.posts} posts</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Two columns: Best Times + AI Insight */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Best Times */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Best Posting Times
            </CardTitle>
            <CardDescription>When your audience is most active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAnalytics.bestTimes.map((time, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-20 text-sm font-medium">{time.time}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all"
                      style={{ width: `${time.engagement}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {time.engagement}%
                  </span>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground">
              View full schedule <ChevronRight className="inline h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        {/* AI Insight */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Insight
            </CardTitle>
            <CardDescription>Actionable recommendations from your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
              <p className="text-sm leading-relaxed">{mockAnalytics.aiInsight}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs">
                Apply to Planner
              </Button>
              <Button size="sm" variant="default" className="h-8 text-xs">
                Generate Content
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Posts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Top Performing Posts</h2>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            View all →
          </Button>
        </div>

        {mockAnalytics.topPosts.map((post, idx) => (
          <Card 
            key={post.id} 
            className="glass hover:shadow-lg transition-all animate-fade-in"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm">{truncate(post.content, 100)}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="badge badge-success">#{idx + 1}</span>
                    <span>{formatDateShort(post.date)}</span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" /> {post.engagement}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs shrink-0">
                  Analyze
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
