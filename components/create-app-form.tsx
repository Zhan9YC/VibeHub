"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { FormEvent, ReactNode } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ShieldCheck, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createApp, updateApp } from "@/lib/actions";
import { appSchema } from "@/lib/schemas";
import { categories, licenses, techStacks } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import type { AppRecord } from "@/lib/types";

type AppInput = z.infer<typeof appSchema>;
type AppFieldName = keyof AppInput;

const watchedValidationFields: AppFieldName[] = ["name", "description", "contact_email", "contact_phone"];
const syncableFields: AppFieldName[] = [
  "name",
  "slogan",
  "description",
  "category",
  "tech_stack",
  "license",
  "screenshots",
  "demo_url",
  "prompt_text",
  "remix_allowed",
  "remix_license",
  "contact_name",
  "contact_email",
  "contact_phone",
  "organization",
  "publisher_type",
  "age_range",
  "gender",
  "preferred_contact",
  "contact_note",
  "community_guidelines"
];

const fieldLabels: Partial<Record<keyof AppInput, string>> = {
  name: "应用名称",
  slogan: "一句话标语",
  description: "完整描述",
  category: "分类",
  license: "许可证",
  demo_url: "演示地址",
  prompt_text: "提示词 / 生成说明",
  remix_license: "Remix 授权说明",
  contact_name: "联系人",
  contact_email: "联系邮箱",
  contact_phone: "手机 / 电话",
  organization: "单位 / 公司",
  publisher_type: "发布主体",
  preferred_contact: "优先联系方式",
  age_range: "年龄段",
  gender: "性别",
  contact_note: "联系备注",
  community_guidelines: "社区准则"
};

