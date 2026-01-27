

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
  icon?: any;
  active?: boolean;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export interface GeoTarget {
  id: string;
  country: string; // Stored as ISO Code (e.g. 'US', 'DE')
  percent: number;
}

export interface ProjectSettings {
  trafficSpeed: number;
  bounceRate: number;
  returnRate: number;
  deviceSplit: number; // 0-100, represent Desktop percentage
  deviceSpecific: string; // New: 'All', 'Desktop, Windows', 'Mobile, iPhone', etc.
  timeOnPage: string;
  timezone: string;
  language: string; // Deprecated, use languages
  languages: string[]; // New multi-select support
  gaId: string;
  entryUrls: string;
  innerUrls: string;
  exitUrls: string;
  autoCrawlEntry: boolean;
  autoCrawlInner: boolean;
  autoCrawlExit: boolean;
  innerUrlCount: number;
  
  // Updated Location Settings
  geoTargets: GeoTarget[];
  countries: string[]; // Deprecated, kept for backward compat temporarily

  // Updated Traffic Source Settings
  trafficSource: string; // Now supports detailed strings like 'Organic, Google Search'
  keywords: string;
  referralUrls: string; // New field for Social/Referral links

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
  plan: string; // "Custom" or legacy plan name
  customTarget?: CustomTarget; // New field for volume/duration
  expires: string;
  status: 'active' | 'stopped' | 'completed';
  settings?: ProjectSettings;
  stats?: ProjectStats[]; 
}

export interface Transaction {
  id: string;
  date: string;
  desc: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  type: 'credit' | 'debit';
  userId?: string; 
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
