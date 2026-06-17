"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("链接已复制。");
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button variant="secondary" onClick={onShare}>
      {copied ? <Check size={17} /> : <Share2 size={17} />}
      {copied ? "已复制" : "分享"}
    </Button>
  );
}
