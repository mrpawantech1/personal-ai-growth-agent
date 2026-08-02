-- ============================================
-- PERSONAL AI GROWTH AGENT - DATABASE SCHEMA
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'reddit', 'instagram', 'producthunt')),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  performance JSONB DEFAULT '{}'::jsonb,
  campaign_id UUID,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_platform ON public.posts(platform);
CREATE INDEX idx_posts_published_at ON public.posts(published_at);
CREATE INDEX idx_posts_created_by ON public.posts(created_by);

-- ============================================
-- CONTENT DRAFTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.content_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'reddit', 'instagram', 'producthunt')),
  raw_content TEXT NOT NULL,
  variants JSONB DEFAULT '[]'::jsonb,
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP WITH TIME ZONE,
  feedback TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_drafts_approved ON public.content_drafts(approved);
CREATE INDEX idx_drafts_platform ON public.content_drafts(platform);

-- ============================================
-- TRENDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('twitter', 'linkedin', 'reddit', 'producthunt', 'general', 'news')),
  volume INTEGER DEFAULT 0,
  sentiment FLOAT DEFAULT 0,
  opportunity_score FLOAT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trends_keyword ON public.trends(keyword);
CREATE INDEX idx_trends_opportunity_score ON public.trends(opportunity_score DESC);
CREATE INDEX idx_trends_detected_at ON public.trends(detected_at);

-- ============================================
-- SCHEDULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  plan JSONB NOT NULL,
  generated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, generated_by)
);

CREATE INDEX idx_schedules_date ON public.schedules(date);

-- ============================================
-- EVENTS TABLE (Message Bus)
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('ceo:decision', 'plan:create', 'schedule:ready', 'draft:ready', 'trends:updated', 'analytics:aggregated', 'content:published', 'comment:drafted')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_type ON public.events(type);
CREATE INDEX idx_events_created_at ON public.events(created_at);

-- ============================================
-- APPROVAL QUEUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.approval_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'reply', 'campaign')),
  target_id TEXT NOT NULL,
  draft_content TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_approval_status ON public.approval_queue(status);
CREATE INDEX idx_approval_target_type ON public.approval_queue(target_type);

-- ============================================
-- ANALYTICS DAILY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'reddit', 'instagram', 'producthunt')),
  total_posts INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  avg_engagement FLOAT DEFAULT 0,
  best_time TEXT,
  top_performing JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, platform)
);

CREATE INDEX idx_analytics_date ON public.analytics_daily(date);
CREATE INDEX idx_analytics_platform ON public.analytics_daily(platform);

-- ============================================
-- KNOWLEDGE TABLE (with pgvector for embeddings)
-- ============================================
CREATE TABLE IF NOT EXISTS public.knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN ('brand_voice', 'product_features', 'pricing', 'competitors', 'audience_persona', 'faq', 'past_campaigns', 'writing_style')),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, key)
);

CREATE INDEX idx_knowledge_category ON public.knowledge(category);
CREATE INDEX idx_knowledge_key ON public.knowledge(key);
CREATE INDEX idx_knowledge_embedding ON public.knowledge USING ivfflat (embedding vector_cosine_ops);

-- ============================================
-- NOTIFICATIONS TABLE (FIX 1 - Added)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('trend', 'approval', 'plan', 'analytics', 'content', 'system')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action TEXT,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users: Can only read/update their own data
CREATE POLICY users_self ON public.users FOR ALL USING (id = auth.uid());

-- Posts: Users can CRUD their own posts
CREATE POLICY posts_self ON public.posts FOR ALL USING (created_by = auth.uid());

-- Drafts: Users can CRUD their own drafts
CREATE POLICY drafts_self ON public.content_drafts FOR ALL USING (created_by = auth.uid());

-- Trends: Public read-only (any authenticated user)
CREATE POLICY trends_read ON public.trends FOR SELECT USING (auth.role() = 'authenticated');

-- Schedules: Users can CRUD their own schedules
CREATE POLICY schedules_self ON public.schedules FOR ALL USING (generated_by = auth.uid());

-- Events: Public read-only for authenticated users (system uses service role)
CREATE POLICY events_read ON public.events FOR SELECT USING (auth.role() = 'authenticated');

-- Approval Queue: Users can CRUD their own approval items
CREATE POLICY approvals_self ON public.approval_queue FOR ALL USING (reviewed_by = auth.uid() OR target_id LIKE '%');

-- Analytics: Public read-only for authenticated users
CREATE POLICY analytics_read ON public.analytics_daily FOR SELECT USING (auth.role() = 'authenticated');

-- Knowledge: Public read-only for authenticated users
CREATE POLICY knowledge_read ON public.knowledge FOR SELECT USING (auth.role() = 'authenticated');

-- Notifications: Users can CRUD their own notifications
CREATE POLICY notifications_self ON public.notifications FOR ALL USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS: updated_at auto-update
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_updated_at BEFORE UPDATE ON public.knowledge FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (Optional)
-- ============================================

INSERT INTO public.knowledge (category, key, value) VALUES
  ('brand_voice', 'tone', 'Authoritative, data-driven, yet accessible. Speak like a trusted advisor who simplifies complex topics.'),
  ('audience_persona', 'primary', 'SaaS founders, indie hackers, and marketing professionals aged 25-45 who are tech-savvy and growth-oriented.'),
  ('product_features', 'ai_automation', 'AI-powered automation for marketing'),
  ('product_features', 'multi_platform', 'Multi-platform content scheduling'),
  ('product_features', 'analytics', 'Real-time analytics dashboard'),
  ('product_features', 'engagement', 'Automated engagement tracking'),
  ('product_features', 'social_listening', 'Social listening and reply generation')
ON CONFLICT (category, key) DO NOTHING;
