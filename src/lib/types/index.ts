// User types
export type UserStatus = 'active' | 'suspended' | 'banned' | 'deleted';
export type UserRole = 'user' | 'admin';
export type AuthProvider = 'phone' | 'google' | 'apple';
export type Gender = 'male' | 'female' | 'non_binary' | 'other';
export type InterestedIn = 'men' | 'women' | 'everyone';
export type RelationshipIntention = 'long_term' | 'short_term' | 'friendship' | 'not_sure';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  googleId: string | null;
  appleId: string | null;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string | null;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  dob: string;
  age: number; // calculated
  gender: Gender;
  interestedIn: InterestedIn;
  bio: string | null;
  profession: string | null;
  education: string | null;
  heightCm: number | null;
  city: string;
  relationshipIntention: RelationshipIntention | null;
  isComplete: boolean;
  isDiscoverable: boolean;
  photos: ProfilePhoto[];
  interests: string[];
  languages: string[];
  verificationStatus: VerificationStatus;
}

export interface ProfilePhoto {
  id: string;
  userId: string;
  url: string;
  position: number;
  isPrimary: boolean;
  moderationStatus: ModerationStatus;
}

export interface DiscoveryProfile {
  id: string;
  userId: string;
  name: string;
  age: number;
  gender: Gender;
  bio: string | null;
  profession: string | null;
  city: string;
  relationshipIntention: RelationshipIntention | null;
  isVerified: boolean;
  photos: { url: string; position: number }[];
  interests: string[];
  distance?: number;
}

// Match types
export type MatchStatus = 'active' | 'unmatched';

export interface Match {
  id: string;
  matchedUser: {
    id: string;
    name: string;
    age: number;
    primaryPhoto: string | null;
    isVerified: boolean;
  };
  createdAt: string;
  conversationId: string | null;
}

// Message types
export type MessageType = 'text' | 'view_once_photo';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  messageType: MessageType;
  status: MessageStatus;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  media?: MessageMedia | null;
}

export interface MessageMedia {
  id: string;
  mediaType: string;
  isViewOnce: boolean;
  viewedAt: string | null;
  expiresAt: string | null;
}

export interface Conversation {
  id: string;
  matchId: string;
  otherUser: {
    id: string;
    name: string;
    primaryPhoto: string | null;
    isVerified: boolean;
  };
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}

// Subscription types
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'created' | 'processing' | 'success' | 'failed' | 'cancelled';

export interface Subscription {
  id: string;
  planSlug: string;
  planName: string;
  status: SubscriptionStatus;
  startsAt: string;
  expiresAt: string | null;
}

export interface Payment {
  id: string;
  planName: string;
  amount: number;
  status: PaymentStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
}

// Event types
export type EventCategory = 'house_party' | 'standup' | 'music' | 'sports' | 'dinner' | 'networking' | 'workshop' | 'game_night' | 'meetup' | 'other';
export type EventType = 'public' | 'private';
export type AttendanceMode = 'open' | 'request' | 'approval';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type AttendeeStatus = 'pending' | 'approved' | 'rejected' | 'removed';

export interface Event {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  description: string;
  category: EventCategory;
  coverImageUrl: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  address: string;
  latitude: number;
  longitude: number;
  minAge: number | null;
  maxAge: number | null;
  eventType: EventType;
  capacity: number;
  currentAttendees: number;
  entryFeeInr: number | null;
  attendanceMode: AttendanceMode;
  status: EventStatus;
}

// Report types
export type ReportType = 'profile' | 'photo' | 'chat' | 'event' | 'organizer' | 'attendee';
export type ReportReason = 'fake_profile' | 'ai_image' | 'others_photo' | 'harassment' | 'scam' | 'spam' | 'inappropriate_photo' | 'underage' | 'other';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  reportType: ReportType;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
