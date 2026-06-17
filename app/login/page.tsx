import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage({ searchParams }: { searchParams: { redirect?: string; registered?: string } }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-lg border border-line bg-panel p-6 shadow-neon backdrop-blur">
        <h1 className="font-display text-3xl font-semibold text-white">登录 VibeHub</h1>
        <p className="mt-2 text-sm text-slate-400">{searchParams.registered ? "注册成功，请登录。" : "继续发布、评论和 Remix 应用。"}</p>
        <div className="mt-6">
          <AuthForm mode="login" redirectTo={searchParams.redirect ?? "/"} />
        </div>
        <p className="mt-5 text-sm text-slate-400">还没有账号？ <Link className="text-cyanGlow" href="/register">注册</Link></p>
      </div>
    </main>
  );
}
