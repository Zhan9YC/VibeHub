import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminReportActions } from "@/components/admin-report-actions";
import { getReports } from "@/lib/data";
import { EmptyState } from "@/components/empty-state";

export default async function AdminReportsPage() {
  const reports = await getReports();

  return (
    <>
      <AdminPageHeader title="举报管理" description="处理用户举报。确认违规会下架应用，驳回则恢复公开，并把结果发送给举报人和创作者。" />
      {reports.length ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <article key={report.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-pink">
              <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-xs text-rose-100">{report.status}</span>
                    <Link className="font-semibold text-white" href={`/apps/${report.app_id}`}>{report.apps?.name ?? report.app_id}</Link>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{report.reason}</p>
                  <p className="mt-2 text-xs text-slate-500">举报人：{report.profiles?.username ?? report.reporter_id}</p>
                </div>
                <AdminReportActions reportId={report.id} appId={report.app_id} />
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyState title="没有举报记录" description="用户举报应用后会出现在这里。" />}
    </>
  );
}
