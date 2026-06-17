"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { reportApp } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/field";

export function ReportAppButton({ appId, signedIn }: { appId: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    if (!signedIn) {
      toast.error("请先登录后再举报。");
      return;
    }
    const formData = new FormData();
    formData.set("app_id", appId);
    formData.set("reason", reason);
    startTransition(async () => {
      const result = await reportApp(formData);
      if (result?.error) toast.error(result.error);
      if (result?.message) {
        toast.success(result.message);
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}><Flag size={17} /> 举报</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="举报应用">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>举报原因</Label>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="请说明违规、侵权、欺诈或其他风险。" />
          </div>
          <Button onClick={onSubmit} disabled={isPending}>{isPending ? "提交中..." : "提交举报"}</Button>
        </div>
      </Dialog>
    </>
  );
}
