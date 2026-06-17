import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CreateAppForm } from "@/components/create-app-form";
import { ButtonLink } from "@/components/ui/button";
import { getAppDetail, getViewer } from "@/lib/data";

export default async function CreatePage({ searchParams }: { searchParams: { remix_from?: string; edit?: string } }) {
  const { user, profile } = await getViewer();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/create${searchParams.remix_from ? `?remix_from=${searchParams.remix_from}` : ""}`)}`);
  if (!["creator", "admin"].includes(profile?.role ?? "user")) redirect("/apply-creator");
  const initialApp = searchParams.edit ? await getAppDetail(searchParams.edit) : undefined;
  if (initialApp && profile?.role !== "admin" && initialApp.creator_id !== user.id) redirect("/");

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 md:px-6">
      <div className="mb-8">
        <ButtonLink href="/" variant="ghost" className="mb-5 px-0 text-slate-300 hover:bg-transparent hover:text-white">
          <ArrowLeft size={17} /> 返回市场
        </ButtonLink>
        <h1 className="font-display text-4xl font-semibold text-white">{initialApp ? "编辑应用" : "发布应用"}</h1>
        <p className="mt-2 text-slate-400">
          {initialApp ? "保存修改后会重新进入审核，通过后才会公开展示。" : searchParams.remix_from ? "这个应用会自动记录 Remix 来源，提交后进入审核。" : "填写应用信息、截图、提示词和授权说明，提交后进入审核。"}
        </p>
      </div>
      <div className="apple-panel rounded-lg p-5 md:p-8">
        <CreateAppForm userId={user.id} remixFrom={searchParams.remix_from} initialApp={initialApp} />
      </div>
    </main>
  );
}
