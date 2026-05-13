export enum UserRole {
  CLIENT = 'client',
  ADMIN = 'admin',
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  onboardingStep: number;
  plaidConnected: boolean;
  achAuthorized: boolean;
  createdAt: number;
  // Join fields
  plan_name?: string;
  sub_status?: 'active' | 'pending' | 'failed' | 'paused' | 'canceled';
  sub_amount?: number;
}

export enum SubscriptionPlan {
  CREDIT_REPAIR = 'Credit Repair',
  BUSINESS_FUNDING = 'Business Funding',
}

export interface Subscription {
  userId: string;
  planId: SubscriptionPlan;
  status: 'active' | 'pending' | 'failed' | 'paused' | 'canceled';
  amount: number;
  nextBillingDate: number;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  date: number;
  type: 'ACH';
}
