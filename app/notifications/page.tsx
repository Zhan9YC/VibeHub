import Link from "next/link";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";
import { markNotificationsRead } from "@/lib/actions";
import { getNotifications, getViewer } from "@/lib/data";
import { normalizeNotification } from "@/lib/notifications";
import { EmptyState } from "@/components/empty-state";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default async function NotificationsPage() {
  const { user, profile } = await getViewer();
  if (!user) redirect("/login?redirect=/notifications");

  const notifications = (await getNotifications(50)).map(normalizeNotification);
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <section className="relative overflow-hidden rounded-[24px] border border-line bg-panel px-6 py-8 shadow-neon md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,.16),transparent_35%),radial-gradient(circle_at_85%_30%,rgba(124,58,237,.18),transparent_32%)]" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-cyan-100">Notification Center</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-white md:text-5xl">站内通知</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              创作者申请、应用审核、举报处理和账号限制都通过站内消息通知，不依赖邮件人工往返。
              {profile?.role === "admin" ? " 你也可以从这里快速回到审核后台。" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {profile?.role === "admin" ? <ButtonLink href="/admin/apps" variant="secondary">进入审核中心</ButtonLink> : null}
            {unreadCount ? (
              <form action={markNotificationsRead}>
                <Button type="submit">
                  <CheckCheck size={17} />
                  全部标记已读
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="text-sm text-slate-400">
            共 {notifications.length} 条消息，未读 {unreadCount} 条
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-cyanGlow transition hover:text-cyan-200">
            返回工作台
          </Link>
        </div>

        {notifications.length ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-2xl border p-5 transition duration-200 ${
                  notification.is_read
                    ? "border-line bg-white/[0.04]"
                    : "border-cyanGlow/25 bg-cyanGlow/10 shadow-neon"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-cyanGlow">
                        <Bell size={16} />
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs ${typeTone(notification.type)}`}>
                        {typeLabel(notification.type)}
                      </span>
                      {!notification.is_read ? (
                        <span className="rounded-full bg-cyanGlow/15 px-2.5 py-1 text-xs text-cyan-100">未读</span>
                      ) : null}
                      <span className="text-xs text-slate-500">{formatDate(notification.created_at)}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-white">{notification.title}</h2>
                    {notification.body ? <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">{notification.body}</p> : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!notification.is_read ? (
                      <form action={markNotificationsRead}>
                        <input type="hidden" name="notification_id" value={notification.id} />
                        <Button type="submit" variant="secondary">标记已读</Button>
                      </form>
                    ) : null}
                    {notification.cta_href ? (
                      <ButtonLink href={notification.cta_href} variant="secondary">
                        查看详情
                        <ExternalLink size={15} />
                      </ButtonLink>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="还没有通知" description="申请审核、应用上架和举报处理结果会出现在这里。" />
        )}
      </section>
    </main>
  );
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    creator_application: "创作者申请",
    app_review: "应用审核",
    report: "举报处理",
    account: "账号状态",
    system: "系统消息"
  };
  return labels[type] ?? type;
}

function typeTone(type: string) {
  const tones: Record<string, string> = {
    creator_application: "bg-violet-500/15 text-violet-100",
    app_review: "bg-cyanGlow/15 text-cyan-100",
    report: "bg-amber-500/15 text-amber-100",
    account: "bg-rose-500/15 text-rose-100",
    system: "bg-white/10 text-slate-200"
  };
  return tones[type] ?? tones.system;
}
