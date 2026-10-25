export type EventType =
  | 'wedding'
  | 'birthday'
  | 'corporate'
  | 'anniversary'
  | 'hackathon'
  | 'baby_shower'
  | 'festive_gala'
  | 'milestone';

export type VenueType = 'indoor' | 'outdoor' | 'hybrid' | 'beach' | 'rooftop' | 'virtual';

export type BudgetTier = 'budget' | 'balanced' | 'luxury';

export interface BudgetCategory {
  id: string;
  name: string;
  percentage: number;
  allocatedAmount: number;
  spentAmount: number;
  icon: string;
  recommendations: string[];
}

export type TimelinePhase =
  | 'setup'
  | 'arrival'
  | 'ceremony'
  | 'dining'
  | 'entertainment'
  | 'winddown';

export interface TimelineItem {
  id: string;
  time: string;
  phase: TimelinePhase;
  title: string;
  description: string;
  leadCoordinator: string;
  isCompleted: boolean;
}

export type VendorStatus = 'planning' | 'contacted' | 'negotiating' | 'confirmed' | 'completed';

export interface VendorItem {
  id: string;
  category: string;
  companyName: string;
  contactPerson: string;
  emailOrPhone: string;
  estimatedCost: number;
  status: VendorStatus;
  notes: string;
}

export type RSVPStatus = 'confirmed' | 'pending' | 'declined';

export interface Guest {
  id: string;
  name: string;
  email: string;
  dietary: string;
  tableNumber: number | null;
  rsvpStatus: RSVPStatus;
  plusOnes: number;
  notes?: string;
}

export interface ThemePalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  vibeDescription: string;
  lightingStyle: string;
  recommendedDressCode: string;
  curatedMusicPlaylists: string[];
}

export interface InvitationDraft {
  id: string;
  style: 'elegant' | 'playful' | 'formal' | 'poetic';
  headline: string;
  body: string;
  callToAction: string;
}

export interface MenuItem {
  id: string;
  course: 'starters' | 'mains' | 'desserts' | 'beverages';
  name: string;
  description: string;
  dietaryTags: string[];
  recommendedQuantity: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actions?: { label: string; actionId: string }[];
}

export interface EventPlan {
  id: string;
  title: string;
  eventType: EventType;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  venueType: VenueType;
  theme: string;
  dietaryPreferences: string[];
  specialRequests: string;
  budgetBreakdown: BudgetCategory[];
  timeline: TimelineItem[];
  vendors: VendorItem[];
  guests: Guest[];
  themePalette: ThemePalette;
  invitations: InvitationDraft[];
  menu: MenuItem[];
}
