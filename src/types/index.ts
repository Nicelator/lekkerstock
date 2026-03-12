// src/types/index.ts

export type UserRole = "buyer" | "contributor" | "admin";

export type SubscriptionPlan =
  | "free"
  | "buyer_pro"
  | "buyer_studio"
  | "contributor_pro";

export type AssetType = "photo" | "video" | "illustration" | "3d";

export type AssetStatus = "pending" | "approved" | "rejected";

export type LicenseType = "standard" | "extended" | "editorial";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  plan: SubscriptionPlan;
  country: string | null;
  website: string | null;
  paystack_customer_id: string | null;
  paystack_subscription_code: string | null;
  total_earnings: number;
  available_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  contributor_id: string;
  title: string;
  description: string | null;
  tags: string[];
  type: AssetType;
  status: AssetStatus;
  file_url: string;
  preview_url: string;
  thumbnail_url: string;
  file_size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  downloads: number;
  views: number;
  price_usd: number;
  price_ngn: number;
  is_editorial: boolean;
  created_at: string;
  updated_at: string;
  contributor?: Profile;
}

export interface License {
  id: string;
  asset_id: string;
  buyer_id: string;
  license_type: LicenseType;
  price_paid: number;
  currency: "NGN" | "USD";
  transaction_ref: string;
  created_at: string;
  asset?: Asset;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  paystack_subscription_code: string;
  paystack_email_token: string;
  status: "active" | "cancelled" | "expired";
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  contributor_id: string;
  amount: number;
  currency: "NGN" | "USD";
  bank_name: string;
  account_number: string;
  account_name: string;
  status: "pending" | "processing" | "completed" | "failed";
  paystack_transfer_code: string | null;
  created_at: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price_usd: number;
  price_ngn: number;
  paystack_plan_code_usd: string;
  paystack_plan_code_ngn: string;
  features: string[];
  unavailable: string[];
  highlighted: boolean;
  type: "buyer" | "contributor";
  plan_key: SubscriptionPlan;
}

export interface SearchFilters {
  query: string;
  type: AssetType | "all";
  sort: "latest" | "popular" | "downloads";
  page: number;
  limit: number;
}
