"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Download, ExternalLink, Lock } from "lucide-react";
import { toast } from "sonner";
import { claimApp, markAppOpened } from "@/lib/actions";
import { Button } from "@/components/ui/button";

type ClaimAppButtonProps = {
  appId: string;
  demoUrl: string | null;
  signedIn: boolean;
  claimed: boolean;
  isOwner?: boolean;
  compact?: boolean;
};

export function ClaimAppButton({ appId, demoUrl, signedIn, claimed, isOwner = false, compact = false }: ClaimAppButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClaim() {
    if (!signedIn) {
      toast.error("请先登录，再领取应用。");
      router.push(`/login?redirect=/apps/${appId}`);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("app_id", appId);
      const result = await claimApp(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result?.message ?? "已加入你的应用库。");
      router.refresh();
    });
  }

  function handleOpen() {
    if (!demoUrl) {
      toast.error("当前应用还没有可打开的地址。");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("app_id", appId);
      const result = await markAppOpened(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      window.location.href = result?.url ?? demoUrl;
    });
  }

  if (isOwner) {
    return (
      <Button variant="secondary" disabled className={compact ? "h-9 px-3" : undefined}>
        <Lock size={compact ? 15 : 17} />
        自有作品
      </Button>
    );
  }

  if (claimed) {
    return (
      <Button onClick={handleOpen} disabled={isPending || !demoUrl} className={compact ? "h-9 px-3" : undefined}>
        <ExternalLink size={compact ? 15 : 17} />
        {isPending ? "正在打开..." : demoUrl ? "打开应用" : "待提供地址"}
      </Button>
    );
  }

  return (
    <Button onClick={handleClaim} disabled={isPending} className={compact ? "h-9 px-3" : undefined}>
      <Download size={compact ? 15 : 17} />
      {isPending ? "领取中..." : "免费获取"}
    </Button>
  );
}
