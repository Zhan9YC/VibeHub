"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { signIn, signInWithGoogleForm, signUp, verifySignUpOtp } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

type AuthFormProps = {
  mode: "login" | "register";
  redirectTo?: string;
};

function VerifySignUpForm({ email }: { email: string }) {
  const [state, formAction] = useFormState(verifySignUpOtp, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      <div className="rounded-md border border-cyanGlow/30 bg-cyanGlow/10 px-3 py-2 text-sm text-cyan-50">
        验证码已发送到 {email}
      </div>
      <div className="space-y-2">
        <Label htmlFor="token" className="text-slate-200">邮箱验证码</Label>
        <Input id="token" name="token" inputMode="numeric" autoComplete="one-time-code" placeholder="输入 6 位验证码" required />
      </div>
      {state?.error ? <p className="rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{state.error}</p> : null}
      <Button className="w-full" type="submit">完成注册</Button>
    </form>
  );
}

function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useFormState(signIn, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectTo ?? "/"} />
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-200">邮箱</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-200">密码</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" minLength={6} required />
      </div>
      {state?.error ? <p className="rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{state.error}</p> : null}
      <Button className="w-full" type="submit">登录</Button>
      <div className="relative py-2 text-center text-xs text-slate-500 before:absolute before:left-0 before:top-1/2 before:h-px before:w-[44%] before:bg-line after:absolute after:right-0 after:top-1/2 after:h-px after:w-[44%] after:bg-line">或</div>
      <button
        formAction={signInWithGoogleForm}
        formNoValidate
        className="inline-flex h-10 w-full items-center justify-center rounded-md border border-line bg-white/[0.08] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.14]"
      >
        使用 Google 继续
      </button>
    </form>
  );
}

function RegisterForm() {
  const [state, formAction] = useFormState(signUp, null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (state?.step === "verify") {
    return <VerifySignUpForm email={state.email} />;
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="origin" value={origin} />
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-200">邮箱</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-200">密码</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required />
      </div>
      {state?.error ? <p className="rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{state.error}</p> : null}
      <Button className="w-full" type="submit">发送验证码</Button>
      <div className="relative py-2 text-center text-xs text-slate-500 before:absolute before:left-0 before:top-1/2 before:h-px before:w-[44%] before:bg-line after:absolute after:right-0 after:top-1/2 after:h-px after:w-[44%] after:bg-line">或</div>
      <button
        formAction={signInWithGoogleForm}
        formNoValidate
        className="inline-flex h-10 w-full items-center justify-center rounded-md border border-line bg-white/[0.08] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.14]"
      >
        使用 Google 继续
      </button>
    </form>
  );
}

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  return mode === "login" ? <LoginForm redirectTo={redirectTo} /> : <RegisterForm />;
}
