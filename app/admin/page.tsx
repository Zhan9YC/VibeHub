import Link from "next/link";
import { Bell, ClipboardCheck, Flag, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { AdminPageHeader } from "@/components/admin-page-header";
import { EmptyState } from "@/components/empty-state";
import { getAdminConsoleSummary, getCreatorApplications, getReports, getReviewQueue } from "@/lib/data";

export default async function AdminOverviewPage() {
  const [summary, reviewQueue, applications, reports] = await Promise.all([
    getAdminConsoleSummary(),
    getReviewQueue(),
    getCreatorApplications("pending"),
    getReports()
  ]);

  return (
    <>
      <AdminPageHeader
        title="管理总览"
        description="这是管理员专用后台。你在这里处理创作者入驻、应用上架审核、举报复核，并通过站内通知把处理结果反馈给用户。"
      />

      <section className="grid gap-4 md:grid-cols-4">
        <OverviewCard icon={<ClipboardCheck size={18} />} label="待审应用" value={summary.reviewQueueCount} href="/admin/apps" />
        <OverviewCard icon={<ShieldCheck size={18} />} label="创作者申请" value={summary.pendingApplicationCount} href="/admin/applications" />
        <OverviewCard icon={<Flag size={18} />} label="开放举报" value={summary.openReportCount} href="/admin/reports" />
        <OverviewCard icon={<Bell size={18} />} label="未读通知" value={summary.unreadNotificationCount} href="/notifications" />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <QueuePanel
          title="应用审核"
          href="/admin/apps"
          emptyTitle="没有待审核应用"
          emptyDescription="新提交或被举报的应用会出现在这里。"
          items={reviewQueue.slice(0, 5).map((app) => ({
            id: app.id,
            title: app.name,
            meta: `${app.status} · ${app.category}`,
            href: `/apps/${app.id}`
          }))}
        />
        <QueuePanel
          title="创作者申请"
          href="/admin/applications"
          emptyTitle="没有待审批申请"
          emptyDescription="用户申请发布权限后会出现在这里。"
          items={applications.slice(0, 5).map((application) => ({
            id: application.id,
            title: application.profiles?.username ?? application.user_id,
            meta: application.reason ?? "未填写申请理由",
            href: "/admin/applications"
          }))}
        />
        <QueuePanel
          title="举报处理"
          href="/admin/reports"
          emptyTitle="没有待处理举报"
          emptyDescription="用户举报内容时，这里会出现复核任务。"
          items={reports.filter((report) => report.status === "open").slice(0, 5).map((report) => ({
            id: report.id,
            title: report.apps?.name ?? report.app_id,
            meta: report.reason,
            href: "/admin/reports"
          }))}
        />
      </section>
    </>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  href
}: {
  icon: ReactNode;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-pink transition duration-200 hover:-translate-y-0.5 hover:border-cyanGlow/25 hover:bg-white/[0.06]"
    >
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyanGlow/20 bg-cyanGlow/10 text-cyanGlow">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-4 font-display text-4xl font-semibold text-white">{value}</div>
    </Link>
  );
}

function QueuePanel({
  title,
  href,
  emptyTitle,
  emptyDescription,
  items
}: {
  title: string;
  href: string;
  emptyTitle: string;
  emptyDescription: string;
  items: { id: string; title: string; meta: string; href: string }[];
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-pink">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
        <Link href={href} className="text-sm font-medium text-cyanGlow transition hover:text-cyan-200">
          查看全部
        </Link>
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-cyanGlow/25 hover:bg-white/[0.06]"
            >
              <div className="text-sm font-semibold text-white">{item.title}</div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{item.meta}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </section>
  );
}
