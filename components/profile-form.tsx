"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) toast.error(result.error);
      if (result?.ok) toast.success("资料已更新。");
    });
  }

  return (
    <form action={onSubmit} className="grid gap-4 rounded-lg border border-line bg-white/[0.03] p-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>用户名</Label>
        <Input name="username" defaultValue={profile.username ?? ""} required />
      </div>
      <div className="space-y-2">
        <Label>显示名称</Label>
        <Input name="full_name" defaultValue={profile.full_name ?? ""} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>头像 URL</Label>
        <Input name="avatar_url" defaultValue={profile.avatar_url ?? ""} />
      </div>
      <div className="space-y-2">
        <Label>网站</Label>
        <Input name="website" defaultValue={profile.website ?? ""} />
      </div>
      <div className="space-y-2">
        <Label>Twitter / X</Label>
        <Input name="twitter" defaultValue={profile.twitter ?? ""} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>简介</Label>
        <Textarea name="bio" defaultValue={profile.bio ?? ""} />
      </div>
      <Button disabled={isPending}>{isPending ? "保存中..." : "保存资料"}</Button>
    </form>
  );
}
