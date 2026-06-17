import { Sparkles } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white/[0.03] p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-cyanGlow/30 bg-cyanGlow/10 text-cyanGlow">
        <Sparkles size={24} />
      </div>
      <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{description}</p>
    </div>
  );
}
