import { ArrowLeft, Building2, Download, ExternalLink, Mail, Pencil, Phone, ShieldCheck, Star, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AppCard } from "@/components/app-card";
import { ClaimAppButton } from "@/components/claim-app-button";
import { ButtonLink } from "@/components/ui/button";
import { DeleteAppButton } from "@/components/delete-app-button";
import { EmptyState } from "@/components/empty-state";
import { FavoriteButton } from "@/components/favorite-button";
import { RemixDialog } from "@/components/remix-dialog";
import { ReportAppButton } from "@/components/report-app-button";
import { ReviewForm } from "@/components/review-form";
import { ShareButton } from "@/components/share-button";
import { TipDialog } from "@/components/tip-dialog";
import { getAppClaimState, getAppDetail, getAppFavoriteState, getRemixChain, getReviews, getViewer } from "@/lib/data";
import { formatDate, initials } from "@/lib/utils";

export default async function AppDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { reviews_page?: string } }) {
  const reviewPage = Math.max(Number(searchParams.reviews_page ?? "1"), 1);
  const [app, reviewsData, remixChain, viewer] = await Promise.all([
    getAppDetail(params.id),
    getReviews(params.id, reviewPage),
    getRemixChain(params.id),
    getViewer()
  ]);
  const favorite = await getAppFavoriteState(params.id, viewer.user?.id);
  const claimState = await getAppClaimState(params.id, viewer.user?.id);

  const isOwner = viewer.user?.id === app.creator_id;
  const isAdmin = viewer.profile?.role === "admin";
  const hero = app.screenshots?.[0];
  const canReview = !isOwner && claimState.isClaimed;

  return (
    <main>
      <section className="border-b border-line bg-[radial-gradient(circle_at_70%_20%,rgba(103,232,249,.16),transparent_30%)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.05fr_.95fr] md:px-6">
          <div>
            <ButtonLink href="/" variant="ghost" className="mb-6 px-0 text-slate-300 hover:bg-transparent hover:text-white">
              <ArrowLeft size={17} /> 返回市场
            </ButtonLink>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-line px-3 py-1 text-sm text-cyan-100">{app.category}</span>
              {(isOwner || isAdmin) && app.status !== "published" ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-700">{statusLabel(app.status)}</span>
              ) : null}
              <span className="text-sm text-slate-400">{formatDate(app.created_at)}</span>
            </div>
            <h1 className="font-display text-5xl font-semibold text-white">{app.name}</h1>
            <p className="mt-4 text-xl text-slate-300">{app.slogan}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span className="flex items-center gap-1"><Star size={17} className="text-amber-300" fill="currentColor" /> {app.avgRating.toFixed(1)} / {app.reviewCount} 条评价</span>
              <Link className="text-cyanGlow" href={`/profile/${app.creator_id}`}>by {app.profiles?.full_name || app.profiles?.username || initials(app.profiles?.id)}</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <ClaimAppButton
                appId={app.id}
                demoUrl={app.demo_url}
                signedIn={Boolean(viewer.user)}
                claimed={claimState.isClaimed}
                isOwner={isOwner}
              />
              {app.demo_url ? <ButtonLink href={app.demo_url} target="_blank" variant="secondary"><ExternalLink size={17} /> 查看演示</ButtonLink> : null}
              <FavoriteButton appId={app.id} count={favorite.favoriteCount} isFavorited={favorite.isFavorited} signedIn={Boolean(viewer.user)} />
              <ShareButton title={app.name} />
              {!isOwner ? <ReportAppButton appId={app.id} signedIn={Boolean(viewer.user)} /> : null}
              <RemixDialog appId={app.id} description={app.description} promptText={app.prompt_text} allowed={app.remix_allowed} />
              <TipDialog appId={app.id} signedIn={Boolean(viewer.user)} />
              {isOwner ? (
                <>
                  <ButtonLink href={`/create?edit=${app.id}`} variant="secondary"><Pencil size={17} /> 编辑</ButtonLink>
                  <DeleteAppButton appId={app.id} />
                </>
              ) : null}
            </div>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-line bg-slate-950 shadow-neon">
            {hero ? <Image src={hero} alt={app.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" /> : (
              <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_30%,rgba(103,232,249,.2),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(240,171,252,.18),transparent_35%)]">
                <span className="font-display text-6xl text-white/70">{app.name.slice(0, 2)}</span>
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1fr_340px] md:px-6">
        <div className="space-y-8">
          <div className="rounded-lg border border-line bg-panel p-5">
            <h2 className="font-display text-2xl font-semibold text-white">应用说明</h2>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{app.description}</div>
            {app.tech_stack?.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {app.tech_stack.map((tech) => <span key={tech} className="rounded-md border border-line bg-white/5 px-2 py-1 text-xs text-slate-300">{tech}</span>)}
              </div>
            ) : null}
          </div>
          <div className="rounded-lg border border-line bg-panel p-5">
            <h2 className="font-display text-2xl font-semibold text-white">评论</h2>
            <div className="mt-5">
              <ReviewForm
                appId={app.id}
                signedIn={Boolean(viewer.user)}
                canReview={canReview}
                reviewGateMessage={isOwner ? "不能给自己的应用写评论。" : "评论前需要先免费获取并实际使用这个应用。"}
              />
            </div>
            <div className="mt-6 space-y-4">
              {reviewsData.reviews.length ? reviewsData.reviews.map((review) => (
                <article key={review.id} className="rounded-md border border-line bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-white">{review.profiles?.full_name || review.profiles?.username || initials(review.user_id)}</span>
                    <span className="text-sm text-amber-300">{review.rating} / 5</span>
                  </div>
                  {review.comment ? <p className="mt-2 text-sm leading-6 text-slate-300">{review.comment}</p> : null}
                </article>
              )) : <EmptyState title="暂无评论" description="成为第一个分享使用体验的人。" />}
            </div>
          </div>
        </div>
        <aside className="space-y-6">
          <div className="rounded-lg border border-line bg-panel p-5">
            <h2 className="font-display text-xl font-semibold text-white">获取与反馈</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <CheckLine ok={Boolean(viewer.user)} label="登录后可领取应用、收藏与举报" />
              <CheckLine ok={claimState.isClaimed || isOwner || isAdmin} label="已获取后可评论并进入个人应用库" />
              <CheckLine ok={Boolean(claimState.lastOpenedAt || isOwner || isAdmin)} label="最近使用记录会同步到工作台" />
            </div>
            {claimState.isClaimed ? (
              <div className="mt-4 rounded-md border border-cyanGlow/30 bg-cyanGlow/10 p-4 text-sm text-cyan-50">
                <div className="flex items-center gap-2 font-medium">
                  <Download size={15} />
                  已加入应用库
                </div>
                <p className="mt-2 text-cyan-100/90">获取时间：{formatDate(claimState.claimedAt)}</p>
                <p className="mt-1 text-cyan-100/80">最近使用：{claimState.lastOpenedAt ? formatDate(claimState.lastOpenedAt) : "尚未打开"}</p>
              </div>
            ) : null}
          </div>
          <div className="rounded-lg border border-line bg-panel p-5">
            <h2 className="font-display text-xl font-semibold text-white">联系发布者</h2>
            <div className="mt-4 space-y-3 text-sm">
              {app.contact_info?.name ? <ContactLine icon={<UserRound size={16} />} label="联系人" value={app.contact_info.name} /> : null}
              {app.contact_info?.organization ? <ContactLine icon={<Building2 size={16} />} label="单位" value={app.contact_info.organization} /> : null}
              {app.contact_info?.email ? <ContactLine icon={<Mail size={16} />} label="邮箱" value={app.contact_info.email} href={`mailto:${app.contact_info.email}`} /> : null}
              {app.contact_info?.phone ? <ContactLine icon={<Phone size={16} />} label="电话" value={app.contact_info.phone} href={`tel:${app.contact_info.phone}`} /> : null}
              {!app.contact_info?.email && !app.contact_info?.phone ? <p className="text-slate-400">发布者暂未公开联系方式。</p> : null}
              {app.contact_info?.note ? <p className="rounded-md border border-line bg-white/[0.04] p-3 leading-6 text-slate-400">{app.contact_info.note}</p> : null}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-panel p-5">
            <h2 className="font-display text-xl font-semibold text-white">发布检查</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <CheckLine ok={Boolean(app.demo_url)} label="可访问演示地址" />
              <CheckLine ok={Boolean(app.screenshots?.length)} label="包含产品截图" />
              <CheckLine ok={Boolean(app.prompt_text)} label="公开提示词/生成说明" />
              <CheckLine ok={Boolean(app.remix_allowed)} label="允许 Remix 生态传播" />
            </div>
          </div>
          <div className="rounded-lg border border-line bg-panel p-5">
            <h2 className="font-display text-xl font-semibold text-white">Remix 链</h2>
            <div className="mt-4 space-y-3">
              {[...remixChain.parents, { id: app.id, name: app.name, slogan: "当前应用" }, ...remixChain.children].map((item, index) => (
                <Link key={`${item.id}-${index}`} href={`/apps/${item.id}`} className="block rounded-md border border-line bg-white/5 p-3 hover:border-cyanGlow/70">
                  <div className="text-sm font-medium text-white">{item.name}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.slogan}</div>
                </Link>
              ))}
            </div>
          </div>
          {app.screenshots?.length > 1 ? (
            <div className="rounded-lg border border-line bg-panel p-5">
              <h2 className="font-display text-xl font-semibold text-white">更多截图</h2>
              <div className="mt-4 grid gap-3">
                {app.screenshots.slice(1).map((src) => <AppImage key={src} src={src} alt={app.name} />)}
              </div>
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function ContactLine({ icon, label, value, href }: { icon: ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <>
      <span className="text-cyanGlow">{icon}</span>
      <span className="w-12 shrink-0 text-slate-400">{label}</span>
      <span className="truncate text-slate-700">{value}</span>
    </>
  );

  if (href) {
    return <a className="flex items-center gap-2 rounded-md border border-line bg-white/70 p-3 hover:border-cyanGlow" href={href}>{content}</a>;
  }

  return <div className="flex items-center gap-2 rounded-md border border-line bg-white/70 p-3">{content}</div>;
}

function CheckLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <ShieldCheck size={16} className={ok ? "text-mint" : "text-slate-500"} />
      <span className={ok ? "text-slate-200" : "text-slate-500"}>{label}</span>
    </div>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending_review: "审核中",
    published: "已发布",
    rejected: "已拒绝",
    flagged: "复核中"
  };
  return labels[status] ?? status;
}

function AppImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-line bg-slate-950">
      <Image src={src} alt={alt} fill className="object-cover" sizes="340px" />
    </div>
  );
}
