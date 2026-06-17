"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { submitReview } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/field";

export function ReviewForm({
  appId,
  signedIn,
  canReview = true,
  reviewGateMessage
}: {
  appId: string;
  signedIn: boolean;
  canReview?: boolean;
  reviewGateMessage?: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!signedIn) {
    return <p className="rounded-md border border-line bg-white/5 p-4 text-sm text-slate-300">登录后可以提交评分与评论。</p>;
  }

  if (!canReview) {
    return <p className="rounded-md border border-line bg-white/5 p-4 text-sm text-slate-300">{reviewGateMessage ?? "请先获取并实际使用应用，再提交评分与评论。"}</p>;
  }

  function onSubmit(formData: FormData) {
    formData.set("app_id", appId);
    formData.set("rating", String(rating));
    startTransition(async () => {
      const result = await submitReview(formData);
      if (result?.error) toast.error(result.error);
      if (result?.ok) {
        toast.success("评论已发布。");
        setComment("");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-lg border border-line bg-white/[0.03] p-4">
      <div className="space-y-2">
        <Label>评分</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" onClick={() => setRating(value)} className="text-amber-300" aria-label={`${value} 星`}>
              <Star size={22} fill={value <= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>评论</Label>
        <Textarea name="comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="分享你实际使用后的体验。" />
      </div>
      <Button disabled={isPending}>{isPending ? "提交中..." : "提交评论"}</Button>
    </form>
  );
}
