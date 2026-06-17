import type { NotificationRecord } from "@/lib/types";

const titleMap: Record<string, string> = {
  "Creator application approved": "创作者申请已通过",
  "Creator application rejected": "创作者申请未通过",
  "Account banned": "账号已被限制",
  "Account restored": "账号已恢复",
  "Your report was accepted": "你的举报已被采纳",
  "Your report was dismissed": "你的举报未被采纳",
  "搴旂敤銆?{app.name}銆嬪凡閫氳繃瀹℃牳": "应用审核已通过",
  "搴旂敤銆?{app.name}銆嬫湭閫氳繃瀹℃牳": "应用审核未通过"
};

const bodyMap: Record<string, string> = {
  "Application approved. You can now publish apps.": "你的创作者申请已通过，现在可以发布应用。",
  "Your app has been approved and is now visible in the marketplace.": "你的应用已通过审核，现已在市场公开展示。",
  "Please update your app and submit it for review again.": "请修改应用后重新提交审核。",
  "Your publishing access has been suspended. Contact an administrator if you believe this is a mistake.": "你的发布权限已被限制，如有异议请联系管理员。",
  "Your account has been restored and publishing features are available again.": "你的账号已恢复，发布功能可以继续使用。",
  "An admin confirmed the report and removed the app from public listings.": "管理员已确认举报成立，应用已从公开市场下架。",
  "An admin dismissed the report and restored the app to public listings.": "管理员已驳回举报，应用已恢复公开展示。",
  "An admin confirmed the issue and removed the app from public listings.": "管理员已确认问题属实，应用已从公开市场下架。",
  "An admin reviewed the report and did not find enough evidence to remove the app.": "管理员已审核举报，当前证据不足以下架该应用。"
};

function normalizeText(value: string | null, map: Record<string, string>) {
  if (!value) return value;
  return map[value] ?? value;
}

export function normalizeNotification(record: NotificationRecord): NotificationRecord {
  return {
    ...record,
    title: normalizeText(record.title, titleMap) ?? record.title,
    body: normalizeText(record.body, bodyMap)
  };
}
