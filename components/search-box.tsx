"use client";

import { FormEvent, useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export function SearchBox() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/${params.toString() ? `?${params}` : ""}`);
    setOpen(false);
  }

  if (!open) {
    return (
      <Button variant="ghost" className="h-10 w-10 px-0 text-slate-200 hover:bg-white/[0.08] hover:text-white" onClick={() => setOpen(true)} aria-label="搜索">
        <Search size={18} />
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索应用" className="w-40 md:w-64" />
      <Button type="submit" className="h-10 w-10 px-0" aria-label="提交搜索"><Search size={17} /></Button>
      <Button type="button" variant="ghost" className="h-10 w-10 px-0 text-slate-200 hover:bg-white/[0.08] hover:text-white" onClick={() => setOpen(false)} aria-label="关闭搜索">
        <X size={17} />
      </Button>
    </form>
  );
}
