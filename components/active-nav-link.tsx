"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ActiveNavLink({
  href,
  children,
  className,
  activeClassName,
  inactiveClassName,
  exact = false
}: {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const matchPath = href.split("?")[0] || href;
  const isActive = exact
    ? pathname === matchPath
    : pathname === matchPath || (matchPath !== "/" && pathname.startsWith(`${matchPath}/`));

  return (
    <Link
      href={href}
      prefetch
      className={cn(className, isActive ? activeClassName : inactiveClassName)}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
