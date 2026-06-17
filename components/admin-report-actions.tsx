"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { resolveReport } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function AdminReportActions({
  reportId,
  appId
}: {
  reportId: string;
  appId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function submit(resolution: "resolved" | "dismissed") {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("report_id", reportId);
      formData.set("app_id", appId);
      formData.set("resolution", resolution);

      const result = await resolveReport(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (result?.warning) {
        toast.warning(result.warning);
      } else {
        toast.success(resolution === "resolved" ? "已确认违规并完成处置。" : "已驳回举报。");
      }

      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Button type="button" disabled={isPending} onClick={() => submit("resolved")} variant="danger">
        确认违规
      </Button>
      <Button type="button" disabled={isPending} onClick={() => submit("dismissed")} variant="secondary">
        驳回举报
      </Button>
    </div>
  );
}
