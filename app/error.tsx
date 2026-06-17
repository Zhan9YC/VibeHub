"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-3xl font-semibold text-white">页面加载失败</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-cyanGlow px-4 text-sm font-semibold text-slate-950 shadow-neon transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyanGlow/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        重试
      </button>
    </main>
  );
}
