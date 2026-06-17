import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-cyanGlow text-slate-950 shadow-neon hover:bg-sky-400 hover:text-slate-950",
  secondary: "border border-line bg-white/80 text-slate-800 hover:bg-sky-50",
  ghost: "text-slate-600 hover:bg-sky-50 hover:text-slate-950",
  danger: "border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyanGlow/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-55",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: Variant; children: ReactNode }) {
  return (
    <Link
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyanGlow/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
