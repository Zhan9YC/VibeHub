"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { applyCreator } from "@/lib/actions";
import type { CreatorApplication } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/field";

export function ApplyCreatorForm({ application }: { application?: CreatorApplication | null }) {
  const [state, formAction] = useFormState(applyCreator, null);
  const isPending = application?.status === "pending";

  useEffect(() => {
    if (state?.message) toast.success(state.message);
  }, [state?.message]);

  return (
    <form action={formAction} className="space-y-4">
      {application ? (
        <div className="rounded-md border border-line bg-white/70 px-4 py-3 text-sm text-slate-700">
          <p>
            当前申请状态：
            <span className="ml-2 font-semibold">{applicationStatusLabel(application.status)}</span>
          </p>
          {application.review_note ? (
            <p className="mt-2 leading-6 text-slate-600">审核说明：{application.review_note}</p>
          ) : null}
          <p className="mt-2 text-slate-500">处理结果会同步写入站内通知和个人资料页。</p>
          {isPending ? (
            <p className="mt-2 text-slate-500">待审核期间不能重复提交，管理员处理后这里会更新结果。</p>
          ) : null}
        </div>
      ) : null}
      <div className="space-y-2">
        <Label>申请理由</Label>
        <Textarea
          name="reason"
          disabled={isPending}
          required
          placeholder="说明你计划发布的应用类型、目标用户、合规承诺，以及为什么适合成为创作者。"
        />
      </div>
      {state?.error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
      <Button disabled={isPending} type="submit">{application?.status === "rejected" ? "重新提交申请" : "提交申请"}</Button>
    </form>
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
