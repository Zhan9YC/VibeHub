"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-8 shadow-pink backdrop-blur">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-300/30 bg-rose-400/15 text-rose-100">
        <AlertTriangle size={26} />
      </div>
      <p className="mt-6 text-sm font-medium tracking-[0.22em] text-rose-100/80">ADMIN ERROR</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-white">管理台数据加载失败</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200/85">
        当前页面没有成功拿到后台数据。你可以先重试；如果问题持续存在，再检查 Supabase 表结构、RLS 和当前账号权限。
      </p>
      <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-slate-300">
        {error.message || "发生了未预期的管理台错误。"}
      </p>
      {error.digest ? (
        <p className="mt-3 text-xs text-slate-400">诊断标识：{error.digest}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyanGlow px-4 text-sm font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:bg-sky-400 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyanGlow/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <RefreshCw size={16} />
          重新加载
        </button>
        <Link
          href="/admin"
          className="inline-flex h-10 items-center justify-center rounded-md border border-white/15 bg-white/[0.05] px-4 text-sm font-semibold text-slate-100 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.09]"
        >
          返回管理首页
        </Link>
      </div>
    </div>
  );
}
