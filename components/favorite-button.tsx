"use client";

import { useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleFavorite } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function FavoriteButton({
  appId,
  isFavorited,
  count,
  signedIn
}: {
  appId: string;
  isFavorited: boolean;
  count: number;
  signedIn: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (!signedIn) {
      toast.error("请先登录后再收藏。");
      return;
    }

    const formData = new FormData();
    formData.set("app_id", appId);
    formData.set("next", `/apps/${appId}`);
    startTransition(async () => {
      const result = await toggleFavorite(formData);
      if (result?.error) toast.error(result.error);
      if (result?.ok) toast.success(isFavorited ? "已取消收藏。" : "已加入收藏。");
    });
  }

  return (
    <Button variant={isFavorited ? "primary" : "secondary"} onClick={onClick} disabled={isPending}>
      <Heart size={17} fill={isFavorited ? "currentColor" : "none"} />
      {isFavorited ? "已收藏" : "收藏"} {count}
    </Button>
  );
}
