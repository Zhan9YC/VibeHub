"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { NotificationRecord } from "@/lib/types";
import { appClaimSchema, appSchema, creatorApplicationSchema, profileSchema, reportSchema, reviewSchema, tipSchema } from "@/lib/schemas";

function authErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Authentication request failed.");
  }
  return "Authentication request failed. Check the Supabase URL, anon key, and auth configuration.";
}

function parseArray(value: FormDataEntryValue | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isMissingSchemaError(error: { code?: string; message?: string } | null | undefined) {
  return (
    error?.code === "PGRST205" ||
    error?.code === "PGRST200" ||
    error?.code === "42P01" ||
    error?.code === "42703" ||
    Boolean(error?.message?.includes("does not exist")) ||
    Boolean(error?.message?.includes("Could not find the table"))
  );
}


function formatDbError(
  scope: string,
  error: { code?: string; message?: string; hint?: string | null } | null | undefined
) {
  if (!error) return `${scope} failed.`;

  if (error.code === "42501") {
    return `${scope} failed: the database RLS policy blocked this action. Apply the latest Supabase migrations and try again.`;
  }

  return error.message ? `${scope} failed: ${error.message}` : `${scope} failed.`;
}

function formatNotificationWarning(actionLabel: string, error: unknown) {
  const reason = error instanceof Error
    ? error.message
    : formatDbError("send notification", error as { code?: string; message?: string; hint?: string | null });

  return `${actionLabel}，但站内通知发送失败：${reason}`;
}

async function createNotification(
  supabase: ReturnType<typeof createClient>,
  input: {
    userId: string;
    type: NotificationRecord["type"];
    title: string;
    body?: string | null;
    ctaHref?: string | null;
  }
) {
  const { error } = await supabase.rpc("admin_create_notification", {
    target_user_id: input.userId,
    notification_type: input.type,
    notification_title: input.title,
    notification_body: input.body ?? null,
    notification_cta_href: input.ctaHref ?? null
  });

  if (isMissingSchemaError(error)) {
    const { error: fallbackError } = await supabase.from("notifications").insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      cta_href: input.ctaHref ?? null
    });

    if (fallbackError && !isMissingSchemaError(fallbackError)) {
      throw new Error(formatDbError("send notification", fallbackError));
    }

    return;
  }

  if (error) {
    throw new Error(formatDbError("send notification", error));
  }
}

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Please sign in first.");
  return { supabase, user };
}

async function requireProfile() {
  const { supabase, user } = await requireUser();
  let profile;

  try {
    profile = await ensureProfile(supabase, user);
  } catch (error) {
    if (error instanceof Error && /row-level security|permission denied/i.test(error.message)) {
      throw new Error("User profile is missing and automatic profile creation is blocked by database permissions. Run migration 007 and try again.");
    }
    throw error instanceof Error ? error : new Error("User profile is unavailable.");
  }

  if (profile.is_banned) throw new Error("This account is banned.");
  return { supabase, user, profile };
}

async function requireAdmin() {
  const ctx = await requireProfile();
  if (ctx.profile.role !== "admin") throw new Error("Admin access required.");
  return ctx;
}

export async function signIn(_prevState: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/");

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
  } catch (error) {
    return { error: authErrorMessage(error) };
  }

  redirect(redirectTo || "/");
}

export async function signUp(_prevState: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const origin = String(formData.get("origin") ?? "").trim();
  const redirectOrigin = origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectTo = `${redirectOrigin.replace(/\/$/, "")}/auth/callback`;

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
    if (error) return { error: error.message };
    if (data.session) redirect("/");
  } catch (error) {
    return { error: authErrorMessage(error) };
  }

  return {
    step: "verify" as const,
    email,
    message: "A verification code was sent to your email. Enter it to complete sign up."
  };
}

export async function verifySignUpOtp(_prevState: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const token = String(formData.get("token") ?? "").trim();

  if (!email || !token) return { error: "Please enter both email and verification code." };

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup"
    });
    if (error) return { error: error.message };
  } catch (error) {
    return { error: authErrorMessage(error) };
  }

  redirect("/");
}

