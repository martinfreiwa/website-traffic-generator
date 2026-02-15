

export interface PriceClass {
  id: string;
  name: string;
  hourlyRate: number; // Maps to CPM Rate
  baseFee: number;    // Maps to Base Campaign Fee
  examFee: number;    // Maps to Setup/Audit Fee
}

export interface MenuItem {
  label: string;
  id: string;
  path?: string; // New: for URL-based navigation
  icon?: any;
  active?: boolean;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export interface GeoTarget {
  id: string;
  country: string;
  percent: number;
  state?: string;
  city?: string;
}

export interface QuickCampaignSettings {
  bounce_rate: number;
  time_on_page: string;
  device_split: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

export interface ProjectSettings {
  trafficSpeed: number;
  bounceRate: number;
  returnRate: number;
  deviceSplit: number; // 0-100, represent Desktop percentage (Legacy)
  tabletSplit?: number; // 0-100. If present, Desktop = deviceSplit, Tablet = tabletSplit, Mobile = Remainder
  browser?: string; // e.g. 'Chrome', 'Firefox', 'Random'
  deviceSpecific: string;
  timeOnPage: string;
  timezone: string;
  language: string;
  languages: string[];
  gaId: string;

  // URL Logic
  urlVisitOrder?: 'sequential' | 'random';

  // UTM Tracking
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;

  entryUrls: string;
  innerUrls: string;
  exitUrls: string;
  autoCrawlEntry: boolean;
  autoCrawlInner: boolean;
  autoCrawlExit: boolean;
  innerUrlCount: number;

  // Updated Location Settings
  geoTargets: GeoTarget[];
  countries: string[];

  // Updated Traffic Source Settings
  trafficSource: string;
  keywords: string;
  referralUrls: string;

  // Proxy Settings
  proxyMode?: 'auto' | 'sticky' | 'custom';
  customProxies?: string;

  // Schedule
  scheduleMode?: 'continuous' | 'burst';
  scheduleTime?: string;
  scheduleDuration?: number;

  sitemap: string;
  shortener: string;
  autoRenew: boolean;
  cacheWebsite: boolean;
  minimizeCpu: boolean;
  randomizeSession: boolean;
  antiFingerprint: boolean;
  pageViewsWithScroll: number;
  clickExternal: number;
  clickInternal: number;

  // Expert Features
  residentialIps?: boolean;
  nightDayVolume?: boolean;
  websiteCrawler?: boolean;
  ga4NaturalEvents?: boolean;
  randomizeDailyVolume?: boolean;
  citiesGeoTargeting?: boolean;

  // Admin Hidden Params
  adminPriority?: number;
  adminWeight?: number;
  forceStopReason?: string;
}

export interface ProjectStats {
  date: string;
  visitors: number;
  pageviews: number;
}

export interface TrafficLog {
  id: string;
  ip: string;
  country: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  os: string;
  timestamp: string;
  path: string;
}

export interface CustomTarget {
  totalVisitors: number;
  durationDays: number;
  dailyLimit: number;
}

export interface Project {
  id: string;
  userId: string; // Added for Admin aggregation
  externalId?: string; // ID from SparkTraffic API
  name: string;
  domain?: string; // New: Extracted from entryUrls for filtering
  plan: string; // "Custom" or legacy plan name
  customTarget?: CustomTarget; // New field for volume/duration
  expires: string;
  status: 'active' | 'stopped' | 'completed';
  settings?: ProjectSettings;
  stats?: ProjectStats[];

  // Admin Fields
  priority?: number;
  forceStopReason?: string;
  isHidden?: boolean;
  internalTags?: string[];
  notes?: string;
  isFlagged?: boolean;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  date: string;
  desc: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  type: 'credit' | 'debit';
  userId?: string;
  tier?: string;
  reference?: string;
}

export interface TicketMessage {
  id: string;
  sender: 'user' | 'admin' | 'guest';
  text: string;
  date: string;
  attachments?: string[]; // Array of filenames/urls
}

export interface Ticket {
  id: string;
  type: 'ticket' | 'chat'; // Differentiate standard tickets from live chat
  userId: string;
  userName: string;
  guestEmail?: string; // For landing page visitors
  guestPhone?: string; // For landing page visitors
  subject: string;
  status: 'open' | 'closed' | 'in-progress';
  priority: 'low' | 'medium' | 'high';
  date: string;
  lastMessage: string;
  messages?: TicketMessage[];
  unread: boolean; // Indicates unread messages for the viewer
}

export interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiry: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  balance: number;
  balanceEconomy?: number;
  balanceProfessional?: number;
  balanceExpert?: number;
  status: 'active' | 'suspended';
  joinedDate: string;
  projectsCount: number;
  apiKey?: string;
  // Extended Profile Fields
  phone?: string;
  telegram?: string;
  company?: string;
  vatId?: string;
  website?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  paymentMethods?: PaymentMethod[];

