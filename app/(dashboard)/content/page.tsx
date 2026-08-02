'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Sparkles, 
  Twitter, 
  Linkedin, 
  Reddit, 
  Instagram, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn, formatDate, truncate } from '@/lib/utils/helpers';

// Mock drafts data
const mockDrafts = [
  { 
    id: 1, 
    platform: 'twitter', 
    content: 'AI is not just a buzzword anymore. It\'s the backbone of modern SaaS. Here\'s how we\'re leveraging it to grow 3x faster...',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 15)
  },
  { 
    id: 2, 
    platform: 'linkedin', 
    content: 'The biggest mistake SaaS founders make is ignoring their personal brand. Here\'s why you need to start posting daily...',
    status: 'approved',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
  },
  { 
    id: 3, 
    platform: 'reddit', 
    content: 'I built an AI that manages my entire marketing. Here\'s the stack and what I learned after 30 days...',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
  },
  { 
    id: 4, 
    platform: 'twitter', 
    content: 'Thread: 5 SaaS growth tactics that actually work in 2026. 1/ Stop chasing vanity metrics...',
    status: 'scheduled',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8)
  },
];

const platformIcons = {
  twitter: Twitter,
  linkedin: Linkedin,
  reddit: Reddit,
  instagram: Instagram,
};

const platformColors = {
  twitter: 'text-blue-400',
  linkedin: 'text-blue-600',
  reddit: 'text-orange-400',
  instagram: 'text-pink-400',
};

const statusColors = {
  pending: 'badge-warning',
  approved: 'badge-success',
  scheduled: 'badge-info',
  published: 'badge-neutral',
};

export default function ContentPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');

  const handleGenerate = () => {
    if (!topic) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setTopic('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content</h1>
          <p className="text-muted-foreground">
            Manage drafts, schedule posts, and generate new content.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Generate Content Card */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate New Content
          </CardTitle>
          <CardDescription>
            Let AI create a draft for you. Just pick a topic and platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic (e.g., 'AI in SaaS')"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="reddit">Reddit</option>
              <option value="instagram">Instagram</option>
            </select>
            <Button 
              onClick={handleGenerate} 
              disabled={!topic || isGenerating}
              className="gap-2 shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Draft
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Drafts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Drafts</h2>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            View all
          </Button>
        </div>

        {mockDrafts.map((draft, idx) => {
          const Icon = platformIcons[draft.platform as keyof typeof platformIcons] || Twitter;
          const color = platformColors[draft.platform as keyof typeof platformColors] || 'text-gray-400';
          const statusColor = statusColors[draft.status as keyof typeof statusColors] || 'badge-neutral';

          return (
            <Card 
              key={draft.id} 
              className="glass hover:shadow-lg transition-all animate-fade-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-1", color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{truncate(draft.content, 120)}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className={cn("badge", statusColor)}>
                          {draft.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(draft.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {draft.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          Edit
                        </Button>
                        <Button size="sm" variant="default" className="h-8 text-xs">
                          Review
                        </Button>
                      </>
                    )}
                    {draft.status === 'approved' && (
                      <Button size="sm" variant="default" className="h-8 text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Publish
                      </Button>
                    )}
                    {draft.status === 'scheduled' && (
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                        <Clock className="h-3 w-3" />
                        Reschedule
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
              }
