import Link from "next/link";
import { AdminAppReviewActions } from "@/components/admin-app-review-actions";
import { AdminPageHeader } from "@/components/admin-page-header";
import { EmptyState } from "@/components/empty-state";
import { getReviewQueue } from "@/lib/data";

export default async function AdminAppsPage() {
  const apps = await getReviewQueue();

  return (
    <>
      <AdminPageHeader title="应用审核" description="审核待发布和被举报的应用。通过后公开展示，拒绝后仅创作者和管理员可见。" />
      {apps.length ? (
        <div className="space-y-4">
          {apps.map((app) => (
            <article key={app.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-pink">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyanGlow/15 px-2.5 py-1 text-xs text-cyan-100">{app.status}</span>
                    <span className="text-sm text-slate-400">{app.category}</span>
                  </div>
                  <Link href={`/apps/${app.id}`} className="mt-2 block font-display text-2xl font-semibold text-white">{app.name}</Link>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{app.description}</p>
                  <p className="mt-3 text-sm text-slate-500">发布者：{app.profiles?.username ?? app.creator_id}</p>
                </div>
                <AdminAppReviewActions
                  appId={app.id}
                  appName={app.name}
                  creatorId={app.creator_id}
                  canBanCreator={app.profiles?.role === "creator"}
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="没有待审核应用" description="新的发布和被举报应用会出现在这里。" />
      )}
    </>
  );
}
