

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
    bounceRate: number;
    returnRate: number;
    deviceSplit: number;
    tabletSplit?: number;
    browser?: string;
    deviceSpecific: string;
    timeOnPage: string;
    timezone: string;
    language: string;
    languages: string[];
    gaId: string;

    urlVisitOrder?: 'sequential' | 'random';

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

    geoTargets: GeoTarget[];
    countries: string[];

    trafficSource: string;
    keywords: string;
    referralUrls: string;
    socialPlatforms?: string[];

    proxyMode?: 'auto' | 'sticky' | 'custom';
    customProxies?: string;

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

    residentialIps?: boolean;
    nightDayVolume?: boolean;
    websiteCrawler?: boolean;
    ga4NaturalEvents?: boolean;
    randomizeDailyVolume?: boolean;
    citiesGeoTargeting?: boolean;

    adminPriority?: number;
    adminWeight?: number;
    forceStopReason?: string;

    scheduleStart?: string;
    scheduleEnd?: string;
    scheduleTrafficAmount?: number;
    schedulePattern?: 'even' | 'realistic';
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
  userId: string;
  externalId?: string;
  name: string;
  domain?: string;
  plan: string;
  tier?: string;
  customTarget?: CustomTarget;
  startAt?: string;
  expires: string;
  status: 'active' | 'stopped' | 'completed';
  settings?: ProjectSettings;
  stats?: ProjectStats[];
  totalHits?: number;
  hitsToday?: number;

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
  hits?: number;
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
  type: 'ticket' | 'chat';
  userId: string;
  userName: string;
  guestEmail?: string;
  guestPhone?: string;
  subject: string;
  status: 'open' | 'closed' | 'in-progress';
  priority: 'low' | 'medium' | 'high';
  category?: 'general' | 'billing' | 'technical' | 'sales';
  projectId?: string;
  projectName?: string;
  attachmentUrls?: string[];
  date: string;
  lastMessage: string;
  messages?: TicketMessage[];
  unread: boolean;
  updatedAt?: string;
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
  createdAt?: string;
  lastActive?: string;
  // Gamification
  gamificationXp?: number;
  gamificationLevel?: number;
  gamificationTotalSpent?: number;
  gamificationPermanentDiscount?: number;
  streakDays?: number;
  streakBest?: number;
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
  maxUsesPerUser?: number;
  allowedPlans?: string[];
  bulkBatchId?: string;
  duration?: 'once' | 'forever' | 'repeating';
  durationInMonths?: number;
  usedCount: number;
  active: boolean;
  boundToUser?: string;
  minPurchase?: number;
  planRestriction?: string;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerDollar: number;
  redemptionRate: number; // 100 points = $1
  bonusSignupPoints: number;
}

export interface ReferralSettings {
  enabled: boolean;
  referrerReward: number;
  refereeReward: number;
  rewardType: 'credit' | 'cash' | 'percentage';
}

export interface BenefitType {
  id: string;
  type: string;
  category: string;
  name: string;
  value: number;
  requirements: Record<string, any>;
  active: boolean;
  displayOrder: number;
}

export interface BenefitRequest {
  id: string;
  userId: string;
  benefitType: string;
  benefitCategory: string;
  url: string;
  description?: string;
  screenshotUrl?: string;
  claimedValue: number;
  approvedValue?: number;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  fraudFlagged: boolean;
  fraudReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface BenefitBalance {
  benefitBalance: number;
  totalBenefitsClaimed: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

export interface AffiliateTier {
  id: string;
  userId: string;
  tierLevel: number;
  tierName: string;
  commissionRateL1: number;
  commissionRateL2: number;
  commissionRateL3: number;
  totalReferralsL1: number;
  totalReferralsL2: number;
  totalReferralsL3: number;
  totalEarnings: number;
  pendingPayout: number;
  lifetimePayout: number;
  lastTierUpdate: string;
}

export interface AffiliateRelation {
  id: string;
  userId: string;
  referrerL1Id?: string;
  referrerL2Id?: string;
  referrerL3Id?: string;
}

export interface AffiliateDashboard {
  tier: AffiliateTier;
  relations: AffiliateRelation[];
  referralLink: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingPayout: number;
  benefitBalance: number;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  amount: number;
  method: string;
  payoutDetails: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  adminNotes?: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  transactionHash?: string;
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
    endDate?: string;
  };
}

// Admin User Detail Types
export interface ActivityLog {
  id: string;
  userId?: string;
  actionType: string;
  actionDetail: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo: Record<string, any>;
  location?: string;
  createdAt: string;
  lastActivity: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface ImpersonationLog {
  id: string;
  adminId: string;
  targetUserId: string;
  action: string;
  ipAddress?: string;
  createdAt: string;
  adminEmail?: string;
}

export interface BalanceAdjustmentLog {
  id: string;
  userId: string;
  adminId?: string;
  adjustmentType: string;
  tier?: string;
  amount: number;
  hits?: number;
  reason?: string;
  notes?: string;
  createdAt: string;
  adminEmail?: string;
}

export interface EmailLog {
  id: string;
  userId?: string;
  emailType: string;
  toEmail: string;
  subject?: string;
  status: string;
  errorMessage?: string;
  sentAt: string;
  deliveredAt?: string;
}

export interface UserNotificationPrefs {
  id: string;
  userId: string;
  emailMarketing: boolean;
  emailTransactional: boolean;
  emailAlerts: boolean;
  browserNotifications: boolean;
  newsletterSub: boolean;
  emailFrequency: string;
  updatedAt: string;
}

export interface UserReferral {
  id: string;
  email: string;
  name: string;
  status: string;
  createdAt?: string;
  totalSpent: number;
  earningsFromRef: number;
}

export interface AdminUserDetails {
  user: User;
  tierBalances: {
    economy: number;
    professional: number;
    expert: number;
  };
  totalSpent: number;
  totalHitsPurchased: number;
  totalHitsUsed: number;
  transactionsCount: number;
  projectsCount: number;
  ticketsCount: number;
  referralsCount: number;
  referralEarnings: number;
  notificationPrefs?: UserNotificationPrefs;
}
