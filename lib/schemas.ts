import { z } from "zod";
import { categories, licenses, techStacks } from "@/lib/constants";

const emptyToString = (value: unknown) => (value == null ? "" : value);
const emptyToArray = (value: unknown) => (value == null ? [] : value);
const text = (max = 1000) => z.preprocess(emptyToString, z.string().trim().max(max));
const requiredText = (min: number, message: string, max = 1000) =>
  z.preprocess(emptyToString, z.string().trim().min(min, message).max(max));
const urlOrEmpty = z.preprocess(emptyToString, z.string().trim().url("请输入有效 URL").or(z.literal("")));
const emailOrEmpty = z.preprocess(emptyToString, z.string().trim().email("请输入有效邮箱").or(z.literal("")));
const phoneOrEmpty = z.preprocess(emptyToString, z.string().trim().regex(/^[+()\-\s0-9]{6,24}$/, "请输入有效手机号或电话").or(z.literal("")));
const categoryField = z.preprocess((value) => value || categories[0], z.enum(categories));
const licenseField = z.preprocess(emptyToString, z.enum(licenses).or(z.literal("")));
const publisherTypeField = z.preprocess((value) => value || "personal", z.enum(["personal", "company"]));
const preferredContactField = z.preprocess((value) => value || "email", z.enum(["email", "phone"]));
const ageRangeField = z.preprocess((value) => value || "", z.enum(["", "under_18", "18_24", "25_34", "35_44", "45_plus"]));
const genderField = z.preprocess((value) => value || "", z.enum(["", "female", "male", "non_binary", "prefer_not_to_say"]));
const bannedWords = [/赌博/, /色情/, /诈骗/, /外挂/, /洗钱/, /非法/, /暴力/];

function hasForbiddenContent(value: string) {
  return bannedWords.some((pattern) => pattern.test(value));
}

export const appSchema = z.object({
  name: requiredText(2, "名称至少 2 个字符", 80),
  slogan: text(140).default(""),
  description: requiredText(20, "描述至少 20 个字符", 8000),
  category: categoryField.default(categories[0]),
  tech_stack: z.preprocess(emptyToArray, z.array(z.enum(techStacks)).max(12)).default([]),
  license: licenseField.default(""),
  screenshots: z.preprocess(emptyToArray, z.array(z.string().url()).max(8)).default([]),
  demo_url: urlOrEmpty.default(""),
  prompt_text: text(20000).default(""),
  remix_allowed: z.coerce.boolean().default(true),
  remix_license: text(120).default(""),
  contact_name: text(80).default(""),
  contact_email: emailOrEmpty.default(""),
  contact_phone: phoneOrEmpty.default(""),
  organization: text(120).default(""),
  publisher_type: publisherTypeField.default("personal"),
  age_range: ageRangeField.default(""),
  gender: genderField.default(""),
  preferred_contact: preferredContactField.default("email"),
  contact_note: text(300).default(""),
  community_guidelines: z.coerce.boolean().refine(Boolean, "发布前必须同意社区准则。")
}).refine((data) => Boolean(data.contact_email || data.contact_phone), {
  message: "请至少填写邮箱或手机，方便用户联系发布者。",
  path: ["contact_email"]
}).refine((data) => !hasForbiddenContent(`${data.name} ${data.description}`), {
  message: "应用名称或描述包含违规词，请修改后提交。",
  path: ["name"]
});

export const reviewSchema = z.object({
  app_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().default("")
});

export const tipSchema = z.object({
  app_id: z.string().uuid(),
  amount: z.coerce.number().min(1).max(500)
});

export const profileSchema = z.object({
  username: z.string().trim().min(2).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  full_name: z.string().trim().max(80).optional().default(""),
  bio: z.string().trim().max(300).optional().default(""),
  website: urlOrEmpty.default(""),
  twitter: z.string().trim().max(80).optional().default(""),
  avatar_url: urlOrEmpty.default("")
});

export const creatorApplicationSchema = z.object({
  reason: requiredText(20, "申请理由至少 20 个字符", 1000)
});

export const reportSchema = z.object({
  app_id: z.string().uuid(),
  reason: requiredText(8, "举报原因至少 8 个字符", 1000)
});

export const appClaimSchema = z.object({
  app_id: z.string().uuid()
});