  // Admin Fields
  tags?: string[];
  notes?: string;
  isVerified?: boolean;
  shadowBanned?: boolean;
  plan?: 'free' | 'pro' | 'agency'; // User-level plan
  lastIp?: string;
  banReason?: string;
  // New Profile & Security Fields
  twoFactorEnabled?: boolean;
  bio?: string;
  jobTitle?: string;
  loginHistory?: { ip: string; device: string; date: string }[];
  socialLinks?: { discord?: string; twitter?: string; linkedin?: string };
  recoveryEmail?: string;
  timezone?: string;
  language?: string;
  themeAccentColor?: string;
  accessibility?: {
    colorBlindMode: boolean;
    compactMode: boolean;
    fontSize: 'small' | 'medium' | 'large';
    reduceMotion: boolean;
  };
  developerMode?: boolean;
  apiWhitelist?: string[];
  webhookSecret?: string;
  soundEffects?: boolean;
  browserNotifications?: boolean;
  newsletterSub?: boolean;
  publicProfile?: boolean;
  skillsBadges?: string[];
  emailFrequency?: 'instant' | 'daily';
  referralCode?: string;
  supportPin?: string;
  dateFormat?: string;
  numberFormat?: string;
  loginNotificationEnabled?: boolean;
  displayName?: string;
  requirePasswordReset?: boolean;
  avatarUrl?: string;
}

export interface LiveVisitor {
  id: string;
  userId?: string; // If logged in
  name: string;
  email: string;
  role: 'user' | 'guest' | 'admin';
  currentPage: string;
  durationMinutes: number;
  device: string;
  browser: string;
  ip: string;
  location: string;
  totalVisits: number;
  status: 'active' | 'idle';
  lastActive: string;
}

export interface ApiConfig {
  id: string;
  name: string;
  key: string;
}

export interface PayloadTemplate {
  id: string;
  name: string;
  json: string;
}

export interface SystemSettings {
  siteName: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  supportEmail: string;
  minDeposit: number;
  sparkTrafficApiKey?: string; // Legacy field, kept for compat
  apiConfigs?: ApiConfig[]; // List of available API keys
  payloadTemplates?: PayloadTemplate[]; // List of saved JSON templates
  pricingPlans?: PriceClass[]; // Configurable Pricing Plans
}

export interface Notification {
  id: string;
  userId: string; // 'admin' or specific user ID
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface SystemAlert {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'promo';
  active: boolean;
  date: string;
  // Enhanced Targeting & Features
  targetType: 'all' | 'paying' | 'active_7d' | 'specific';
  targetUserIds?: string[];
  countdownEnds?: string; // ISO string for countdown expiration
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
}

export interface AdminStats {
  revenue: {
    total: number;
    today: number;
    last_30d: number;
  };
  users: {
    total: number;
    new_today: number;
  };
  projects: {
    total: number;
    active: number;
    new_today: number;
  };
  traffic: {
    total_hits: number;
  };
  system_status: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  expiryDate?: string;
  maxUses?: number;
  maxUsesPerUser?: number; // New: Limit per user
  allowedPlans?: string[]; // New: Restrict to specific plans
  bulkBatchId?: string; // New: Group ID for bulk generation
  duration?: 'once' | 'forever' | 'repeating'; // New: SaaS field
  durationInMonths?: number; // New: For repeating coupons
  usedCount: number;
  active: boolean;
  boundToUser?: string;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerDollar: number;
  redemptionRate: number; // 100 points = $1
  bonusSignupPoints: number;
}

export interface ReferralSettings {
  enabled: boolean;
  referrerReward: number; // Credit amount
  refereeReward: number; // Discount amount or credit
  rewardType: 'credit' | 'cash';
}

export interface MarketingCampaign {
  id: string;
  name: string;
  type: 'email' | 'ad_tracking';
  status: 'active' | 'scheduled' | 'ended' | 'draft';
  sentCount?: number;
  openRate?: number;
  clickRate?: number;
  utmSource?: string;
  clicks?: number;
  conversions?: number;
  revenue?: number;
  dateCreated: string;
}

export interface ConversionSettings {
  socialProof: {
    enabled: boolean;
    position: 'bottom-left' | 'bottom-right';
    delay: number;
    showRealData: boolean;
    customMessages?: string[];
  };
  exitIntent: {
    enabled: boolean;
    headline: string;
    subtext: string;
    couponCode?: string;
    showOncePerSession: boolean;
  };
  promoBar: {
    enabled: boolean;
    message: string;
    buttonText?: string;
    buttonLink?: string;
    backgroundColor: string;
    textColor: string;
    endDate?: string; // New: For countdown timer
  };
}
