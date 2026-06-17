"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function Dialog({
  open,
  onClose,
  title,
  children,
  className
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className={cn("w-full max-w-2xl rounded-lg border border-line bg-slate-950/95 p-5 shadow-neon", className)}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
          <Button variant="ghost" className="h-9 w-9 px-0" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
