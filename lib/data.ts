import { notFound } from "next/navigation";
import { average } from "@/lib/utils";
import { pageSize } from "@/lib/constants";
import { hasSupabaseEnv } from "@/lib/env";
import { ensureProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { AppClaim, AppRecord, AppWithStats, CreatorApplication, NotificationRecord, Profile, Report, Review } from "@/lib/types";

type SearchParams = {
  q?: string;
  category?: string;
  sort?: string;
  page?: string;
};

type SupabaseLikeError = {
  code?: string;
  details?: string | null;
  hint?: string | null;
  message?: string;
};

function isMissingSchema(error: SupabaseLikeError | null | undefined) {
  return (
    error?.code === "PGRST205" ||
    error?.code === "PGRST200" ||
    error?.code === "42P01" ||
    error?.code === "42703" ||
    Boolean(error?.message?.includes("does not exist")) ||
    Boolean(error?.message?.includes("Could not find the table"))
  );
}

function throwDataError(scope: string, error: SupabaseLikeError | null | undefined): never {
  const message = error?.message?.trim() || "未知数据错误";
  const extras = [error?.code?.trim(), error?.hint?.trim()].filter(Boolean).join(" | ");
  throw new Error(`${scope}失败：${message}${extras ? ` [${extras}]` : ""}`);
}

function hydrateStats(
  app: AppRecord & {
    profiles?: Profile | null;
    reviews?: { rating: number }[];
    remixes?: { id: string }[];
    app_favorites?: { user_id?: string | null }[];
    app_claims?: { user_id?: string | null; last_opened_at?: string | null }[];
  }
) {
  const ratings = app.reviews?.map((review) => review.rating) ?? [];
  return {
    ...app,
    avgRating: average(ratings),
    reviewCount: ratings.length,
    remixCount: app.remixes?.length ?? 0,
    favoriteCount: app.app_favorites?.length ?? 0,
    claimCount: app.app_claims?.length ?? 0
  } satisfies AppWithStats;
}

export async function getViewer() {
  if (!hasSupabaseEnv()) return { user: null, profile: null };
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  try {
    const profile = await ensureProfile(supabase, user);
    return { user, profile };
  } catch (error) {
    if (isMissingSchema(error as SupabaseLikeError)) return { user, profile: null };
    return { user, profile: null };
  }
}

export async function getApps(params: SearchParams) {
  if (!hasSupabaseEnv()) {
    return { apps: [], total: 0, page: Math.max(Number(params.page ?? "1"), 1), pageCount: 1, sort: params.sort ?? "created_at" };
  }
  const supabase = createClient();
  const page = Math.max(Number(params.page ?? "1"), 1);
  const sort = params.sort ?? "created_at";

  let query = supabase
    .from("apps")
    .select("*, profiles(*), reviews(rating), remixes!remixes_parent_app_id_fkey(id), app_favorites(user_id), app_claims(user_id,last_opened_at)", { count: "exact" })
    .eq("status", "published");

  if (params.category && params.category !== "All") {
    query = query.eq("category", params.category);
  }

  if (params.q) {
    const q = params.q.replace(/[%_]/g, "");
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  if (sort === "created_at") {
    query = query.order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  } else {
    query = query.order("created_at", { ascending: false }).limit(120);
  }

  const { data, count, error } = await query;
  if (isMissingSchema(error)) {
    return { apps: [], total: 0, page, pageCount: 1, sort };
  }
  if (error) throwDataError("加载应用列表", error);

  let apps = (data ?? []).map((app) => hydrateStats(app as never));
  if (sort === "rating") apps = apps.sort((a, b) => b.avgRating - a.avgRating);
  if (sort === "remix_count") apps = apps.sort((a, b) => b.remixCount - a.remixCount);

  const sliced = sort === "created_at" ? apps : apps.slice((page - 1) * pageSize, page * pageSize);
  const total = sort === "created_at" ? count ?? 0 : apps.length;

  return { apps: sliced, total, page, pageCount: Math.max(Math.ceil(total / pageSize), 1), sort };
}

export async function getWeeklyHotApps() {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("apps")
    .select("*, profiles(*), reviews!inner(rating, created_at), remixes!remixes_parent_app_id_fkey(id), app_favorites(user_id), app_claims(user_id,last_opened_at)")
    .eq("status", "published")
    .gte("reviews.created_at", since)
    .limit(80);

  if (isMissingSchema(error)) return [];
  if (error) throwDataError("加载每周热门应用", error);

  return (data ?? [])
    .map((app) => hydrateStats(app as never))
    .sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount)
    .slice(0, 10);
}

export async function getAppDetail(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("apps")
    .select("*, profiles(*), reviews(rating), remixes!remixes_parent_app_id_fkey(id), app_favorites(user_id), app_claims(user_id,last_opened_at)")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const { data: avg } = await supabase.rpc("get_app_avg_rating", { app_id: id });
  const app = hydrateStats(data as never);
  app.avgRating = Number(avg ?? app.avgRating);
  return app;
}

export async function getAppClaimState(appId: string, userId?: string | null) {
  if (!hasSupabaseEnv() || !userId) {
    return { isClaimed: false, claimedAt: null, lastOpenedAt: null };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("app_claims")
    .select("created_at,last_opened_at")
    .eq("app_id", appId)
    .eq("user_id", userId)
    .maybeSingle();

  if (isMissingSchema(error)) {
    return { isClaimed: false, claimedAt: null, lastOpenedAt: null };
  }

  if (error) throwDataError("读取应用获取状态", error);

  return {
    isClaimed: Boolean(data),
    claimedAt: data?.created_at ?? null,
    lastOpenedAt: data?.last_opened_at ?? null
  };
}

export async function getAppFavoriteState(appId: string, userId?: string | null) {
  if (!hasSupabaseEnv()) return { favoriteCount: 0, isFavorited: false };
  const supabase = createClient();
  const { data, error } = await supabase.from("app_favorites").select("user_id").eq("app_id", appId);
  if (isMissingSchema(error)) return { favoriteCount: 0, isFavorited: false };
  if (error) throwDataError("读取收藏状态", error);

  const favorites = data ?? [];
  return {
    favoriteCount: favorites.length,
    isFavorited: Boolean(userId && favorites.some((favorite) => favorite.user_id === userId))
  };
}

export async function getReviews(appId: string, page = 1) {
  const supabase = createClient();
  const from = (page - 1) * 8;
  const to = from + 7;
  const { data, count, error } = await supabase
    .from("reviews")
    .select("*, profiles(*)", { count: "exact" })
    .eq("app_id", appId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throwDataError("加载评论列表", error);
  return { reviews: (data ?? []) as Review[], total: count ?? 0, pageCount: Math.max(Math.ceil((count ?? 0) / 8), 1) };
}

export async function getRemixChain(appId: string) {
  const supabase = createClient();
  const parents: Pick<AppRecord, "id" | "name" | "slogan">[] = [];
  const children: Pick<AppRecord, "id" | "name" | "slogan">[] = [];
  let current = appId;

  for (let depth = 0; depth < 5; depth += 1) {
    const { data } = await supabase.from("remixes").select("parent_app_id").eq("child_app_id", current).maybeSingle();
    if (!data?.parent_app_id) break;
    const { data: parent } = await supabase.from("apps").select("id,name,slogan").eq("id", data.parent_app_id).single();
    if (!parent) break;
    parents.unshift(parent as Pick<AppRecord, "id" | "name" | "slogan">);
    current = parent.id;
  }

  const { data: directChildren } = await supabase
    .from("remixes")
    .select("child:apps!remixes_child_app_id_fkey(id,name,slogan)")
    .eq("parent_app_id", appId)
    .limit(5);

  for (const item of directChildren ?? []) {
    const child = (item as unknown as { child: Pick<AppRecord, "id" | "name" | "slogan"> | Pick<AppRecord, "id" | "name" | "slogan">[] | null }).child;
    const record = Array.isArray(child) ? child[0] : child;
    if (record) children.push(record);
  }

  return { parents, children };
}

export async function getProfile(id: string) {
  const supabase = createClient();
  const viewer = await getViewer();
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (error || !profile) notFound();

  let query = supabase
    .from("apps")
    .select("*, profiles(*), reviews(rating), remixes!remixes_parent_app_id_fkey(id), app_favorites(user_id), app_claims(user_id,last_opened_at)")
    .eq("creator_id", id)
    .order("created_at", { ascending: false })
    .limit(24);

  if (viewer.user?.id !== id && viewer.profile?.role !== "admin") {
    query = query.eq("status", "published");
  }

  const { data: apps } = await query;

  const { data: application } = viewer.user?.id === id
    ? await supabase
        .from("creator_applications")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  return {
    profile: profile as Profile,
    apps: (apps ?? []).map((app) => hydrateStats(app as never)),
    application: application as CreatorApplication | null
  };
}

export async function getLatestCreatorApplication(userId: string) {
  if (!hasSupabaseEnv()) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("creator_applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (isMissingSchema(error)) return null;
  if (error) throwDataError("读取创作者申请记录", error);
  return data as CreatorApplication | null;
}

export async function getMarketplaceStats() {
  if (!hasSupabaseEnv()) return { appCount: 0, creatorCount: 0, reviewCount: 0, remixCount: 0 };
  const supabase = createClient();
  const [apps, creators, reviews, remixes] = await Promise.all([
    supabase.from("apps").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).in("role", ["creator", "admin"]),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("remixes").select("id", { count: "exact", head: true })
  ]);

  if ([apps.error, creators.error, reviews.error, remixes.error].some(isMissingSchema)) {
    return { appCount: 0, creatorCount: 0, reviewCount: 0, remixCount: 0 };
  }

  return {
    appCount: apps.count ?? 0,
    creatorCount: creators.count ?? 0,
    reviewCount: reviews.count ?? 0,
    remixCount: remixes.count ?? 0
  };
}

export async function getSetupStatus() {
  if (!hasSupabaseEnv()) {
    return {
      supabaseConfigured: false,
      schemaReady: false,
      message: "尚未配置 Supabase 环境变量。"
    };
  }

  const supabase = createClient();
  const { error } = await supabase.from("apps").select("id", { count: "exact", head: true });

  if (isMissingSchema(error)) {
    return {
      supabaseConfigured: true,
      schemaReady: false,
      message: "Supabase 已连接，但数据库表或最新迁移尚未执行。"
    };
  }

  if (error) {
    return {
      supabaseConfigured: true,
      schemaReady: false,
      message: error.message
    };
  }

  return {
    supabaseConfigured: true,
    schemaReady: true,
    message: "系统已就绪。"
  };
}

export async function getDashboardData() {
  const viewer = await getViewer();
  if (!viewer.user || !hasSupabaseEnv()) {
    return { viewer, apps: [], claims: [], favorites: [], reviews: [] };
  }

  const supabase = createClient();
  const [appsResult, claimsResult, favoritesResult, reviewsResult] = await Promise.all([
    supabase
      .from("apps")
      .select("*, profiles(*), reviews(rating), remixes!remixes_parent_app_id_fkey(id), app_favorites(user_id), app_claims(user_id,last_opened_at)")
      .eq("creator_id", viewer.user.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("app_claims")
      .select("*, app:apps(*, profiles(*), reviews(rating), remixes!remixes_parent_app_id_fkey(id), app_favorites(user_id), app_claims(user_id,last_opened_at))")
      .eq("user_id", viewer.user.id)
      .order("last_opened_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("app_favorites")
      .select("app:apps(*, profiles(*), reviews(rating), remixes!remixes_parent_app_id_fkey(id), app_favorites(user_id), app_claims(user_id,last_opened_at))")
      .eq("user_id", viewer.user.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("reviews")
      .select("*, app:apps(id,name)")
      .eq("user_id", viewer.user.id)
      .order("created_at", { ascending: false })
      .limit(8)
  ]);

  const apps = appsResult.error && isMissingSchema(appsResult.error) ? [] : (appsResult.data ?? []).map((app) => hydrateStats(app as never));
  const claims: AppClaim[] =
    claimsResult.error && isMissingSchema(claimsResult.error)
      ? []
      : (claimsResult.data ?? []).reduce<AppClaim[]>((result, item) => {
          const record = item as unknown as AppClaim & { app: AppRecord | AppRecord[] | null };
          const app = Array.isArray(record.app) ? record.app[0] : record.app;
          if (!app) return result;
          result.push({
            ...record,
            app: hydrateStats(app as never)
          });
          return result;
        }, []);
  const favorites =
    favoritesResult.error && isMissingSchema(favoritesResult.error)
      ? []
      : (favoritesResult.data ?? [])
          .map((item) => (item as unknown as { app: AppRecord | AppRecord[] | null }).app)
          .flat()
          .filter(Boolean)
          .map((app) => hydrateStats(app as never));
  const reviews = reviewsResult.error && isMissingSchema(reviewsResult.error) ? [] : reviewsResult.data ?? [];

  return { viewer, apps, claims, favorites, reviews };
}

export async function getNotifications(limit = 30) {
  const { user } = await getViewer();
  if (!user || !hasSupabaseEnv()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (isMissingSchema(error)) return [];
  if (error) throwDataError("加载通知列表", error);
  return (data ?? []) as NotificationRecord[];
}

export async function getUnreadNotificationCount(userId?: string | null) {
  if (!hasSupabaseEnv() || !userId) return 0;

  const supabase = createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (isMissingSchema(error)) return 0;
  if (error) throwDataError("读取未读通知数量", error);
  return count ?? 0;
}

export async function getCreatorApplications(status = "pending") {
  const { profile } = await getViewer();
  if (profile?.role !== "admin" || !hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("creator_applications")
    .select("*, profiles:profiles!creator_applications_user_id_fkey(*)")
    .eq("status", status)
    .order("created_at", { ascending: true });
  if (isMissingSchema(error)) return [];
  if (error) throwDataError("加载创作者申请列表", error);
  return (data ?? []) as CreatorApplication[];
}

export async function getReviewQueue() {
  const { profile } = await getViewer();
  if (profile?.role !== "admin" || !hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("apps")
    .select("*, profiles(*), reviews(rating), remixes!remixes_parent_app_id_fkey(id), app_favorites(user_id), app_claims(user_id,last_opened_at)")
    .in("status", ["pending_review", "flagged"])
    .order("created_at", { ascending: true });
  if (isMissingSchema(error)) return [];
  if (error) throwDataError("加载审核队列", error);
  return (data ?? []).map((app) => hydrateStats(app as never));
}

export async function getReports() {
  const { profile } = await getViewer();
  if (profile?.role !== "admin" || !hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*, apps(id,name,status), profiles(*)")
    .order("created_at", { ascending: false });
  if (isMissingSchema(error)) return [];
  if (error) throwDataError("加载举报列表", error);
  return (data ?? []) as Report[];
}

export async function getAdminConsoleSummary(userId?: string | null) {
  const { profile, user } = await getViewer();
  if (profile?.role !== "admin" || !hasSupabaseEnv()) {
    return {
      reviewQueueCount: 0,
      pendingApplicationCount: 0,
      openReportCount: 0,
      unreadNotificationCount: 0
    };
  }

  const supabase = createClient();
  const targetUserId = userId ?? user?.id ?? null;

  const [pendingReview, flaggedApps, pendingApplications, openReports, unreadNotifications] = await Promise.all([
    supabase.from("apps").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("apps").select("id", { count: "exact", head: true }).eq("status", "flagged"),
    supabase.from("creator_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    targetUserId
      ? supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", targetUserId).eq("is_read", false)
      : Promise.resolve({ count: 0, error: null } as { count: number | null; error: null })
  ]);

  if ([pendingReview.error, flaggedApps.error, pendingApplications.error, openReports.error, unreadNotifications.error].some(isMissingSchema)) {
    return {
      reviewQueueCount: 0,
      pendingApplicationCount: 0,
      openReportCount: 0,
      unreadNotificationCount: 0
    };
  }

  if (pendingReview.error) throwDataError("读取待审应用统计", pendingReview.error);
  if (flaggedApps.error) throwDataError("读取被举报应用统计", flaggedApps.error);
  if (pendingApplications.error) throwDataError("读取创作者申请统计", pendingApplications.error);
  if (openReports.error) throwDataError("读取举报统计", openReports.error);
  if (unreadNotifications.error) throwDataError("读取未读通知统计", unreadNotifications.error);

  return {
    reviewQueueCount: (pendingReview.count ?? 0) + (flaggedApps.count ?? 0),
    pendingApplicationCount: pendingApplications.count ?? 0,
    openReportCount: openReports.count ?? 0,
    unreadNotificationCount: unreadNotifications.count ?? 0
  };
}