export async function signInWithGoogle(redirectPath = "/") {
  let url: string | undefined;
  try {
    const supabase = createClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`
      }
    });
    if (error) return { error: error.message };
    url = data.url;
  } catch (error) {
    return { error: authErrorMessage(error) };
  }

  if (url) redirect(url);
}

export async function signInWithGoogleForm(formData: FormData) {
  const redirectPath = String(formData.get("redirect") ?? "/");
  await signInWithGoogle(redirectPath);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createApp(formData: FormData) {
  const { supabase, user, profile } = await requireProfile();
  if (!["creator", "admin"].includes(profile.role)) {
    return { error: "Only approved creators can publish apps." };
  }

  const parsed = appSchema.safeParse({
    name: formData.get("name"),
    slogan: formData.get("slogan"),
    description: formData.get("description"),
    category: formData.get("category"),
    tech_stack: parseArray(formData.get("tech_stack")),
    license: formData.get("license"),
    screenshots: parseArray(formData.get("screenshots")),
    demo_url: formData.get("demo_url"),
    prompt_text: formData.get("prompt_text"),
    remix_allowed: formData.get("remix_allowed") === "on" || formData.get("remix_allowed") === "true",
    remix_license: formData.get("remix_license"),
    contact_name: formData.get("contact_name"),
    contact_email: formData.get("contact_email"),
    contact_phone: formData.get("contact_phone"),
    organization: formData.get("organization"),
    publisher_type: formData.get("publisher_type"),
    age_range: formData.get("age_range"),
    gender: formData.get("gender"),
    preferred_contact: formData.get("preferred_contact"),
    contact_note: formData.get("contact_note"),
    community_guidelines: formData.get("community_guidelines") === "on" || formData.get("community_guidelines") === "true"
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  const {
    contact_name,
    contact_email,
    contact_phone,
    organization,
    publisher_type,
    age_range,
    gender,
    preferred_contact,
    contact_note,
    community_guidelines,
    ...appData
  } = parsed.data;
  void community_guidelines;

  const { data, error } = await supabase
    .from("apps")
    .insert({
      ...appData,
      creator_id: user.id,
      status: "pending_review",
      license: appData.license || null,
      demo_url: appData.demo_url || null,
      contact_info: {
        name: contact_name || null,
        email: contact_email || null,
        phone: contact_phone || null,
        organization: organization || null,
        publisher_type,
        age_range: age_range || null,
        gender: gender || null,
        preferred_contact,
        note: contact_note || null
      }
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Create failed." };

  const remixFrom = String(formData.get("remix_from") ?? "");
  if (remixFrom) {
    await supabase.from("remixes").insert({ parent_app_id: remixFrom, child_app_id: data.id });
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect(`/apps/${data.id}`);
}

export async function updateApp(formData: FormData) {
  const { supabase, user, profile } = await requireProfile();
  const appId = String(formData.get("app_id") ?? "");
  if (!appId) return { error: "App not found." };

  const { data: existing, error: existingError } = await supabase
    .from("apps")
    .select("id,creator_id")
    .eq("id", appId)
    .single();

  if (existingError || !existing) return { error: existingError?.message ?? "App not found." };
  if (profile.role !== "admin" && existing.creator_id !== user.id) return { error: "You can only edit your own apps." };

  const parsed = appSchema.safeParse({
    name: formData.get("name"),
    slogan: formData.get("slogan"),
    description: formData.get("description"),
    category: formData.get("category"),
    tech_stack: parseArray(formData.get("tech_stack")),
    license: formData.get("license"),
    screenshots: parseArray(formData.get("screenshots")),
    demo_url: formData.get("demo_url"),
    prompt_text: formData.get("prompt_text"),
    remix_allowed: formData.get("remix_allowed") === "on" || formData.get("remix_allowed") === "true",
    remix_license: formData.get("remix_license"),
    contact_name: formData.get("contact_name"),
    contact_email: formData.get("contact_email"),
    contact_phone: formData.get("contact_phone"),
    organization: formData.get("organization"),
    publisher_type: formData.get("publisher_type"),
    age_range: formData.get("age_range"),
    gender: formData.get("gender"),
    preferred_contact: formData.get("preferred_contact"),
    contact_note: formData.get("contact_note"),
    community_guidelines: formData.get("community_guidelines") === "on" || formData.get("community_guidelines") === "true"
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  const {
    contact_name,
    contact_email,
    contact_phone,
    organization,
    publisher_type,
    age_range,
    gender,
    preferred_contact,
    contact_note,
    community_guidelines,
    ...appData
  } = parsed.data;
  void community_guidelines;

  const { error } = await supabase
    .from("apps")
    .update({
      ...appData,
      ...(profile.role === "admin" ? {} : { status: "pending_review" }),
      license: appData.license || null,
      demo_url: appData.demo_url || null,
      contact_info: {
        name: contact_name || null,
        email: contact_email || null,
        phone: contact_phone || null,
        organization: organization || null,
        publisher_type,
        age_range: age_range || null,
        gender: gender || null,
        preferred_contact,
        note: contact_note || null
      }
    })
    .eq("id", appId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/apps/${appId}`);
  redirect(`/apps/${appId}`);
}

