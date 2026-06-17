export type Profile = {
  id: string;
  username: string | null;
  role: "user" | "creator" | "admin";
  is_banned: boolean;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  twitter: string | null;
  created_at: string;
  updated_at: string;
};

export type AppRecord = {
  id: string;
  creator_id: string;
  name: string;
  slogan: string | null;
  description: string | null;
  category: string;
  tech_stack: string[];
  license: string | null;
  screenshots: string[];
  demo_url: string | null;
  prompt_text: string | null;
  remix_allowed: boolean | null;
  remix_license: string | null;
  contact_info: {
    name?: string;
    email?: string;
    phone?: string;
    organization?: string;
    publisher_type?: "personal" | "company";
    age_range?: string;
    gender?: string;
    preferred_contact?: string;
    note?: string;
  } | null;
  status: "pending_review" | "published" | "rejected" | "flagged";
  created_at: string;
  updated_at: string;
};

export type AppClaim = {
  id: string;
  app_id: string;
  user_id: string;
  status: "claimed";
  created_at: string;
  last_opened_at: string | null;
  app?: AppWithStats | null;
};

export type NotificationRecord = {
  id: string;
  user_id: string;
  type: "creator_application" | "app_review" | "report" | "account" | "system";
  title: string;
  body: string | null;
  cta_href: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export type CreatorApplication = {
  id: string;
  user_id: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
};

export type Report = {
  id: string;
  app_id: string;
  reporter_id: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  apps?: Pick<AppRecord, "id" | "name" | "status"> | null;
  profiles?: Profile | null;
};

export type Review = {
  id: string;
  app_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: Profile | null;
};

export type AppWithStats = AppRecord & {
  profiles?: Profile | null;
  reviews?: { rating: number }[];
  avgRating: number;
  reviewCount: number;
  remixCount: number;
  favoriteCount: number;
  claimCount: number;
};
