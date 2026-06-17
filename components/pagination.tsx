import Link from "next/link";

export function Pagination({ page, pageCount, base = "/" }: { page: number; pageCount: number; base?: string }) {
  if (pageCount <= 1) return null;
  const prev = Math.max(page - 1, 1);
  const next = Math.min(page + 1, pageCount);

  return (
    <nav className="mt-8 flex items-center justify-center gap-3 text-sm">
      <Link className="rounded-md border border-line px-3 py-2 text-slate-200 hover:bg-white/[0.1]" href={`${base}?page=${prev}`}>上一页</Link>
      <span className="text-slate-400">{page} / {pageCount}</span>
      <Link className="rounded-md border border-line px-3 py-2 text-slate-200 hover:bg-white/[0.1]" href={`${base}?page=${next}`}>下一页</Link>
    </nav>
  );
}
