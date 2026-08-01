// ============================================
// SHARED CORE TYPES
// ============================================

export type Platform = 'twitter' | 'linkedin' | 'reddit' | 'instagram' | 'producthunt';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// ============================================
// CONTENT DOMAIN
// ============================================

export interface Post {
  id: string;
  platform: Platform;
  content: string;
  status: PostStatus;
  scheduledFor?: Date;
  publishedAt?: Date;
  performance?: PostPerformance;
  campaignId?: string;
  createdBy: string; // user_id
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentDraft {
  id: string;
  postId?: string;
  platform: Platform;
  rawContent: string;
  variants: string[]; // alternative versions
  approved: boolean;
  approvedAt?: Date;
  feedback?: string;
  createdAt: Date;
}

export interface PostPerformance {
  impressions?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  clicks?: number;
  engagementRate?: number;
  lastUpdated: Date;
}

// ============================================
// TREND DOMAIN
// ============================================

export interface Trend {
  id: string;
  keyword: string;
  source: Platform | 'general' | 'producthunt' | 'news';
  volume: number; // search volume or mentions count
  sentiment: number; // -1 to 1
  opportunityScore: number; // 0 to 100
  detectedAt: Date;
  expiresAt: Date; // cache TTL
  metadata?: Record<string, any>;
}

// ============================================
// PLANNING DOMAIN
// ============================================

export interface DailyPlan {
  date: Date;
  priorities: string[];
  contentTasks: ContentTask[];
  campaigns: Campaign[];
  goals: string[];
}

export interface ContentTask {
  topic: string;
  platform: Platform;
  suggestedTime: string; // HH:mm
  tone: string;
  targetAudience: string;
  status: 'pending' | 'drafting' | 'review' | 'done';
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  goal: string;
  status: 'active' | 'completed' | 'cancelled';
}

// ============================================
// KNOWLEDGE DOMAIN
// ============================================

export type KnowledgeCategory = 
  | 'brand_voice'
  | 'product_features'
  | 'pricing'
  | 'competitors'
  | 'audience_persona'
  | 'faq'
  | 'past_campaigns'
  | 'writing_style';

export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  key: string; // unique identifier
  value: string; // can be text, JSON string, or markdown
  embedding?: number[]; // vector for semantic search
  metadata?: Record<string, any>;
  updatedAt: Date;
}

// ============================================
// ANALYTICS DOMAIN
// ============================================

export interface AnalyticsDaily {
  id: string;
  date: Date;
  platform: Platform;
  totalPosts: number;
  totalEngagement: number;
  avgEngagement: number;
  bestTime: string; // HH:mm
  topPerforming: string[]; // post IDs
  summary: string; // AI-generated insight
}

// ============================================
// AGENT COMMUNICATION (EVENTS)
// ============================================

export type EventType = 
  | 'ceo:decision'
  | 'plan:create'
  | 'schedule:ready'
  | 'draft:ready'
  | 'trends:updated'
  | 'analytics:aggregated'
  | 'content:published'
  | 'comment:drafted';

export interface Event {
  id: string;
  type: EventType;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  retryCount: number;
}

// ============================================
// APPROVAL QUEUE
// ============================================

export interface ApprovalItem {
  id: string;
  targetType: 'post' | 'reply' | 'campaign';
  targetId: string;
  draftContent: string;
  context: Record<string, any>; // thread context, platform, etc.
  status: ApprovalStatus;
  reviewedBy?: string; // user_id
  reviewedAt?: Date;
  createdAt: Date;
}

// ============================================
// USER & SETTINGS
// ============================================

export interface UserSettings {
  brandVoice: string;
  defaultPlatforms: Platform[];
  postingTimePreference: string; // "morning", "afternoon", "evening"
  autoApproveThreshold: number; // opportunity score above this auto-approves
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
  };
}

// ============================================
// DATABASE ROW TYPES (matches Supabase tables)
// ============================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; name: string; avatar_url: string; settings: UserSettings; created_at: string; updated_at: string; };
        Insert: { email: string; name?: string; avatar_url?: string; settings?: UserSettings; };
        Update: { email?: string; name?: string; avatar_url?: string; settings?: UserSettings; };
      };
      posts: {
        Row: Post & { created_at: string; updated_at: string; };
        Insert: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt'>>;
      };
      content_drafts: {
        Row: ContentDraft & { created_at: string; };
        Insert: Omit<ContentDraft, 'id' | 'createdAt'>;
        Update: Partial<Omit<ContentDraft, 'id' | 'createdAt'>>;
      };
      trends: {
        Row: Trend & { created_at: string; };
        Insert: Omit<Trend, 'id' | 'detectedAt' | 'createdAt'>;
        Update: Partial<Omit<Trend, 'id' | 'detectedAt' | 'createdAt'>>;
      };
      schedules: {
        Row: { id: string; date: string; plan: DailyPlan; generated_by: string; approved: boolean; created_at: string; };
        Insert: { date: string; plan: DailyPlan; generated_by: string; approved?: boolean; };
        Update: { plan?: DailyPlan; approved?: boolean; };
      };
      events: {
        Row: Event & { created_at: string; };
        Insert: Omit<Event, 'id' | 'createdAt'>;
        Update: Partial<Omit<Event, 'id' | 'createdAt'>>;
      };
      approval_queue: {
        Row: ApprovalItem & { created_at: string; };
        Insert: Omit<ApprovalItem, 'id' | 'createdAt'>;
        Update: Partial<Omit<ApprovalItem, 'id' | 'createdAt'>>;
      };
      analytics_daily: {
        Row: AnalyticsDaily & { created_at: string; };
        Insert: Omit<AnalyticsDaily, 'id' | 'createdAt'>;
        Update: Partial<Omit<AnalyticsDaily, 'id' | 'createdAt'>>;
      };
      knowledge: {
        Row: KnowledgeEntry & { created_at: string; };
        Insert: Omit<KnowledgeEntry, 'id' | 'updatedAt' | 'created_at'>;
        Update: Partial<Omit<KnowledgeEntry, 'id' | 'updatedAt' | 'created_at'>>;
      };
    };
  };
  }
