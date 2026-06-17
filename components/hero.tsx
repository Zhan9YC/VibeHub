"use client";

import { motion } from "framer-motion";
import { ArrowRight, Compass, Rocket, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(14,165,233,.24),transparent_34%),linear-gradient(235deg,rgba(124,58,237,.20),transparent_36%),linear-gradient(180deg,rgba(8,17,31,.94),rgba(15,23,42,.82))]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyanGlow/70 to-transparent" />
      <div className="relative mx-auto grid min-h-[560px] max-w-7xl items-center gap-12 px-4 py-20 md:grid-cols-[1.05fr_.95fr] md:px-6">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.08] px-3 py-1 text-sm text-cyan-100 shadow-neon backdrop-blur">
            <Sparkles size={15} /> Vibecoding 应用市场与 Remix 社区
          </div>
          <h1 className="font-display text-6xl font-semibold leading-[0.96] tracking-tight text-white md:text-8xl">VibeHub</h1>
          <p className="mt-6 max-w-2xl text-xl leading-9 text-slate-300">
            一个面向 AI 应用创造者的发布、发现与合作平台。用更完整的作品信息、联系方式和 Remix 链路，把一次 vibe coding 变成可被验证的产品资产。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/apply-creator"><Rocket size={18} /> 申请发布权限</ButtonLink>
            <ButtonLink href="/?sort=rating" variant="secondary"><Compass size={17} /> 浏览高分应用 <ArrowRight size={16} /></ButtonLink>
          </div>
        </motion.div>
        <motion.div
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="relative min-h-[420px] overflow-hidden rounded-lg border border-line bg-panel p-5 shadow-pink backdrop-blur-xl"
        >
          <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(14,165,233,.16),transparent_42%),linear-gradient(320deg,rgba(16,185,129,.12),transparent_38%)]" />
          <div className="relative grid gap-4">
            {[
              ["Prompt Studio", "提示词资产管理", "98%"],
              ["Agent CRM", "自动化销售跟进", "4.9"],
              ["Micro SaaS Kit", "一键生成运营后台", "128"],
              ["Learning Copilot", "个性化学习路径", "32"]
            ].map(([item, desc, metric], index) => (
              <motion.div
                key={item}
                animate={{ y: [0, index % 2 ? 8 : -8, 0] }}
                transition={{ duration: 6 + index, repeat: Infinity, ease: "easeInOut" }}
                className="interactive-lift rounded-lg border border-line bg-white/[0.08] p-5 shadow-sm backdrop-blur transition duration-300 hover:border-cyanGlow/60 hover:bg-white/[0.12]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-display text-lg font-semibold text-white">{item}</div>
                    <div className="mt-1 text-sm text-slate-400">{desc}</div>
                  </div>
                  <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">{metric}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
