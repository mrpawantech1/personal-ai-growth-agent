'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  Edit,
  Plus,
  Save,
  X,
  BookOpen,
  Users,
  TrendingUp,
  DollarSign,
  HelpCircle,
  Sparkles,
  Loader2,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

// Mock knowledge data
const mockKnowledge = {
  brand_voice: {
    key: 'tone',
    value: 'Authoritative, data-driven, yet accessible. Speak like a trusted advisor who simplifies complex topics. Use conversational language with occasional humor.'
  },
  audience: {
    key: 'primary',
    value: 'SaaS founders, indie hackers, and marketing professionals aged 25-45 who are tech-savvy and growth-oriented. They value actionable insights and data-backed strategies.'
  },
  product_features: [
    'AI-powered automation for marketing',
    'Multi-platform content scheduling',
    'Real-time analytics dashboard',
    'Automated engagement tracking',
    'Social listening and reply generation'
  ],
  competitors: [
    'Buffer (social scheduling)',
    'Hootsuite (social management)',
    'Jasper (AI content)',
    'Sprout Social (engagement)'
  ],
  faq: [
    { q: 'What platforms are supported?', a: 'Twitter, LinkedIn, Reddit, and Instagram with more coming soon.' },
    { q: 'Is there a free trial?', a: 'Yes, you get 14 days free with full access to all features.' },
    { q: 'Can I customize the AI voice?', a: 'Absolutely! You can set your brand voice in the Knowledge section.' },
  ],
  past_campaigns: [
    { name: 'AI Education Series', date: 'Jan 2026', results: '50k impressions, 3.2k engagement' },
    { name: 'Founder Brand Building', date: 'Feb 2026', results: '28k impressions, 1.8k engagement' },
  ],
};

type Category = 'brand_voice' | 'audience' | 'product_features' | 'competitors' | 'faq' | 'past_campaigns';

const categoryIcons: Record<Category, any> = {
  brand_voice: BookOpen,
  audience: Users,
  product_features: Lightbulb,
  competitors: TrendingUp,
  faq: HelpCircle,
  past_campaigns: Sparkles,
};

const categoryLabels: Record<Category, string> = {
  brand_voice: 'Brand Voice',
  audience: 'Target Audience',
  product_features: 'Product Features',
  competitors: 'Competitors',
  faq: 'FAQs',
  past_campaigns: 'Past Campaigns',
};

export default function KnowledgePage() {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('brand_voice');

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    if (category === 'brand_voice' || category === 'audience') {
      setEditValue(mockKnowledge[category].value);
    } else {
      setEditValue('');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setEditingCategory(null);
    }, 1000);
  };

  const currentData = mockKnowledge[activeCategory];
  const Icon = categoryIcons[activeCategory];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Teach your AI about your brand, audience, and products for consistent messaging.
          </p>
        </div>
        <Button className="gap-2" variant="outline">
          <Plus className="h-4 w-4" />
          Add Knowledge
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Sidebar categories */}
        <div className="space-y-1">
          {Object.keys(categoryIcons).map((cat) => {
            const category = cat as Category;
            const CatIcon = categoryIcons[category];
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left",
                  isActive
                    ? 'bg-primary/10 text-primary shadow-lg shadow-primary/5'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )}
              >
                <CatIcon className="h-4 w-4 shrink-0" />
                {categoryLabels[category]}
                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <div className="md:col-span-3 space-y-4">
          {/* Brand Voice / Audience (single-value) */}
          {(activeCategory === 'brand_voice' || activeCategory === 'audience') && (
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {categoryLabels[activeCategory]}
                    </CardTitle>
                    <CardDescription>
                      {activeCategory === 'brand_voice' 
                        ? 'Define how your AI should communicate' 
                        : 'Who you are speaking to'}
                    </CardDescription>
                  </div>
                  {editingCategory !== activeCategory && (
                    <Button size="sm" variant="outline" onClick={() => handleEdit(activeCategory)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingCategory === activeCategory ? (
                  <div className="space-y-3">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                      placeholder="Enter your brand voice description..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                        Save Changes
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-white/5 p-4">
                    <p className="text-sm leading-relaxed">
                      {activeCategory === 'brand_voice' 
                        ? mockKnowledge.brand_voice.value 
                        : mockKnowledge.audience.value}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Product Features (list) */}
          {activeCategory === 'product_features' && (
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {categoryLabels[activeCategory]}
                    </CardTitle>
                    <CardDescription>Key features of your SaaS product</CardDescription>
                  </div>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Feature
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mockKnowledge.product_features.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                      <span className="text-sm">{feature}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Competitors (list) */}
          {activeCategory === 'competitors' && (
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {categoryLabels[activeCategory]}
                    </CardTitle>
                    <CardDescription>Competitors your AI should be aware of</CardDescription>
                  </div>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Competitor
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mockKnowledge.competitors.map((comp, idx) => (
                    <li key={idx} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                      <span className="text-sm">{comp}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* FAQs (list with Q&A) */}
          {activeCategory === 'faq' && (
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {categoryLabels[activeCategory]}
                    </CardTitle>
                    <CardDescription>Common questions and answers</CardDescription>
                  </div>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />
                    Add FAQ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockKnowledge.faq.map((item, idx) => (
                    <div key={idx} className="rounded-lg bg-white/5 p-3">
                      <p className="text-sm font-medium">Q: {item.q}</p>
                      <p className="text-sm text-muted-foreground mt-1">A: {item.a}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Past Campaigns (list with results) */}
          {activeCategory === 'past_campaigns' && (
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {categoryLabels[activeCategory]}
                    </CardTitle>
                    <CardDescription>Previous campaigns to inform future strategy</CardDescription>
                  </div>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Campaign
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockKnowledge.past_campaigns.map((campaign, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                      <div>
                        <p className="text-sm font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">{campaign.date}</p>
                      </div>
                      <span className="badge badge-success text-xs">{campaign.results}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendation (always shown) */}
          <Card className="glass border-primary/20">
            <CardContent className="p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">AI Knowledge Insight</p>
                <p className="text-xs text-muted-foreground">
                  Your brand voice is well-defined. I recommend adding more specific product use-cases to the features list for better content generation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
                      }
