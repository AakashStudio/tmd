export interface PlanFeatures {
  unlimitedSwipes: boolean;
  whoLikedYou: 'none' | 'limited' | 'unlimited';
  whoLikedYouLimit?: number;
  locationMatching: boolean;
  distanceFilter: boolean;
  citySelection: boolean;
  rewind: boolean;
  eventsAccess: boolean;
  eventCreation: boolean;
  noAds: boolean;
  nameChange: boolean;
  dobCorrectionRequest: boolean;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  displayName: string;
  priceInr: number;
  durationDays: number | null;
  features: PlanFeatures;
  badge?: string;
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    slug: 'free',
    displayName: 'Free',
    priceInr: 0,
    durationDays: null,
    features: {
      unlimitedSwipes: false,
      whoLikedYou: 'none',
      locationMatching: false,
      distanceFilter: false,
      citySelection: false,
      rewind: false,
      eventsAccess: false,
      eventCreation: false,
      noAds: false,
      nameChange: false,
      dobCorrectionRequest: false,
    },
  },
  basic_49: {
    id: 'basic_49',
    name: 'Basic',
    slug: 'basic_49',
    displayName: '₹49 / 15 Days',
    priceInr: 49,
    durationDays: 15,
    features: {
      unlimitedSwipes: true,
      whoLikedYou: 'limited',
      whoLikedYouLimit: 10,
      locationMatching: false,
      distanceFilter: false,
      citySelection: false,
      rewind: false,
      eventsAccess: false,
      eventCreation: false,
      noAds: false,
      nameChange: false,
      dobCorrectionRequest: false,
    },
  },
  plus_149: {
    id: 'plus_149',
    name: 'Plus',
    slug: 'plus_149',
    displayName: '₹149 / 15 Days',
    priceInr: 149,
    durationDays: 15,
    features: {
      unlimitedSwipes: true,
      whoLikedYou: 'unlimited',
      locationMatching: true,
      distanceFilter: true,
      citySelection: true,
      rewind: true,
      eventsAccess: false,
      eventCreation: false,
      noAds: true,
      nameChange: false,
      dobCorrectionRequest: false,
    },
  },
  pro_499: {
    id: 'pro_499',
    name: 'Pro',
    slug: 'pro_499',
    displayName: '₹499 / 10 Days',
    priceInr: 499,
    durationDays: 10,
    badge: 'PRO',
    features: {
      unlimitedSwipes: true,
      whoLikedYou: 'unlimited',
      locationMatching: true,
      distanceFilter: true,
      citySelection: true,
      rewind: true,
      eventsAccess: true,
      eventCreation: true,
      noAds: true,
      nameChange: true,
      dobCorrectionRequest: true,
    },
  },
};

export const FREE_SWIPE_LIMIT = 10;
export const FREE_SWIPE_WINDOW_HOURS = 12;
export const MAX_PHOTOS = 6;
export const MIN_AGE = 18;
export const MAX_AGE = 100;
export const INACTIVE_DAYS_THRESHOLD = 7;
