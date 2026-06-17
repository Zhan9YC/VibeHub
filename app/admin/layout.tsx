import { Bell, ClipboardCheck, Flag, LayoutDashboard, ShieldCheck, Store } from "lucide-react";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ActiveNavLink } from "@/components/active-nav-link";
import { resolveRole } from "@/lib/admin";
import { getAdminConsoleSummary, getViewer } from "@/lib/data";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await getViewer();
  if (!user) redirect("/login?redirect=/admin");
  if (resolveRole(profile?.role, { id: user.id, email: user.email }) !== "admin") redirect("/");

  const summary = await getAdminConsoleSummary(user.id);
  const navItems = [
    { href: "/admin", label: "管理总览", icon: <LayoutDashboard size={17} />, badge: 0 },
    { href: "/admin/apps", label: "应用审核", icon: <ClipboardCheck size={17} />, badge: summary.reviewQueueCount },
    { href: "/admin/applications", label: "创作者申请", icon: <ShieldCheck size={17} />, badge: summary.pendingApplicationCount },
    { href: "/admin/reports", label: "举报处理", icon: <Flag size={17} />, badge: summary.openReportCount },
    { href: "/notifications", label: "站内通知", icon: <Bell size={17} />, badge: summary.unreadNotificationCount }
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-neon backdrop-blur">
          <div className="rounded-2xl border border-cyanGlow/15 bg-cyanGlow/10 p-4">
            <div className="text-sm text-cyan-100">Management System</div>
            <div className="mt-2 font-display text-2xl font-semibold text-white">VibeHub Admin</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              这里是独立的管理后台，不是前台市场页。创作者申请、应用审核、举报处理和站内通知都在这套系统里闭环。
            </p>
          </div>

          <nav className="mt-5 space-y-2">
            {navItems.map((item) => (
              <ActiveNavLink
                key={item.href}
                href={item.href}
                exact={item.href === "/admin"}
                className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition duration-200"
                activeClassName="border-cyanGlow/40 bg-cyanGlow/14 text-white shadow-[0_10px_28px_rgba(14,165,233,0.18)]"
                inactiveClassName="border-white/8 bg-white/[0.03] text-slate-200 hover:-translate-y-0.5 hover:border-cyanGlow/30 hover:bg-white/[0.07] hover:text-white"
              >
                <span className="text-cyanGlow">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge ? <SidebarBadge value={item.badge} /> : null}
              </ActiveNavLink>
            ))}
          </nav>

          <div className="mt-5 grid gap-3">
            <Metric label="待审应用" value={summary.reviewQueueCount} />
            <Metric label="待审申请" value={summary.pendingApplicationCount} />
            <Metric label="开放举报" value={summary.openReportCount} />
            <Metric label="未读通知" value={summary.unreadNotificationCount} />
          </div>

          <ActiveNavLink
            href="/"
            exact
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition duration-200"
            inactiveClassName="hover:-translate-y-0.5 hover:bg-white/[0.07] hover:text-white"
          >
            <Store size={16} />
            返回市场前台
          </ActiveNavLink>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function SidebarBadge({ value }: { value: number }) {
  return (
    <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-cyanGlow/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-100">
      {value > 99 ? "99+" : value}
    </span>
  );
}
