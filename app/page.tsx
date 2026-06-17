import { Suspense } from "react";
import Link from "next/link";
import { AppCard } from "@/components/app-card";
import { AppFilters } from "@/components/app-filters";
import { EmptyState } from "@/components/empty-state";
import { Hero } from "@/components/hero";
import { Pagination } from "@/components/pagination";
import { SetupNotice } from "@/components/setup-notice";
import { categories } from "@/lib/constants";
import { getApps, getMarketplaceStats, getSetupStatus, getWeeklyHotApps } from "@/lib/data";

export default async function Home({
  searchParams
}: {
  searchParams: { q?: string; category?: string; sort?: string; page?: string };
}) {
  const [{ apps, page, pageCount }, hotApps, stats, setup] = await Promise.all([
    getApps(searchParams),
    getWeeklyHotApps(),
    getMarketplaceStats(),
    getSetupStatus()
  ]);

  return (
    <main>
      <Hero />
      <SetupNotice {...setup} />

      <section className="border-b border-line bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-4 md:px-6">
          <Stat label="应用" value={stats.appCount} />
          <Stat label="创造者" value={stats.creatorCount} />
          <Stat label="评论" value={stats.reviewCount} />
          <Stat label="Remix" value={stats.remixCount} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[1fr_320px] md:px-6">
        <div>
          <div className="mb-8 rounded-lg border border-line bg-panel p-4 shadow-pink backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-white">按场景探索</h2>
              <Link href="/apply-creator" className="text-sm font-medium text-cyanGlow transition hover:text-cyan-200">
                申请发布权限
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/?category=${encodeURIComponent(category)}`}
                  className="rounded-md border border-line bg-white/[0.05] px-3 py-2 text-sm text-slate-200 transition duration-200 hover:-translate-y-0.5 hover:border-cyanGlow/70 hover:bg-white/[0.1] hover:text-white"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold text-white">探索应用</h2>
              <p className="mt-2 text-sm text-slate-400">
                按分类、评分和 Remix 热度发现可直接使用或继续二次创作的应用。
              </p>
            </div>
            <Suspense fallback={null}>
              <AppFilters />
            </Suspense>
          </div>

          {apps.length ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {apps.map((app) => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
              <Pagination page={page} pageCount={pageCount} />
            </>
          ) : (
            <EmptyState
              title="还没有匹配的应用"
              description="换一个搜索词，或发布第一个 Vibe 应用。"
            />
          )}
        </div>

        <aside>
          <div className="sticky top-24 space-y-5">
            <div className="rounded-lg border border-line bg-panel p-5 shadow-pink backdrop-blur">
              <h2 className="font-display text-xl font-semibold text-white">创作路径</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <Step
                  index="1"
                  title="申请与发布"
                  text="先通过创作者审核，再提交截图、演示地址和提示词。"
                />
                <Step
                  index="2"
                  title="免费获取"
                  text="用户像领取免费商品一样把应用加入自己的应用库。"
                />
                <Step
                  index="3"
                  title="反馈与治理"
                  text="收藏、评论、举报和 Remix 一起形成后续运营闭环。"
                />
              </div>
            </div>

            <div className="rounded-lg border border-line bg-panel p-5 shadow-pink backdrop-blur">
              <h2 className="font-display text-xl font-semibold text-white">本周最火</h2>
              <div className="mt-4 space-y-3">
                {hotApps.length ? (
                  hotApps.map((app) => <AppCard key={app.id} app={app} compact />)
                ) : (
                  <p className="text-sm text-slate-400">本周还没有足够的评分数据。</p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="font-display text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

function Step({ index, title, text }: { index: string; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-line bg-white/[0.03] p-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyanGlow text-sm font-bold text-slate-950">
        {index}
      </span>
      <div>
        <div className="font-medium text-white">{title}</div>
        <p className="mt-1 text-slate-400">{text}</p>
      </div>
    </div>
  );
}
