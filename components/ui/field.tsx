import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-slate-700", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-line bg-white/90 px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyanGlow focus:ring-4 focus:ring-sky-100",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-md border border-line bg-white/90 px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyanGlow focus:ring-4 focus:ring-sky-100",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-md border border-line bg-white/90 px-3 text-sm text-slate-950 outline-none transition focus:border-cyanGlow focus:ring-4 focus:ring-sky-100",
        className
      )}
      {...props}
    />
  );
}
