'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Bell,
  Key,
  User,
  Globe,
  Moon,
  Sun,
  Shield,
  Save,
  Loader2,
  Link2,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    inApp: true,
    weeklyDigest: false,
    approvals: true,
    trends: true,
  });
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [defaultPlatforms, setDefaultPlatforms] = useState(['twitter', 'linkedin']);
  const [autoApprove, setAutoApprove] = useState(80);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePlatform = (platform: string) => {
    setDefaultPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your AI marketing agent to match your workflow.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Changes
        </Button>
      </div>

      {/* Notification Settings */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
              <label className="text-sm capitalize cursor-pointer">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <button
                onClick={() => toggleNotification(key as keyof typeof notifications)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-all duration-200",
                  value ? 'bg-primary' : 'bg-white/20'
                )}
              >
                <span className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all duration-200 shadow-sm",
                  value ? 'right-0.5' : 'left-0.5'
                )} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {(['dark', 'light', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "flex-1 rounded-lg border border-white/10 p-3 text-center transition-all",
                  theme === t ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5' : 'hover:bg-white/5'
                )}
              >
                {t === 'dark' && <Moon className="mx-auto h-6 w-6" />}
                {t === 'light' && <Sun className="mx-auto h-6 w-6" />}
                {t === 'system' && <Settings className="mx-auto h-6 w-6" />}
                <p className="mt-1 text-sm capitalize">{t}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Default Platforms */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Default Platforms
          </CardTitle>
          <CardDescription>Select platforms for content generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['twitter', 'linkedin', 'reddit', 'instagram'].map((platform) => (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-all capitalize",
                  defaultPlatforms.includes(platform)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                )}
              >
                {platform}
                {defaultPlatforms.includes(platform) && (
                  <CheckCircle2 className="ml-1 inline h-3 w-3" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto-approval threshold */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Auto-Approval Threshold
          </CardTitle>
          <CardDescription>Automatically approve content above this opportunity score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={100}
              value={autoApprove}
              onChange={(e) => setAutoApprove(parseInt(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="min-w-12 text-center font-bold">{autoApprove}%</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Content with opportunity score above {autoApprove}% will be auto-approved and published.
          </p>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            API Keys & Integrations
          </CardTitle>
          <CardDescription>Connect your social accounts and AI services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Twitter className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Twitter</p>
                <p className="text-xs text-muted-foreground">Connected as @yourbrand</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              Reconnect
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                <Linkedin className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium">LinkedIn</p>
                <p className="text-xs text-muted-foreground">Connected as Your Name</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              Reconnect
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Reddit className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Reddit</p>
                <p className="text-xs text-muted-foreground">Connected as /u/yourusername</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              Reconnect
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium">OpenRouter (AI)</p>
                <p className="text-xs text-muted-foreground">API Key: ••••••••</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="glass border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Delete All Data</p>
              <p className="text-xs text-muted-foreground">This will permanently remove all your posts, drafts, and analytics.</p>
            </div>
            <Button variant="destructive" size="sm" className="h-8 text-xs">
              Delete Everything
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Import missing icons from lucide-react (we need to add them at top)
import { Twitter, Linkedin, Reddit } from 'lucide-react';
