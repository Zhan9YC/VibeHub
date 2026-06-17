"use client";

import { useState } from "react";
import { Check, Copy, GitFork } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function RemixDialog({ appId, description, promptText, allowed }: { appId: string; description?: string | null; promptText?: string | null; allowed?: boolean | null }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = promptText || description || "";

  async function copyPrompt() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} disabled={!allowed}><GitFork size={17} /> Remix</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Remix 这个应用">
        <div className="space-y-4">
          <div className="max-h-72 overflow-auto rounded-md border border-line bg-black/30 p-4 text-sm leading-6 text-slate-200 whitespace-pre-wrap">
            {text || "作者没有公开提示词或详细描述。"}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={copyPrompt} disabled={!text}>
              {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? "已复制" : "复制提示词"}
            </Button>
            <ButtonLink href={`/create?remix_from=${appId}`}>我已完成 Remix，发布</ButtonLink>
          </div>
        </div>
      </Dialog>
    </>
  );
}
