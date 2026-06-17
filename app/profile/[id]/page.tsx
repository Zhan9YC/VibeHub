import Image from "next/image";
import { AppCard } from "@/components/app-card";
import { EmptyState } from "@/components/empty-state";
import { ProfileForm } from "@/components/profile-form";
import { ButtonLink } from "@/components/ui/button";
import { getProfile, getViewer } from "@/lib/data";
import { formatDate, initials } from "@/lib/utils";

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const [{ profile, apps, application }, viewer] = await Promise.all([getProfile(params.id), getViewer()]);
  const isSelf = viewer.user?.id === profile.id;
  const roleLabel = { user: "普通用户", creator: "创作者", admin: "管理员" }[profile.role] ?? "用户";

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <section className="rounded-lg border border-line bg-panel p-6 shadow-neon">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white/[0.08] font-display text-3xl text-white">
            {profile.avatar_url ? <Image src={profile.avatar_url} alt={profile.full_name || profile.username || "avatar"} fill className="object-cover" /> : initials(profile.full_name || profile.username)}
          </div>
          <div>
            <h1 className="font-display text-4xl font-semibold text-white">{profile.full_name || profile.username || "VibeHub Creator"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-slate-400">@{profile.username || profile.id.slice(0, 8)}</p>
              <span className="rounded-full border border-line bg-white/70 px-2 py-1 text-xs text-slate-700">{roleLabel}</span>
              {profile.is_banned ? <span className="rounded-full bg-rose-50 px-2 py-1 text-xs text-rose-700">已封禁</span> : null}
            </div>
            {profile.bio ? <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{profile.bio}</p> : null}
          </div>
        </div>
        {isSelf && profile.role === "user" ? (
          <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50/80 p-4 text-sm text-slate-700">
            {application ? (
              <div className="space-y-2">
                <p>创作者申请状态：<span className="font-semibold">{applicationStatusLabel(application.status)}</span></p>
                {application.reviewed_at ? <p className="text-slate-500">处理时间：{formatDate(application.reviewed_at)}</p> : null}
                {application.review_note ? <p className="leading-6 text-slate-600">审核说明：{application.review_note}</p> : null}
                <div className="flex flex-wrap gap-3 pt-2">
                  <ButtonLink href="/notifications" variant="secondary">查看站内通知</ButtonLink>
                  {application.status === "rejected" ? (
                    <ButtonLink href="/apply-creator" variant="secondary">重新提交申请</ButtonLink>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p>普通用户可以浏览、收藏、评论和举报应用。通过创作者申请后才能发布应用。</p>
                <ButtonLink href="/apply-creator" variant="secondary">申请成为创作者</ButtonLink>
              </div>
            )}
          </div>
        ) : null}
        {isSelf ? <div className="mt-6"><ProfileForm profile={profile} /></div> : null}
      </section>
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-white">发布的应用</h2>
        <div className="mt-5">
          {apps.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {apps.map((app) => <AppCard key={app.id} app={app} />)}
            </div>
          ) : (
            <EmptyState title="还没有发布应用" description="发布后的作品会出现在这里。" />
          )}
        </div>
      </section>
    </main>
  );
}

function applicationStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "待审核",
    approved: "已批准",
    rejected: "已拒绝，可重新申请"
  };
  return labels[status] ?? status;
}
