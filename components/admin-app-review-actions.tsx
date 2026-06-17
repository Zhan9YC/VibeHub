"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { approveApp, banCreator, rejectApp } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function AdminAppReviewActions({
  appId,
  appName,
  creatorId,
  canBanCreator
}: {
  appId: string;
  appName: string;
  creatorId: string;
  canBanCreator: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function submit(action: "approve" | "reject" | "ban") {
    if (action === "ban" && !window.confirm(`确认封禁创作者并限制 ${appName} 的发布方账号吗？`)) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();

      if (action === "ban") {
        formData.set("user_id", creatorId);
        formData.set("banned", "true");
      } else {
        formData.set("app_id", appId);
      }

      const result = action === "approve"
        ? await approveApp(formData)
        : action === "reject"
          ? await rejectApp(formData)
          : await banCreator(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (result?.warning) {
        toast.warning(result.warning);
      } else {
        toast.success(
          action === "approve"
            ? "应用已通过审核。"
            : action === "reject"
              ? "应用已驳回。"
              : "创作者已封禁。"
        );
      }

      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Button type="button" disabled={isPending} onClick={() => submit("approve")}>
        通过
      </Button>
      <Button type="button" disabled={isPending} onClick={() => submit("reject")} variant="danger">
        拒绝
      </Button>
      {canBanCreator ? (
        <Button type="button" disabled={isPending} onClick={() => submit("ban")} variant="danger">
          封禁创作者
        </Button>
      ) : null}
    </div>
  );
}
