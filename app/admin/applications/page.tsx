import { AdminApplicationReviewForm } from "@/components/admin-application-review-form";
import { AdminPageHeader } from "@/components/admin-page-header";
import { EmptyState } from "@/components/empty-state";
import { getCreatorApplications } from "@/lib/data";

export default async function AdminApplicationsPage() {
  const applications = await getCreatorApplications("pending");

  return (
    <>
      <AdminPageHeader title="创作者申请" description="审核普通用户提交的发布权限申请，并把处理结果回写到站内通知和资料页。" />
      {applications.length ? (
        <div className="space-y-4">
          {applications.map((application) => (
            <article key={application.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-pink">
              <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                <div>
                  <div className="font-semibold text-white">{application.profiles?.username ?? application.user_id}</div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{application.reason}</p>
                </div>
                <AdminApplicationReviewForm applicationId={application.id} userId={application.user_id} />
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyState title="没有待审批申请" description="用户提交申请后会出现在这里。" />}
    </>
  );
}
