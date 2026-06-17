"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      <motion.div
        key={`progress-${routeKey}`}
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-cyanGlow via-white to-pinkGlow"
        initial={false}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={routeKey}
          initial={false}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
