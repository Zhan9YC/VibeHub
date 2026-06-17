"use client";

import { useState, useTransition } from "react";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import { createTip } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function TipDialog({ appId, signedIn }: { appId: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function tip(amount: number) {
    if (!signedIn) {
      toast.error("请先登录。");
      return;
    }
    const formData = new FormData();
    formData.set("app_id", appId);
    formData.set("amount", String(amount));
    startTransition(async () => {
      const result = await createTip(formData);
      if (result?.error) toast.error(result.error);
      if (result?.message) toast.success(result.message);
      if (result?.ok) setOpen(false);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}><Gift size={17} /> 打赏</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="支持创造者">
        <div className="grid gap-3 sm:grid-cols-3">
          {[3, 9, 19].map((amount) => (
            <Button key={amount} variant="secondary" disabled={isPending} onClick={() => tip(amount)}>
              ${amount}
            </Button>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-400">Stripe Connect 尚未接入，当前会先记录打赏意向。</p>
      </Dialog>
    </>
  );
}
