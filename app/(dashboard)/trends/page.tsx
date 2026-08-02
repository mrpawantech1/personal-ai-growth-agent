'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  RefreshCw,
  Loader2,
  Zap,
  Hash,
  Globe,
  Twitter,
  Linkedin,
  Reddit
} from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

// Mock trends data
const mockTrends = [
  { id: 1, keyword: 'AI-Powered Automation', source: 'twitter', score: 94, volume: 28400, sentiment: 0.82, direction: 'up' },
  { id: 2, keyword: 'No-Code SaaS Platforms', source: 'reddit', score: 89, volume: 15600, sentiment: 0.75, direction: 'up' },
  { id: 3, keyword: 'Indie Hacking', source: 'producthunt', score: 85, volume: 9300, sentiment: 0.68, direction: 'up' },
  { id: 4, keyword: 'Remote Work Tools', source: 'linkedin', score: 79, volume: 21400, sentiment: 0.61, direction: 'down' },
  { id: 5, keyword: 'AI Content Creation', source: 'twitter', score: 88, volume: 19200, sentiment: 0.78, direction: 'up' },
  { id: 6, keyword: 'SaaS Churn Reduction', source: 'reddit', score: 76, volume: 6700, sentiment: 0.55, direction: 'down' },
  { id: 7, keyword: 'Product Hunt Launch Strategies', source: 'producthunt', score: 82, volume: 8400, sentiment: 0.72, direction: 'up' },
  { id: 8, keyword: 'Growth Hacking', source: 'linkedin', score: 71, volume: 15300, sentiment: 0.58, direction: 'down' },
];

const sourceIcons = {
  twitter: Twitter,
  linkedin: Linkedin,
  reddit: Reddit,
  producthunt: Globe,
};

const sourceColors = {
  twitter: 'bg-blue-500/20 text-blue-400',
  linkedin: 'bg-blue-600/20 text-blue-500',
  reddit: 'bg-orange-500/20 text-orange-400',
  producthunt: 'bg-purple-500/20 text-purple-400',
};

export default function TrendsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredTrends = mockTrends.filter(trend => {
    const matchesSearch = trend.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = filterSource === 'all' || trend.source === filterSource;
    return matchesSearch && matchesSource;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trends</h1>
          <p className="text-muted-foreground">
            Discover opportunities ranked by AI-powered analysis.
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline"
          className="gap-2"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Refresh Trends
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search trends..."
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Sources</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
            <option value="reddit">Reddit</option>
            <option value="producthunt">Product Hunt</option>
          </select>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Trends List */}
      <div className="space-y-3">
        {filteredTrends.map((trend, idx) => {
          const Icon = sourceIcons[trend.source as keyof typeof sourceIcons] || Globe;
          const sourceColor = sourceColors[trend.source as keyof typeof sourceColors] || 'bg-gray-500/20 text-gray-400';

          return (
            <Card 
              key={trend.id} 
              className="glass hover:shadow-lg transition-all animate-fade-in"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {trend.direction === 'up' ? (
                        <TrendingUp className="h-5 w-5 text-green-400" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{trend.keyword}</h3>
                        <span className={cn("badge text-xs", sourceColor)}>
                          <Icon className="mr-1 h-3 w-3" />
                          {trend.source}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {trend.volume.toLocaleString()} mentions
                        </span>
                        <span>Sentiment: {(trend.sentiment * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-white/10 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500"
                          style={{ width: `${trend.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">{trend.score}%</span>
                    </div>
                    <Button size="sm" variant="default" className="h-8 gap-1 text-xs">
                      <Zap className="h-3 w-3" />
                      Act
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredTrends.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No trends found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Summary Card */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">AI Insight</p>
              <p className="text-xs text-muted-foreground">
                "AI-Powered Automation" shows the highest opportunity. Consider creating a Twitter thread on this topic today.
              </p>
            </div>
            <Button size="sm" className="shrink-0">
              Generate Content
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