export async function applyCreator(_prevState: { error?: string; message?: string; ok?: boolean } | null, formData: FormData) {
  const { supabase, user, profile } = await requireProfile();
  if (profile.role === "creator" || profile.role === "admin") {
    return { error: "You already have publishing access." };
  }

  const parsed = creatorApplicationSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid application content." };

  const { data: existing, error: existingError } = await supabase
    .from("creator_applications")
    .select("id,status")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existingError) return { error: existingError.message };
  if (existing) return { error: "You already have a pending application waiting for review." };

  const { error } = await supabase.from("creator_applications").insert({
    user_id: user.id,
    reason: parsed.data.reason,
    status: "pending"
  });

  if (error) return { error: error.message };
  revalidatePath("/apply-creator");
  revalidatePath(`/profile/${user.id}`);
  return { ok: true, message: "Application submitted. Wait for admin review." };
}


export async function approveApplication(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const applicationId = String(formData.get("application_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const reviewNote = String(formData.get("review_note") ?? "").trim() || "你的创作者申请已通过，现在可以发布应用。";

  if (!applicationId || !userId) return { error: "Application not found." };

  const { data: application, error: lookupError } = await supabase
    .from("creator_applications")
    .select("id,status,user_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (lookupError) return { error: formatDbError("load application", lookupError) };
  if (!application || application.user_id !== userId) return { error: "Application not found." };
  if (application.status === "approved") return { ok: true, message: "该申请已是通过状态。" };

  const { error: profileError } = await supabase.from("profiles").update({ role: "creator" }).eq("id", userId);
  if (profileError) return { error: formatDbError("update profile role", profileError) };

  const { error: applicationError } = await supabase
    .from("creator_applications")
    .update({ status: "approved", reviewed_by: user.id, review_note: reviewNote, reviewed_at: new Date().toISOString() })
    .eq("id", applicationId);
  if (applicationError) return { error: formatDbError("update application status", applicationError) };

  try {
    await createNotification(supabase, {
      userId,
      type: "creator_application",
      title: "创作者申请已通过",
      body: reviewNote,
      ctaHref: "/create"
    });
  } catch (error) {
    revalidatePath("/admin/applications");
    revalidatePath(`/profile/${userId}`);
    revalidatePath("/apply-creator");
    revalidatePath("/notifications");
    return { ok: true, warning: formatNotificationWarning("申请已批准", error) };
  }

  revalidatePath("/admin/applications");
  revalidatePath(`/profile/${userId}`);
  revalidatePath("/apply-creator");
  revalidatePath("/notifications");
  return { ok: true };
}

export async function rejectApplication(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const applicationId = String(formData.get("application_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const reviewNote = String(formData.get("review_note") ?? "").trim();

  if (!applicationId || !userId) return { error: "Application not found." };
  if (reviewNote.length < 8) {
    return { error: "Please enter at least 8 characters for the review note." };
  }

  const { data: application, error: lookupError } = await supabase
    .from("creator_applications")
    .select("id,status,user_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (lookupError) return { error: formatDbError("load application", lookupError) };
  if (!application || application.user_id !== userId) return { error: "Application not found." };
  if (application.status === "rejected") return { ok: true, message: "该申请已是拒绝状态。" };

  const { error: applicationError } = await supabase
    .from("creator_applications")
    .update({ status: "rejected", reviewed_by: user.id, review_note: reviewNote, reviewed_at: new Date().toISOString() })
    .eq("id", applicationId);
  if (applicationError) return { error: formatDbError("update application status", applicationError) };

  try {
    await createNotification(supabase, {
      userId,
      type: "creator_application",
      title: "创作者申请未通过",
      body: reviewNote,
      ctaHref: "/apply-creator"
    });
  } catch (error) {
    revalidatePath("/admin/applications");
    revalidatePath(`/profile/${userId}`);
    revalidatePath("/apply-creator");
    revalidatePath("/notifications");
    return { ok: true, warning: formatNotificationWarning("申请已拒绝", error) };
  }

  revalidatePath("/admin/applications");
  revalidatePath(`/profile/${userId}`);
  revalidatePath("/apply-creator");
  revalidatePath("/notifications");
  return { ok: true };
}

export async function approveApp(formData: FormData) {
  const { supabase } = await requireAdmin();
  const appId = String(formData.get("app_id") ?? "");
  const { data: app, error: appLookupError } = await supabase
    .from("apps")
    .select("id,name,creator_id")
    .eq("id", appId)
    .single();

  if (appLookupError || !app) return { error: appLookupError?.message ?? "App not found." };

  const { error } = await supabase.from("apps").update({ status: "published" }).eq("id", appId);
  if (error) return { error: error.message };

  try {
    await createNotification(supabase, {
      userId: app.creator_id,
      type: "app_review",
      title: `应用《${app.name}》已通过审核`,
      body: "你的应用已通过审核，现已在市场公开展示。",
      ctaHref: `/apps/${app.id}`
    });
  } catch (error) {
    revalidatePath("/admin/apps");
    revalidatePath(`/apps/${appId}`);
    revalidatePath("/");
    revalidatePath("/notifications");
    return { ok: true, warning: formatNotificationWarning("应用已通过审核", error) };
  }

  revalidatePath("/admin/apps");
  revalidatePath(`/apps/${appId}`);
  revalidatePath("/");
  revalidatePath("/notifications");
  return { ok: true };
}

export async function rejectApp(formData: FormData) {
  const { supabase } = await requireAdmin();
  const appId = String(formData.get("app_id") ?? "");
  const { data: app, error: appLookupError } = await supabase
    .from("apps")
    .select("id,name,creator_id")
    .eq("id", appId)
    .single();

  if (appLookupError || !app) return { error: appLookupError?.message ?? "App not found." };

  const { error } = await supabase.from("apps").update({ status: "rejected" }).eq("id", appId);
  if (error) return { error: error.message };

  try {
    await createNotification(supabase, {
      userId: app.creator_id,
      type: "app_review",
      title: `应用《${app.name}》未通过审核`,
      body: "请修改应用后重新提交审核。",
      ctaHref: `/apps/${app.id}`
    });
  } catch (error) {
    revalidatePath("/admin/apps");
    revalidatePath(`/apps/${appId}`);
    revalidatePath("/notifications");
    return { ok: true, warning: formatNotificationWarning("应用已驳回", error) };
  }

  revalidatePath("/admin/apps");
  revalidatePath(`/apps/${appId}`);
  revalidatePath("/notifications");
  return { ok: true };
}

export async function reportApp(formData: FormData) {
  const { supabase, user } = await requireProfile();
  const parsed = reportSchema.safeParse({
    app_id: formData.get("app_id"),
    reason: formData.get("reason")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid report content." };

  const { error } = await supabase.from("reports").insert({
    app_id: parsed.data.app_id,
    reporter_id: user.id,
    reason: parsed.data.reason,
    status: "open"
  });
  if (error) return { error: error.message };

  revalidatePath(`/apps/${parsed.data.app_id}`);
  revalidatePath("/admin/apps");
  revalidatePath("/admin/reports");
  return { ok: true, message: "Report submitted. The app has been added to the review queue." };
}

export async function banCreator(formData: FormData) {
  const { supabase } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const banned = String(formData.get("banned") ?? "true") === "true";
  if (!userId) return { error: "User not found." };

  const { error } = await supabase.from("profiles").update({ is_banned: banned }).eq("id", userId);
  if (error) return { error: error.message };

  try {
    await createNotification(supabase, {
      userId,
      type: "account",
      title: banned ? "账号已被限制" : "账号已恢复",
      body: banned
        ? "你的发布权限已被限制，如有异议请联系管理员。"
        : "你的账号已恢复，发布功能可以继续使用。",
      ctaHref: "/profile"
    });
  } catch (error) {
    revalidatePath("/admin/apps");
    revalidatePath("/admin/applications");
    revalidatePath("/notifications");
    return { ok: true, warning: formatNotificationWarning(banned ? "创作者已封禁" : "创作者已恢复", error) };
  }

  revalidatePath("/admin/apps");
  revalidatePath("/admin/applications");
  revalidatePath("/notifications");
  return { ok: true };
}

export async function resolveReport(formData: FormData) {
  const { supabase } = await requireAdmin();
  const reportId = String(formData.get("report_id") ?? "");
  const appId = String(formData.get("app_id") ?? "");
  const resolution = String(formData.get("resolution") ?? "dismissed");
  const nextReportStatus = resolution === "resolved" ? "resolved" : "dismissed";
  const nextAppStatus = resolution === "resolved" ? "rejected" : "published";

  const { data: report, error: reportLookupError } = await supabase
    .from("reports")
    .select("id,reporter_id,app_id,apps(id,name,creator_id)")
    .eq("id", reportId)
    .single();

  if (reportLookupError || !report) return { error: reportLookupError?.message ?? "Report not found." };

  const { error } = await supabase.from("reports").update({ status: nextReportStatus }).eq("id", reportId);
  if (error) return { error: error.message };
  const { error: appError } = await supabase.from("apps").update({ status: nextAppStatus }).eq("id", appId);
  if (appError) return { error: appError.message };

  const reportApps = (report as {
    apps?: Array<{ id: string; name: string; creator_id: string }> | { id: string; name: string; creator_id: string } | null;
  }).apps;
  const reportApp = Array.isArray(reportApps) ? reportApps[0] : reportApps;

  if (reportApp?.creator_id) {
    try {
      await createNotification(supabase, {
        userId: reportApp.creator_id,
        type: "report",
        title: resolution === "resolved" ? `应用《${reportApp.name}》已下架` : `应用《${reportApp.name}》已恢复展示`,
        body: resolution === "resolved"
          ? "管理员已确认举报成立，应用已从公开市场下架。"
          : "管理员已驳回举报，应用已恢复公开展示。",
        ctaHref: `/apps/${reportApp.id}`
      });
    } catch (error) {
      revalidatePath("/admin/reports");
      revalidatePath("/admin/apps");
      revalidatePath(`/apps/${appId}`);
      revalidatePath("/notifications");
      return { ok: true, warning: formatNotificationWarning("举报结果已处理", error) };
    }
  }

  try {
    await createNotification(supabase, {
      userId: report.reporter_id,
      type: "report",
      title: resolution === "resolved" ? "你的举报已被采纳" : "你的举报未被采纳",
      body: resolution === "resolved"
        ? "管理员已确认问题属实，应用已从公开市场下架。"
        : "管理员已审核举报，当前证据不足以下架该应用。",
      ctaHref: `/apps/${appId}`
    });
  } catch (error) {
    revalidatePath("/admin/reports");
    revalidatePath("/admin/apps");
    revalidatePath(`/apps/${appId}`);
    revalidatePath("/notifications");
    return { ok: true, warning: formatNotificationWarning("举报结果已处理", error) };
  }

  revalidatePath("/admin/reports");
  revalidatePath("/admin/apps");
  revalidatePath(`/apps/${appId}`);
  revalidatePath("/notifications");
  return { ok: true };
}

export async function markNotificationsRead(formData: FormData) {
  const { supabase, user } = await requireUser();
  const notificationId = String(formData.get("notification_id") ?? "");

  const query = supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("is_read", false);

  const { error } = notificationId ? await query.eq("id", notificationId) : await query;
  if (error && !isMissingSchemaError(error)) return;

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

export async function claimApp(formData: FormData) {
  const { supabase, user } = await requireProfile();
  const parsed = appClaimSchema.safeParse({ app_id: formData.get("app_id") });
  if (!parsed.success) return { error: "App not found." };

  const { data: app, error: appError } = await supabase
    .from("apps")
    .select("id,name,status,creator_id")
    .eq("id", parsed.data.app_id)
    .single();

  if (appError || !app) return { error: appError?.message ?? "App not found." };
  if (app.status !== "published") return { error: "This app is not publicly available yet." };
  if (app.creator_id === user.id) return { error: "You do not need to claim your own app." };

  const { data: existing, error: existingError } = await supabase
    .from("app_claims")
    .select("id")
    .eq("app_id", parsed.data.app_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) return { error: existingError.message };
  if (!existing) {
    const { error } = await supabase.from("app_claims").insert({
      app_id: parsed.data.app_id,
      user_id: user.id,
      status: "claimed"
    });

    if (error && error.code !== "23505") return { error: error.message };
  }

  revalidatePath(`/apps/${parsed.data.app_id}`);
  revalidatePath("/dashboard");
  return { ok: true, message: `${app.name} has been added to your library.` };
}

export async function markAppOpened(formData: FormData) {
  const { supabase, user } = await requireProfile();
  const parsed = appClaimSchema.safeParse({ app_id: formData.get("app_id") });
  if (!parsed.success) return { error: "App not found." };

  const { data: app, error: appError } = await supabase
    .from("apps")
    .select("id,demo_url,status,creator_id")
    .eq("id", parsed.data.app_id)
    .single();

  if (appError || !app) return { error: appError?.message ?? "App not found." };
  if (!app.demo_url) return { error: "This app does not have a demo URL yet." };
  if (app.status !== "published" && app.creator_id !== user.id) return { error: "This app is not public yet." };

  if (app.creator_id !== user.id) {
    const { data: claim, error: claimError } = await supabase
      .from("app_claims")
      .select("id")
      .eq("app_id", parsed.data.app_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (claimError) return { error: claimError.message };
    if (!claim) return { error: "Claim this app before using it." };

    const { error } = await supabase
      .from("app_claims")
      .update({ last_opened_at: new Date().toISOString() })
      .eq("id", claim.id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/apps/${parsed.data.app_id}`);
  return { ok: true, url: app.demo_url };
}

export async function submitReview(formData: FormData) {
  const { supabase, user } = await requireProfile();
  const parsed = reviewSchema.safeParse({
    app_id: formData.get("app_id"),
    rating: formData.get("rating"),
    comment: formData.get("comment")
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid review data." };

  const { data: app, error: appError } = await supabase
    .from("apps")
    .select("id,creator_id,status")
    .eq("id", parsed.data.app_id)
    .single();

  if (appError || !app) return { error: appError?.message ?? "App not found." };
  if (app.creator_id === user.id) return { error: "You cannot review your own app." };
  if (app.status !== "published") return { error: "Only published apps can be reviewed." };

  const { data: claim, error: claimError } = await supabase
    .from("app_claims")
    .select("id")
    .eq("app_id", parsed.data.app_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (claimError) return { error: claimError.message };
  if (!claim) return { error: "Claim and use the app before submitting a review." };

  const { error } = await supabase.from("reviews").insert({
    ...parsed.data,
    user_id: user.id,
    comment: parsed.data.comment || null
  });

  if (error) {
    if (error.code === "23505") return { error: "You have already reviewed this app." };
    return { error: error.message };
  }

  revalidatePath(`/apps/${parsed.data.app_id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function createTip(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = tipSchema.safeParse({ app_id: formData.get("app_id"), amount: formData.get("amount") });
  if (!parsed.success) return { error: "Invalid tip amount." };

  const { error } = await supabase.from("tips").insert({
    app_id: parsed.data.app_id,
    amount: parsed.data.amount,
    from_user_id: user.id,
    stripe_session_id: null
  });

  if (error) return { error: error.message };
  revalidatePath(`/apps/${parsed.data.app_id}`);
  return { ok: true, message: "This feature is coming soon. Your support intent has been recorded." };
}

export async function toggleFavorite(formData: FormData) {
  const { supabase, user } = await requireUser();
  const appId = String(formData.get("app_id") ?? "");
  const next = String(formData.get("next") ?? `/apps/${appId}`);

  if (!appId) return { error: "App not found." };

  const { data: existing, error: lookupError } = await supabase
    .from("app_favorites")
    .select("id")
    .eq("app_id", appId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) return { error: lookupError.message };

  const { error } = existing
    ? await supabase.from("app_favorites").delete().eq("id", existing.id).eq("user_id", user.id)
    : await supabase.from("app_favorites").insert({ app_id: appId, user_id: user.id });

  if (error) return { error: error.message };

  revalidatePath(next);
  revalidatePath("/");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteApp(formData: FormData) {
  const { supabase, user } = await requireUser();
  const appId = String(formData.get("app_id") ?? "");
  const { error } = await supabase.from("apps").delete().eq("id", appId).eq("creator_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = profileSchema.safeParse({
    username: formData.get("username"),
    full_name: formData.get("full_name"),
    bio: formData.get("bio"),
    website: formData.get("website"),
    twitter: formData.get("twitter"),
    avatar_url: formData.get("avatar_url")
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid profile data." };

  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/profile/${user.id}`);
  return { ok: true };
}
