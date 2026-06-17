import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Bell, ClipboardCheck, Download, Flag, Heart, MessageSquare, Plus, Rocket, ShieldCheck } from "lucide-react";
import { AppCard } from "@/components/app-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { LibraryCard } from "@/components/library-card";
import { getDashboardData } from "@/lib/data";

export default async function DashboardPage() {
  const { viewer, apps, claims, favorites, reviews } = await getDashboardData();
  if (!viewer.user) redirect("/login?redirect=/dashboard");

  const role = viewer.profile?.role ?? "user";
  const canPublish = ["creator", "admin"].includes(role);
  const publishedCount = apps.filter((app) => app.status === "published").length;
  const pendingCount = apps.filter((app) => app.status === "pending_review" || app.status === "flagged").length;
  const totalClaims = apps.reduce((sum, app) => sum + app.claimCount, 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <section className="relative overflow-hidden rounded-[24px] border border-line bg-panel px-6 py-8 shadow-neon md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,.16),transparent_35%),radial-gradient(circle_at_85%_30%,rgba(124,58,237,.18),transparent_32%)]" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-cyan-100">{canPublish ? "Creator Console" : "Customer Console"}</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-white md:text-5xl">
              {canPublish ? "作品运营台" : "我的应用库"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              {canPublish
                ? "这里管理你的作品、审核状态、免费获取量与用户反馈。发布后的每次修改都会回到审核流程。"
                : "这里像免费电商的订单中心一样，集中管理你已获取的应用、收藏记录和使用反馈。"}
            </p>
          </div>
          {canPublish ? (
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/create">
                <Plus size={17} />
                发布新应用
              </ButtonLink>
              <ButtonLink href="/notifications" variant="secondary">
                <Bell size={17} />
                站内通知
              </ButtonLink>
              {role === "admin" ? <ButtonLink href="/admin" variant="secondary">管理后台</ButtonLink> : null}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/?sort=rating">继续逛市场</ButtonLink>
              <ButtonLink href="/notifications" variant="secondary">
                <Bell size={17} />
                站内通知
              </ButtonLink>
              <ButtonLink href="/apply-creator" variant="secondary">申请成为创作者</ButtonLink>
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {canPublish ? (
          <>
            <Metric icon={<Rocket size={20} />} label="已发布作品" value={publishedCount} tone="cyan" />
            <Metric icon={<Rocket size={20} />} label="审核中 / 复核中" value={pendingCount} tone="pink" />
            <Metric icon={<Download size={20} />} label="累计免费获取" value={totalClaims} tone="mint" />
          </>
        ) : (
          <>
            <Metric icon={<Download size={20} />} label="已获取应用" value={claims.length} tone="cyan" />
            <Metric icon={<Heart size={20} />} label="收藏应用" value={favorites.length} tone="pink" />
            <Metric icon={<MessageSquare size={20} />} label="已发布评论" value={reviews.length} tone="mint" />
          </>
        )}
      </section>

      {role === "admin" ? (
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <QuickLink href="/admin/apps" icon={<ClipboardCheck size={18} />} title="应用审核" description="处理新发布和被举报的应用。" />
          <QuickLink href="/admin/applications" icon={<ShieldCheck size={18} />} title="创作者申请" description="审批用户的发布权限申请。" />
          <QuickLink href="/admin/reports" icon={<Flag size={18} />} title="举报管理" description="复核举报结果并通知双方。" />
        </section>
      ) : null}

      {canPublish ? (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">我的作品</h2>
              <p className="mt-1 text-sm text-slate-400">审核中、已发布、被驳回的作品都在这里统一管理。</p>
            </div>
            <ButtonLink href="/create" variant="secondary">继续发布</ButtonLink>
          </div>
          {apps.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{apps.map((app) => <AppCard key={app.id} app={app} />)}</div>
          ) : (
            <EmptyState title="还没有发布应用" description="发布第一个应用后，可以在这里持续管理它。" />
          )}
        </section>
      ) : (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">我的已获取应用</h2>
              <p className="mt-1 text-sm text-slate-400">先免费获取，再在这里打开、回访和继续评价。</p>
            </div>
            <ButtonLink href="/?sort=rating" variant="secondary">继续获取</ButtonLink>
          </div>
          {claims.length ? (
            <div className="grid gap-5 lg:grid-cols-2">{claims.map((claim) => <LibraryCard key={claim.id} claim={claim} />)}</div>
          ) : (
            <EmptyState title="你的应用库还是空的" description="在应用详情页点击“免费获取”后，应用会进入这里。" />
          )}
        </section>
      )}

      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">收藏夹</h2>
          <div className="mt-4">
            {favorites.length ? (
              <div className="grid gap-5 sm:grid-cols-2">{favorites.map((app) => <AppCard key={app.id} app={app} />)}</div>
            ) : (
              <EmptyState title="还没有收藏" description="在应用详情页收藏值得反复使用或二次创作的作品。" />
            )}
          </div>
        </div>
        <aside className="rounded-lg border border-line bg-panel p-5 shadow-pink backdrop-blur">
          <h2 className="font-display text-xl font-semibold text-white">最近反馈</h2>
          <div className="mt-3 text-sm text-slate-400">共 {reviews.length} 条评论</div>
          <div className="mt-4 space-y-3">
            {reviews.length ? reviews.map((review) => (
              <div key={review.id} className="rounded-md border border-line bg-white/[0.03] p-3">
                <div className="text-sm font-medium text-white">{(review as { app?: { name?: string } }).app?.name ?? "应用"}</div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{review.comment || `${review.rating} / 5`}</p>
              </div>
            )) : <p className="text-sm text-slate-400">你还没有发表过评论。</p>}
          </div>
        </aside>
      </section>
    </main>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <ButtonLink href={href} variant="secondary" className="h-auto justify-start rounded-2xl border border-line bg-panel px-5 py-5 text-left shadow-pink">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyanGlow/20 bg-cyanGlow/10 text-cyanGlow">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold text-white">{title}</span>
        <span className="mt-1 block text-sm font-normal leading-6 text-slate-400">{description}</span>
      </span>
    </ButtonLink>
  );
}

function Metric({
  icon,
  label,
  value,
  tone
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "cyan" | "pink" | "mint";
}) {
  const toneClass = {
    cyan: "from-cyanGlow/20 via-cyanGlow/8 to-transparent text-cyan-100",
    pink: "from-pinkGlow/20 via-pinkGlow/8 to-transparent text-fuchsia-100",
    mint: "from-mint/20 via-mint/8 to-transparent text-emerald-100"
  }[tone];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-panel p-5 shadow-pink backdrop-blur">
      <div className={`absolute inset-0 bg-gradient-to-br ${toneClass}`} />
      <div className="relative">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <span className="text-cyanGlow">{icon}</span>
          {label}
        </div>
        <div className="mt-4 font-display text-4xl font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}
