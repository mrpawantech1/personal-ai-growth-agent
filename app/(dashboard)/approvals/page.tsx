'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  Twitter,
  Linkedin,
  Reddit,
  Eye,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { cn, timeAgo, truncate } from '@/lib/utils/helpers';

// Mock approvals data
const mockApprovals = [
  {
    id: 1,
    type: 'reply',
    platform: 'twitter',
    content: 'Great point! Actually, we found that using AI for content personalization increased our engagement by 3x in just 2 weeks. Would love to hear if you\'ve seen similar results.',
    context: 'Reply to @founder_john on his post about AI marketing',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 12),
    urgency: 'high',
  },
  {
    id: 2,
    type: 'post',
    platform: 'linkedin',
    content: 'Excited to announce our new AI analytics dashboard! After 3 months of development, we\'re finally ready to help you visualize your growth data like never before. Check the link in comments!',
    context: 'LinkedIn Product Announcement',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
    urgency: 'medium',
  },
  {
    id: 3,
    type: 'reply',
    platform: 'reddit',
    content: 'I actually built this exact solution for my SaaS. Here\'s what I learned: start with a simple MVP, focus on getting 10 happy users, then iterate. The tech is less important than solving a real pain.',
    context: 'Reply in r/SaaS thread about "How to build AI agents"',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 120),
    urgency: 'low',
  },
  {
    id: 4,
    type: 'post',
    platform: 'twitter',
    content: 'Thread: 5 SaaS metrics that actually matter. 1/ Churn Rate - if it\'s >5% monthly, fix it NOW. 2/ LTV:CAC ratio...',
    context: 'Twitter Thread (5 tweets)',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 180),
    urgency: 'medium',
  },
];

// History of approved/rejected items
const mockHistory = [
  { id: 5, type: 'post', platform: 'twitter', status: 'approved', content: 'AI is the future of SaaS. Here\'s why...', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3) },
  { id: 6, type: 'reply', platform: 'linkedin', status: 'rejected', content: 'This is a great solution!', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) },
  { id: 7, type: 'post', platform: 'reddit', status: 'approved', content: 'Building in public: Week 2 update...', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8) },
];

const platformIcons = {
  twitter: Twitter,
  linkedin: Linkedin,
  reddit: Reddit,
};

const urgencyColors = {
  high: 'text-red-400 bg-red-500/10',
  medium: 'text-yellow-400 bg-yellow-500/10',
  low: 'text-blue-400 bg-blue-500/10',
};

export default function ApprovalsPage() {
  const [pending, setPending] = useState(mockApprovals);
  const [history] = useState(mockHistory);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleApprove = (id: number) => {
    setIsProcessing(`approve_${id}`);
    setTimeout(() => {
      setPending(prev => prev.filter(item => item.id !== id));
      setIsProcessing(null);
      // In production, call API: await fetch('/api/approvals', { method: 'PUT', body: JSON.stringify({ id, action: 'approve' }) })
    }, 1000);
  };

  const handleReject = (id: number) => {
    setIsProcessing(`reject_${id}`);
    setTimeout(() => {
      setPending(prev => prev.filter(item => item.id !== id));
      setIsProcessing(null);
    }, 800);
  };

  const handleApproveAll = () => {
    setPending([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve content before it goes live.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            className="gap-2"
            disabled={pending.length === 0}
            onClick={handleApproveAll}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve All ({pending.length})
          </Button>
        </div>
      </div>

      {/* Pending Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            Pending Review ({pending.length})
          </h2>
          {pending.length > 0 && (
            <span className="text-xs text-muted-foreground animate-pulse">
              {pending.length} items waiting
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold">All Clear!</h3>
              <p className="text-sm text-muted-foreground">No pending approvals. Your AI team is waiting for new tasks.</p>
            </CardContent>
          </Card>
        ) : (
          pending.map((item, idx) => {
            const Icon = platformIcons[item.platform as keyof typeof platformIcons] || MessageCircle;
            const urgencyClass = urgencyColors[item.urgency as keyof typeof urgencyColors] || urgencyColors.medium;

            return (
              <Card 
                key={item.id} 
                className="glass hover:shadow-lg transition-all animate-fade-in border-l-4 border-l-primary"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-info text-xs capitalize">{item.type}</span>
                            <span className="badge badge-neutral text-xs">{item.platform}</span>
                            <span className={cn("badge text-xs", urgencyClass)}>
                              {item.urgency} priority
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {timeAgo(item.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm leading-relaxed">{item.content}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="opacity-50">Context:</span> {item.context}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 self-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 gap-1 text-xs"
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="h-8 gap-1 text-xs"
                        onClick={() => handleReject(item.id)}
                        disabled={isProcessing === `reject_${item.id}`}
                      >
                        {isProcessing === `reject_${item.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="h-8 gap-1 text-xs bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(item.id)}
                        disabled={isProcessing === `approve_${item.id}`}
                      >
                        {isProcessing === `approve_${item.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* History Section */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Recent History
          </h2>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            View all
          </Button>
        </div>

        <Card className="glass">
          <CardContent className="p-4 divide-y divide-white/5">
            {history.map((item, idx) => (
              <div key={item.id} className={cn("flex items-center justify-between py-3 first:pt-0 last:pb-0", idx > 0 && "pt-3")}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    item.status === 'approved' ? 'bg-green-400' : 'bg-red-400'
                  )} />
                  <div>
                    <p className="text-sm">{truncate(item.content, 60)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{item.type}</span>
                      <span>•</span>
                      <span>{item.platform}</span>
                      <span>•</span>
                      <span>{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <span className={cn(
                  "badge text-xs",
                  item.status === 'approved' ? 'badge-success' : 'badge-danger'
                )}>
                  {item.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Summary Card */}
      <Card className="glass border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">AI Recommendation</p>
            <p className="text-xs text-muted-foreground">
              You have {pending.length} pending items. I recommend approving the high-urgency Twitter reply first — it's time-sensitive.
            </p>
          </div>
          <Button size="sm" variant="default" className="h-8 text-xs">
            Apply AI Suggestion
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
