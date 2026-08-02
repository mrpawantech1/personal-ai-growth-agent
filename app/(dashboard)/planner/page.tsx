'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Target,
  Clock,
  CheckCircle2,
  Circle,
  Rocket,
  Sparkles,
  Loader2,
  Link2
} from 'lucide-react';
import { cn, formatDateShort, timeAgo } from '@/lib/utils/helpers';

// Mock planner data
const mockPlans = {
  today: {
    date: new Date(),
    priorities: [
      'Publish Twitter thread on AI automation',
      'Engage with 5 industry conversations',
      'Draft LinkedIn article for Thursday',
    ],
    contentTasks: [
      { id: 1, topic: 'AI in SaaS - Why it matters', platform: 'twitter', time: '9:00 AM', status: 'done', tone: 'casual' },
      { id: 2, topic: '5 lessons from 100 SaaS founders', platform: 'linkedin', time: '11:00 AM', status: 'in-progress', tone: 'professional' },
      { id: 3, topic: 'Building in public - Week 3 update', platform: 'reddit', time: '2:00 PM', status: 'pending', tone: 'educational' },
      { id: 4, topic: 'Product update: AI analytics dashboard', platform: 'twitter', time: '5:00 PM', status: 'pending', tone: 'casual' },
    ],
    campaigns: [
      { name: 'AI Education Series', progress: 65, goal: 'Publish 10 educational posts' },
      { name: 'Founder Brand Building', progress: 30, goal: '3 LinkedIn articles' },
    ],
    goals: [
      'Reach 5000 impressions today',
      'Generate 200+ engagement',
      'Start 2 new conversations',
    ]
  },
  weeklyGoals: [
    'Increase Twitter followers by 50',
    'Publish 5 long-form articles',
    'Achieve 6% engagement rate',
  ]
};

const platformColors = {
  twitter: 'bg-blue-500/20 text-blue-400',
  linkedin: 'bg-blue-600/20 text-blue-500',
  reddit: 'bg-orange-500/20 text-orange-400',
  instagram: 'bg-pink-500/20 text-pink-400',
};

export default function PlannerPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  const tasks = mockPlans.today.contentTasks;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const totalCount = tasks.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planner</h1>
          <p className="text-muted-foreground">
            Your AI-generated schedule to achieve growth goals.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                  view === v 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-transparent text-muted-foreground hover:bg-white/5'
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <Button 
            onClick={handleGeneratePlan} 
            disabled={isGenerating}
            className="gap-2"
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : 'AI Replan'}
          </Button>
        </div>
      </div>

      {/* Today Progress */}
      <Card className="glass">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Today's Plan</CardTitle>
              <CardDescription>{formatDateShort(new Date())}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{doneCount}/{totalCount} done</span>
              <div className="h-2 w-24 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all"
                  style={{ width: `${(doneCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Priorities */}
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Priorities</p>
            <div className="flex flex-wrap gap-2">
              {mockPlans.today.priorities.map((p, idx) => (
                <span key={idx} className="badge badge-info text-xs">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-2">
            {tasks.map((task) => {
              const statusIcon = task.status === 'done' 
                ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                : task.status === 'in-progress'
                  ? <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
                  : <Circle className="h-4 w-4 text-muted-foreground" />;
              
              return (
                <div 
                  key={task.id} 
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-3 transition-all",
                    task.status === 'done' ? 'bg-white/5 opacity-60' : 'bg-white/5 hover:bg-white/10'
                  )}
                >
                  {statusIcon}
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm",
                      task.status === 'done' && "line-through text-muted-foreground"
                    )}>
                      {task.topic}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn("badge", platformColors[task.platform as keyof typeof platformColors])}>
                        {task.platform}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.time}
                      </span>
                      <span>Tone: {task.tone}</span>
                    </div>
                  </div>
                  {task.status === 'pending' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      Start
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Two columns: Campaigns + Goals */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Campaigns */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Active Campaigns
            </CardTitle>
            <CardDescription>Track campaign progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPlans.today.campaigns.map((campaign, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{campaign.name}</span>
                    <span className="text-xs text-muted-foreground">{campaign.progress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all"
                      style={{ width: `${campaign.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{campaign.goal}</p>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground">
              <Plus className="h-3 w-3 mr-1" />
              Start new campaign
            </Button>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Weekly Goals
            </CardTitle>
            <CardDescription>Track what matters this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockPlans.weeklyGoals.map((goal, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-lg bg-white/5 p-3">
                  <span className="mt-0.5 text-xs font-bold text-primary">#{idx + 1}</span>
                  <p className="text-sm">{goal}</p>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground">
              <Plus className="h-3 w-3 mr-1" />
              Add custom goal
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Schedule Preview */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Weekly Schedule Preview</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
              <div key={day} className={cn(
                "rounded-lg p-2",
                idx < 5 ? "bg-white/5" : "opacity-50"
              )}>
                <p className="text-xs font-medium">{day}</p>
                <p className="text-lg font-bold">{idx + 1}</p>
                <div className="mt-1 flex justify-center gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">3 posts</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
                }
