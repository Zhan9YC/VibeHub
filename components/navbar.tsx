import {
  Bell,
  ClipboardCheck,
  Code2,
  Compass,
  Flag,
  LayoutDashboard,
  LogIn,
  Plus,
  ShieldCheck,
  Store,
  User,
  UserPlus
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ActiveNavLink } from "@/components/active-nav-link";
import { resolveRole } from "@/lib/admin";
import { getUnreadNotificationCount, getViewer } from "@/lib/data";
import { signOut } from "@/lib/actions";
import { SearchBox } from "@/components/search-box";
import { ButtonLink } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";

type Role = "user" | "creator" | "admin";
type ConsoleLink = {
  href: string;
  label: string;
  icon: JSX.Element;
  badge?: number;
};

export async function Navbar() {
  const { user, profile } = await getViewer();
  const role = resolveRole(profile?.role, { id: user?.id, email: user?.email }) as Role;
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

  const marketLinks = [
    { href: "/", label: "首页", icon: <Store size={15} />, exact: true },
    { href: "/?sort=rating", label: "高分榜", icon: <Compass size={15} />, exact: false, disableActive: true }
  ];

  const consoleLinks = getConsoleLinks(role, unreadCount);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-slate-950/[0.84] shadow-lg shadow-slate-950/10 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3 font-display text-xl font-semibold text-white transition duration-200 hover:-translate-y-0.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cyanGlow text-slate-950 shadow-neon">
            <Code2 size={20} />
          </span>
          VibeHub
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <span className="mr-1 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs text-slate-300">市场</span>
          {marketLinks.map((link) => (
            link.disableActive ? (
              <Link key={link.href} className={cn(topNavLink, "border-transparent")} href={link.href}>
                {link.icon}
                {link.label}
              </Link>
            ) : (
              <ActiveNavLink
                key={link.href}
                href={link.href}
                exact={link.exact}
                className={topNavLink}
                activeClassName="border-cyanGlow/35 bg-cyanGlow/14 text-white"
                inactiveClassName="border-transparent"
              >
                {link.icon}
                {link.label}
              </ActiveNavLink>
            )
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchBox />
          {user ? (
            <>
              {role === "user" ? (
                <ButtonLink href="/apply-creator" className="hidden md:inline-flex" variant="secondary">
                  <ShieldCheck size={17} />
                  申请创作者
                </ButtonLink>
              ) : (
                <ButtonLink href="/create" className="hidden md:inline-flex">
                  <Plus size={17} />
                  发布应用
                </ButtonLink>
              )}
              <details className="group relative">
                <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center overflow-hidden rounded-full border border-line bg-white/90 text-sm font-semibold text-slate-900 transition duration-200 hover:-translate-y-0.5 hover:shadow-neon">
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt="" width={40} height={40} className="h-full w-full object-cover" />
                  ) : (
                    initials(profile?.full_name || profile?.username || user.email)
                  )}
                </summary>
                <div className="absolute right-0 top-11 z-50 w-72 translate-y-2 rounded-2xl border border-line bg-white p-2 opacity-0 shadow-xl transition duration-200 group-open:translate-y-0 group-open:opacity-100">
                  <div className="border-b border-slate-100 px-3 py-3">
                    <div className="text-sm font-semibold text-slate-950">
                      {profile?.full_name || profile?.username || user.email}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span>{roleLabel(role)}</span>
                      {role === "admin" ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">ADMIN</span> : null}
                    </div>
                  </div>
                  <div className="py-2">
                    <Link className={`${menuItem} md:hidden`} href="/">
                      <Store size={16} />
                      市场首页
                    </Link>
                    {consoleLinks.map((link) => (
                      <Link key={link.href} className={menuItem} href={link.href}>
                        {link.icon}
                        <span>{link.label}</span>
                        {link.badge ? <CountBadge value={link.badge} dark /> : null}
                      </Link>
                    ))}
                    <Link className={menuItem} href={`/profile/${user.id}`}>
                      <User size={16} />
                      我的资料
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 p-2">
                    <form action={signOut}>
                      <button className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-sky-50">
                        退出登录
                      </button>
                    </form>
                  </div>
                </div>
              </details>
            </>
          ) : (
            <>
              <ButtonLink
                href="/login"
                variant="ghost"
                className="hidden text-slate-200 hover:bg-white/[0.08] hover:text-white sm:inline-flex"
              >
                <LogIn size={17} />
                登录
              </ButtonLink>
              <ButtonLink href="/register">
                <UserPlus size={17} />
                注册
              </ButtonLink>
            </>
          )}
        </div>
      </div>

      {user ? (
        <div className="border-t border-white/5 bg-slate-950/[0.78]">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 md:px-6">
            <span className="shrink-0 rounded-full border border-cyanGlow/20 bg-cyanGlow/10 px-3 py-1 text-xs font-medium text-cyan-100">
              {consoleTitle(role)}
            </span>
            {consoleLinks.map((link) => (
              <ActiveNavLink
                key={link.href}
                href={link.href}
                exact={link.href === "/admin" || link.href === "/dashboard" || link.href === "/create" || link.href === "/notifications" || link.href === "/apply-creator"}
                className={subNavLink}
                activeClassName="border-cyanGlow/45 bg-cyanGlow/14 text-white"
                inactiveClassName="border-white/10 bg-white/[0.04] text-slate-200 hover:-translate-y-0.5 hover:border-cyanGlow/40 hover:bg-white/[0.08] hover:text-white"
              >
                {link.icon}
                <span>{link.label}</span>
                {link.badge ? <CountBadge value={link.badge} /> : null}
              </ActiveNavLink>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function getConsoleLinks(role: Role, unreadCount: number): ConsoleLink[] {
  const notificationLink = {
    href: "/notifications",
    label: "站内通知",
    icon: <Bell size={16} />,
    badge: unreadCount
  };

  if (role === "admin") {
    return [
      { href: "/admin", label: "管理总览", icon: <LayoutDashboard size={16} /> },
      { href: "/create", label: "发布应用", icon: <Plus size={16} /> },
      { href: "/admin/apps", label: "应用审核", icon: <ClipboardCheck size={16} /> },
      { href: "/admin/applications", label: "创作者申请", icon: <ShieldCheck size={16} /> },
      { href: "/admin/reports", label: "举报管理", icon: <Flag size={16} /> },
      notificationLink
    ];
  }

  if (role === "creator") {
    return [
      { href: "/dashboard", label: "作品概览", icon: <LayoutDashboard size={16} /> },
      { href: "/create", label: "发布应用", icon: <Plus size={16} /> },
      notificationLink
    ];
  }

  return [
    { href: "/dashboard", label: "我的应用库", icon: <LayoutDashboard size={16} /> },
    { href: "/apply-creator", label: "申请创作者", icon: <ShieldCheck size={16} /> },
    notificationLink
  ];
}

function consoleTitle(role: Role) {
  if (role === "admin") return "管理后台";
  if (role === "creator") return "开发者后台";
  return "用户中心";
}

function roleLabel(role: Role) {
  if (role === "admin") return "管理员";
  if (role === "creator") return "创作者";
  return "普通用户";
}

function CountBadge({ value, dark = false }: { value: number; dark?: boolean }) {
  if (!value) return null;

  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
        dark ? "bg-sky-100 text-sky-700" : "bg-white/12 text-cyan-100"
      )}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

const topNavLink =
  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm text-slate-300 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white";
const subNavLink =
  "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm transition duration-200";
const menuItem =
  "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-sky-50 hover:text-slate-950";
