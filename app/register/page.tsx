import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-lg border border-line bg-panel p-6 shadow-neon backdrop-blur">
        <h1 className="font-display text-3xl font-semibold text-white">创建账号</h1>
        <p className="mt-2 text-sm text-slate-400">先发送邮箱验证码，验证通过后完成注册。</p>
        <div className="mt-6">
          <AuthForm mode="register" />
        </div>
        <p className="mt-5 text-sm text-slate-400">已有账号？ <Link className="text-cyanGlow" href="/login">登录</Link></p>
      </div>
    </main>
  );
}
