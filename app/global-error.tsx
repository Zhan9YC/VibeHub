"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background font-sans antialiased">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-cyanGlow">VibeHub</p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-white">页面渲染失败</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {error.message || "页面在渲染时发生异常，已阻止界面继续损坏。"}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyanGlow px-4 text-sm font-semibold text-slate-950 shadow-neon transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyanGlow/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              onClick={reset}
              type="button"
            >
              重试
            </button>
            <a
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white/80 px-4 text-sm font-semibold text-slate-800 transition hover:bg-sky-50"
            >
              返回首页
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