export function CreateAppForm({ userId, remixFrom, initialApp }: { userId: string; remixFrom?: string; initialApp?: AppRecord }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [screenshots, setScreenshots] = useState<string[]>(initialApp?.screenshots ?? []);
  const [selectedTech, setSelectedTech] = useState<string[]>(initialApp?.tech_stack ?? []);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<AppInput>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(appSchema),
    defaultValues: {
      name: initialApp?.name ?? "",
      slogan: initialApp?.slogan ?? "",
      description: initialApp?.description ?? "",
      category: (initialApp?.category as AppInput["category"] | undefined) ?? categories[0],
      tech_stack: (initialApp?.tech_stack ?? []) as AppInput["tech_stack"],
      license: (initialApp?.license ?? "") as AppInput["license"],
      screenshots: initialApp?.screenshots ?? [],
      demo_url: initialApp?.demo_url ?? "",
      prompt_text: initialApp?.prompt_text ?? "",
      remix_allowed: initialApp?.remix_allowed ?? true,
      remix_license: initialApp?.remix_license ?? "",
      contact_name: initialApp?.contact_info?.name ?? "",
      contact_email: initialApp?.contact_info?.email ?? "",
      contact_phone: initialApp?.contact_info?.phone ?? "",
      organization: initialApp?.contact_info?.organization ?? "",
      publisher_type: initialApp?.contact_info?.publisher_type ?? "personal",
      age_range: (initialApp?.contact_info?.age_range ?? "") as AppInput["age_range"],
      gender: (initialApp?.contact_info?.gender ?? "") as AppInput["gender"],
      preferred_contact: initialApp?.contact_info?.preferred_contact === "phone" ? "phone" : "email",
      contact_note: initialApp?.contact_info?.note ?? "",
      community_guidelines: false
    }
  });
  const appName = form.watch("name");
  const appDescription = form.watch("description");
  const contactEmail = form.watch("contact_email");
  const contactPhone = form.watch("contact_phone");

  useEffect(() => {
    if (!hasAttemptedSubmit) return;
    void form.trigger(watchedValidationFields);
  }, [appName, appDescription, contactEmail, contactPhone, form, hasAttemptedSubmit]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const supabase = createClient();

    for (const file of Array.from(files).slice(0, 8 - screenshots.length)) {
      if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
        toast.error("仅支持 png、jpg、webp、gif 图片。");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("单张图片不能超过 5MB。");
        continue;
      }

      const ext = file.name.split(".").pop() || "png";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("screenshots").upload(path, file, { upsert: false });
      if (error) {
        toast.error(error.message);
        continue;
      }

      const { data } = supabase.storage.from("screenshots").getPublicUrl(path);
      setScreenshots((current) => [...current, data.publicUrl].slice(0, 8));
      toast.success("截图已上传。");
    }
  }

  function readFormValues(formElement: HTMLFormElement): AppInput {
    const formData = new FormData(formElement);

    return {
      name: String(formData.get("name") ?? ""),
      slogan: String(formData.get("slogan") ?? ""),
      description: String(formData.get("description") ?? ""),
      category: String(formData.get("category") ?? categories[0]) as AppInput["category"],
      tech_stack: selectedTech as AppInput["tech_stack"],
      license: String(formData.get("license") ?? "") as AppInput["license"],
      screenshots,
      demo_url: String(formData.get("demo_url") ?? ""),
      prompt_text: String(formData.get("prompt_text") ?? ""),
      remix_allowed: formData.has("remix_allowed"),
      remix_license: String(formData.get("remix_license") ?? ""),
      contact_name: String(formData.get("contact_name") ?? ""),
      contact_email: String(formData.get("contact_email") ?? ""),
      contact_phone: String(formData.get("contact_phone") ?? ""),
      organization: String(formData.get("organization") ?? ""),
      publisher_type: String(formData.get("publisher_type") ?? "personal") as AppInput["publisher_type"],
      age_range: String(formData.get("age_range") ?? "") as AppInput["age_range"],
      gender: String(formData.get("gender") ?? "") as AppInput["gender"],
      preferred_contact: String(formData.get("preferred_contact") ?? "email") as AppInput["preferred_contact"],
      contact_note: String(formData.get("contact_note") ?? ""),
      community_guidelines: formData.has("community_guidelines")
    };
  }

  function syncFormValues(values: AppInput) {
    syncableFields.forEach((field) => {
      form.setValue(field, values[field], {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false
      });
    });
  }

  function applyValidationErrors(issues: z.ZodIssue[]) {
    issues.forEach((issue) => {
      const field = issue.path[0];
      if (typeof field !== "string") return;

      form.setError(field as AppFieldName, {
        type: "manual",
        message: issue.message
      });
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasAttemptedSubmit(true);

    const formElement = formRef.current ?? event.currentTarget;
    const values = readFormValues(formElement);
    syncFormValues(values);
    form.clearErrors();

    const parsed = appSchema.safeParse(values);
    if (!parsed.success) {
      applyValidationErrors(parsed.error.issues);
      const messages = parsed.error.issues.map((issue) => {
        const field = typeof issue.path[0] === "string" ? fieldLabels[issue.path[0] as AppFieldName] ?? issue.path[0] : "表单";
        return `${field}: ${issue.message}`;
      });
      toast.error(messages[0] ?? "请检查必填字段。");
      return;
    }

    syncFormValues(parsed.data);
    const formData = new FormData();
    Object.entries(parsed.data).forEach(([key, value]) => {
      formData.set(key, Array.isArray(value) ? JSON.stringify(value) : String(value ?? ""));
    });
    if (initialApp) formData.set("app_id", initialApp.id);
    if (remixFrom) formData.set("remix_from", remixFrom);

    startTransition(async () => {
      const result = initialApp ? await updateApp(formData) : await createApp(formData);
      if (result?.error) toast.error(result.error);
    });
  }

  function toggleTech(tech: string) {
    setSelectedTech((current) => current.includes(tech) ? current.filter((item) => item !== tech) : [...current, tech]);
  }

  function getErrorMessages(errors: FieldErrors<AppInput>) {
    return Object.entries(errors)
      .map(([field, error]) => `${fieldLabels[field as keyof AppInput] ?? field}: ${error?.message ? String(error.message) : "请检查该字段"}`)
      .filter(Boolean);
  }

  const formErrors = getErrorMessages(form.formState.errors);
  const contactError = form.formState.errors.contact_email?.message || form.formState.errors.contact_phone?.message;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="space-y-8"
      noValidate
    >
      {formErrors.length ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-700">
          <div className="font-semibold">发布前请修正以下问题</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {formErrors.map((message) => <li key={message}>{message}</li>)}
          </ul>
        </div>
      ) : null}

      <section className="space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
          <CheckCircle2 size={18} /> 基础信息
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <FieldError label="应用名称" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} placeholder="Prompt Studio" />
          </FieldError>
          <FieldError label="一句话标语" error={form.formState.errors.slogan?.message}>
            <Input {...form.register("slogan")} placeholder="把提示词编排成可复用的工作流" />
          </FieldError>
        </div>
        <FieldError label="完整描述" error={form.formState.errors.description?.message}>
          <Textarea {...form.register("description")} placeholder="说明目标用户、核心能力、限制、价格或使用方式。至少 20 个字符。" />
        </FieldError>
        <div className="grid gap-5 md:grid-cols-3">
          <FieldError label="分类" error={form.formState.errors.category?.message}>
            <Select {...form.register("category")}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </Select>
          </FieldError>
          <FieldError label="许可证" error={form.formState.errors.license?.message}>
            <Select {...form.register("license")}>
              <option value="">未指定</option>
              {licenses.map((license) => <option key={license} value={license}>{license}</option>)}
            </Select>
          </FieldError>
          <FieldError label="演示地址" error={form.formState.errors.demo_url?.message}>
            <Input {...form.register("demo_url")} placeholder="https://..." />
          </FieldError>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
          <CheckCircle2 size={18} /> 技术与素材
        </div>
        <div className="space-y-3">
          <Label>技术栈</Label>
          <div className="flex flex-wrap gap-2">
            {techStacks.map((tech) => (
              <button
                key={tech}
                type="button"
                onClick={() => toggleTech(tech)}
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  selectedTech.includes(tech)
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-line bg-white/80 text-slate-600 hover:border-sky-300"
                }`}
              >
                {tech}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Label>截图</Label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-white/70 p-8 text-sm text-slate-600 hover:border-sky-300 hover:bg-sky-50">
            <Upload size={18} /> 上传图片
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="sr-only" onChange={(event) => uploadFiles(event.target.files)} />
          </label>
          <div className="grid gap-2 sm:grid-cols-4">
            {screenshots.map((url) => (
              <div key={url} className="flex items-center justify-between rounded-md border border-line bg-white/80 px-3 py-2 text-xs text-slate-600">
                <span className="truncate">已上传截图</span>
                <button type="button" onClick={() => setScreenshots((items) => items.filter((item) => item !== url))} aria-label="移除截图">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <FieldError label="提示词 / 生成说明" error={form.formState.errors.prompt_text?.message}>
          <Textarea {...form.register("prompt_text")} placeholder="记录核心 prompt、模型、上下文和生成步骤，方便他人 Remix。" />
        </FieldError>
        <div className="grid gap-5 md:grid-cols-[1fr_2fr]">
          <label className="flex items-center gap-3 rounded-md border border-line bg-white/80 px-3 py-3 text-sm text-slate-700">
            <input type="checkbox" {...form.register("remix_allowed")} />
            允许 Remix
          </label>
          <Input {...form.register("remix_license")} placeholder="Remix 授权说明" />
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white/80 p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="font-display text-xl font-semibold text-slate-950">发布者联系信息</h2>
          <p className="mt-1 text-sm text-slate-500">这些信息会在详情页展示，方便用户咨询合作、反馈问题或联系采购。邮箱和手机至少填写一项。</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <FieldError label="联系人" error={form.formState.errors.contact_name?.message}>
            <Input {...form.register("contact_name")} placeholder="张三 / 产品负责人" />
          </FieldError>
          <FieldError label="发布主体" error={form.formState.errors.publisher_type?.message}>
            <Select {...form.register("publisher_type")}>
              <option value="personal">个人</option>
              <option value="company">企业 / 团队</option>
            </Select>
          </FieldError>
          <FieldError label="联系邮箱" error={form.formState.errors.contact_email?.message}>
            <Input
              {...form.register("contact_email", {
                onChange: () => {
                  void form.trigger(["contact_email", "contact_phone"]);
                }
              })}
              type="email"
              placeholder="name@example.com"
            />
          </FieldError>
          <FieldError label="手机 / 电话" error={form.formState.errors.contact_phone?.message}>
            <Input
              {...form.register("contact_phone", {
                onChange: () => {
                  void form.trigger(["contact_email", "contact_phone"]);
                }
              })}
              placeholder="+86 138 0000 0000"
            />
          </FieldError>
          <FieldError label="单位 / 公司" error={form.formState.errors.organization?.message}>
            <Input {...form.register("organization")} placeholder="公司、学校、工作室" />
          </FieldError>
          <FieldError label="优先联系方式" error={form.formState.errors.preferred_contact?.message}>
            <Select {...form.register("preferred_contact")}>
              <option value="email">邮箱</option>
              <option value="phone">手机 / 电话</option>
            </Select>
          </FieldError>
          <FieldError label="年龄段" error={form.formState.errors.age_range?.message}>
            <Select {...form.register("age_range")}>
              <option value="">不公开</option>
              <option value="under_18">18 岁以下</option>
              <option value="18_24">18-24</option>
              <option value="25_34">25-34</option>
              <option value="35_44">35-44</option>
              <option value="45_plus">45+</option>
            </Select>
          </FieldError>
          <FieldError label="性别" error={form.formState.errors.gender?.message}>
            <Select {...form.register("gender")}>
              <option value="">不公开</option>
              <option value="female">女性</option>
              <option value="male">男性</option>
              <option value="non_binary">非二元 / 其他</option>
              <option value="prefer_not_to_say">不愿透露</option>
            </Select>
          </FieldError>
          <div className="space-y-2 md:col-span-2">
            <Label>联系备注</Label>
            <Textarea {...form.register("contact_note")} placeholder="例如：工作日 10:00-18:00 回复；企业采购请优先邮件联系。" />
          </div>
        </div>
        {contactError ? <p className="mt-4 text-sm text-rose-600">{contactError}</p> : null}
      </section>

      <section className="rounded-lg border border-sky-200 bg-sky-50/80 p-5">
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
          <input type="checkbox" className="mt-1" {...form.register("community_guidelines")} />
          <span>
            <span className="flex items-center gap-2 font-semibold text-slate-950"><ShieldCheck size={17} /> 我确认遵守社区准则</span>
            我承诺提交的应用不包含欺诈、侵权、违法、色情、赌博、恶意诱导或其他违规内容；截图已确认合法；后续若修改应用内容会重新进入审核。
          </span>
        </label>
        {form.formState.errors.community_guidelines ? (
          <p className="mt-2 text-sm text-rose-600">{form.formState.errors.community_guidelines.message}</p>
        ) : null}
      </section>

      <Button type="submit" disabled={isPending} className="w-full md:w-auto">
        {isPending ? "提交审核中..." : initialApp ? "保存并重新提交审核" : "提交应用审核"}
      </Button>
    </form>
  );
}

function FieldError({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
