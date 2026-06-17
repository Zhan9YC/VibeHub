"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function AppShell({
  navbar,
  children
}: {
  navbar: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <>
      {isAdminRoute ? null : navbar}
      {children}
    </>
  );
}
