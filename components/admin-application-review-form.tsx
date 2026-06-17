"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { approveApplication, rejectApplication } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/field";

export function AdminApplicationReviewForm({
  applicationId,
  userId
}: {
  applicationId: string;
  userId: string;
}) {
  const [reviewNote, setReviewNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(decision: "approve" | "reject") {
    const formData = new FormData();
    formData.set("application_id", applicationId);
    formData.set("user_id", userId);
    formData.set("review_note", reviewNote);

    startTransition(async () => {
      try {
        const result = decision === "approve"
          ? await approveApplication(formData)
          : await rejectApplication(formData);

        if (result?.error) {
          toast.error(result.error);
          return;
        }

        setReviewNote("");
        if (result?.warning) {
          toast.warning(result.warning);
        } else if (result?.message) {
          toast.success(result.message);
        } else {
          toast.success(decision === "approve" ? "已批准创作者申请。" : "已拒绝创作者申请。");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "审批操作失败，请稍后重试。");
      }
    });
  }

  return (
    <div className="w-full max-w-md space-y-3">
      <div className="space-y-2">
        <Label className="text-slate-700">审核说明</Label>
        <Textarea
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          className="min-h-24"
          placeholder="批准时可选填说明；拒绝时必须填写原因，用户会在申请页和资料页看到。"
        />
      </div>
      <div className="flex gap-2">
        <Button disabled={isPending} onClick={() => submit("approve")} type="button">批准</Button>
        <Button disabled={isPending} onClick={() => submit("reject")} type="button" variant="danger">拒绝</Button>
      </div>
    </div>
  );
}
