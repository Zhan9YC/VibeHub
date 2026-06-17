import { Clock3, ExternalLink, PackageCheck } from "lucide-react";
import Link from "next/link";
import type { AppClaim } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ClaimAppButton } from "@/components/claim-app-button";
import { ButtonLink } from "@/components/ui/button";

export function LibraryCard({ claim }: { claim: AppClaim }) {
  if (!claim.app) return null;

  return (
    <article className="group overflow-hidden rounded-lg border border-line bg-panel shadow-pink backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cyanGlow/60 hover:shadow-neon">
      <div className="soft-highlight border-b border-line p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyanGlow/20 bg-cyanGlow/10 px-3 py-1 text-xs font-medium text-cyan-100">
              <PackageCheck size={14} />
              已获取
            </div>
            <h3 className="mt-4 font-display text-2xl font-semibold text-white">{claim.app.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{claim.app.slogan || claim.app.description}</p>
          </div>
          <span className="rounded-full border border-line px-3 py-1 text-xs text-slate-300">{claim.app.category}</span>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <MetaLine label="获取时间" value={formatDate(claim.created_at)} />
          <MetaLine label="最近使用" value={claim.last_opened_at ? formatDate(claim.last_opened_at) : "尚未打开"} />
        </div>
        <div className="flex flex-wrap gap-3">
          <ClaimAppButton appId={claim.app.id} demoUrl={claim.app.demo_url} signedIn claimed compact />
          <ButtonLink href={`/apps/${claim.app.id}`} variant="secondary" className="h-9 px-3">
            <ExternalLink size={15} />
            查看详情
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-white/[0.04] p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-slate-500">
        <Clock3 size={13} />
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}
