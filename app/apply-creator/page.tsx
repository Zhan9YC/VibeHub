import { redirect } from "next/navigation";
import { ApplyCreatorForm } from "@/components/apply-creator-form";
import { ButtonLink } from "@/components/ui/button";
import { getLatestCreatorApplication, getViewer } from "@/lib/data";

export default async function ApplyCreatorPage() {
  const { user, profile } = await getViewer();
  if (!user) redirect("/login?redirect=/apply-creator");
  if (profile?.role === "creator" || profile?.role === "admin") redirect("/create");
  const application = await getLatestCreatorApplication(user.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <div className="apple-panel rounded-lg p-6 md:p-8">
        <p className="text-sm font-medium text-cyanGlow">Creator Program</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-slate-950">申请成为创作者</h1>
        <p className="mt-3 leading-7 text-slate-500">
          VibeHub 采用类似电商商家入驻的准入机制。申请、审核、结果反馈都通过站内数据库和管理员后台完成，不依赖邮件人工往返。
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <FlowStep title="1. 提交申请" text="填写准备发布的应用类型、目标用户与合规承诺。" />
          <FlowStep title="2. 后台审核" text="管理员在审核中心审批，并写入通过或拒绝说明。" />
          <FlowStep title="3. 获得权限" text="结果会同步到站内通知、申请页和个人资料页；通过后角色变成 creator。" />
        </div>
        <div className="mt-6">
          <ApplyCreatorForm application={application} />
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <ButtonLink href="/" variant="ghost" className="px-0">先浏览市场</ButtonLink>
          <ButtonLink href="/notifications" variant="ghost" className="px-0">查看站内通知</ButtonLink>
        </div>
      </div>
    </main>
  );
}

function FlowStep({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-line bg-white/70 p-4">
      <div className="font-medium text-slate-900">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
