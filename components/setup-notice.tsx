import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Database } from "lucide-react";

export function SetupNotice({
  supabaseConfigured,
  schemaReady,
  message
}: {
  supabaseConfigured: boolean;
  schemaReady: boolean;
  message: string;
}) {
  if (supabaseConfigured && schemaReady) return null;

  return (
    <section className="border-b border-amber-300/20 bg-amber-300/[0.08]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-sm md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-start gap-3 text-amber-50">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-300" size={18} />
          <div>
            <div className="font-medium">环境尚未完全就绪</div>
            <p className="mt-1 text-amber-100/80">{message}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill ok={supabaseConfigured} icon={<Database size={14} />} label="Supabase" />
          <StatusPill ok={schemaReady} icon={<CheckCircle2 size={14} />} label="数据库迁移" />
        </div>
      </div>
    </section>
  );
}

function StatusPill({ ok, icon, label }: { ok: boolean; icon: ReactNode; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${ok ? "border-mint/30 bg-mint/10 text-mint" : "border-amber-300/30 bg-amber-300/10 text-amber-100"}`}>
      {icon}
      {label}
    </span>
  );
}
