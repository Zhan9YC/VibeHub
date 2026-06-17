export function AdminPageHeader({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-pink backdrop-blur">
      <p className="text-sm font-medium text-cyan-100">Admin Console</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-white md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{description}</p>
    </header>
  );
}
