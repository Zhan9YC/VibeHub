import { Download, ExternalLink, GitFork, Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { AppWithStats } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function AppCard({ app, compact = false }: { app: AppWithStats; compact?: boolean }) {
  const image = app.screenshots?.[0];
  return (
    <Link
      href={`/apps/${app.id}`}
      className={cn(
        "group interactive-lift block overflow-hidden rounded-lg border border-line bg-panel shadow-pink backdrop-blur transition duration-300 hover:border-cyanGlow/70 hover:bg-slate-900/[0.85] hover:shadow-neon",
        compact && "grid grid-cols-[88px_1fr]"
      )}
    >
      <div className={cn("relative overflow-hidden bg-slate-900", compact ? "h-full min-h-24" : "aspect-[16/10]")}>
        {image ? (
          <Image src={image} alt={app.name} fill className="object-cover transition group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="flex h-full items-center justify-center soft-highlight">
            <span className="font-display text-3xl font-semibold text-white/70">{app.name.slice(0, 2)}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-line px-2 py-1 text-xs text-cyan-100">{app.category}</span>
            {app.status !== "published" ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">{statusLabel(app.status)}</span>
            ) : null}
          </div>
          <span className="text-xs text-slate-400">{formatDate(app.created_at)}</span>
        </div>
        <h3 className="font-display text-lg font-semibold text-white">{app.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-300">{app.slogan || app.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {app.demo_url ? <Badge icon={<ExternalLink size={12} />} label="可试用" /> : null}
          {app.remix_allowed ? <Badge icon={<GitFork size={12} />} label="可 Remix" /> : null}
          {app.claimCount > 0 ? <Badge icon={<Download size={12} />} label={`获取 ${app.claimCount}`} /> : null}
          {app.license ? <Badge label={app.license} /> : null}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
          <span className="flex items-center gap-1"><Star size={15} className="text-amber-300" /> {app.avgRating.toFixed(1)} ({app.reviewCount})</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Heart size={15} className="text-pinkGlow" /> {app.favoriteCount}</span>
            <span className="flex items-center gap-1"><GitFork size={15} className="text-cyanGlow" /> {app.remixCount}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending_review: "审核中",
    published: "已发布",
    rejected: "已拒绝",
    flagged: "复核中"
  };
  return labels[status] ?? status;
}

function Badge({ label, icon }: { label: string; icon?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-line bg-white/[0.04] px-2 py-1 text-xs text-slate-300">
      {icon}
      {label}
    </span>
  );
}
