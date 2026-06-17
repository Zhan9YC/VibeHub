"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteApp } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function DeleteAppButton({ appId }: { appId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    const formData = new FormData();
    formData.set("app_id", appId);
    startTransition(async () => {
      const result = await deleteApp(formData);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}><Trash2 size={17} /> 删除</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="确认删除应用">
        <p className="text-sm leading-6 text-slate-300">删除后应用、评论、Remix 关系和打赏记录都会根据数据库外键级联删除。</p>
        <div className="mt-5 flex gap-3">
          <Button variant="danger" onClick={onDelete} disabled={isPending}>{isPending ? "删除中..." : "确认删除"}</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>取消</Button>
        </div>
      </Dialog>
    </>
  );
}
