"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { categories } from "@/lib/constants";
import { Select } from "@/components/ui/field";

export function AppFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "All" || !value) params.delete(name);
    else params.set(name, value);
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Select defaultValue={searchParams.get("category") ?? "All"} onChange={(event) => setParam("category", event.target.value)} aria-label="分类">
        <option value="All">全部分类</option>
        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
      </Select>
      <Select defaultValue={searchParams.get("sort") ?? "created_at"} onChange={(event) => setParam("sort", event.target.value)} aria-label="排序">
        <option value="created_at">最新发布</option>
        <option value="rating">评分最高</option>
        <option value="remix_count">Remix 最多</option>
      </Select>
    </div>
  );
}
