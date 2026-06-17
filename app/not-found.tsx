import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-4xl font-semibold text-white">没有找到内容</h1>
      <p className="mt-3 text-slate-400">应用或资料可能已被删除，或者链接不正确。</p>
      <ButtonLink href="/" className="mt-6">返回首页</ButtonLink>
    </main>
  );
}
