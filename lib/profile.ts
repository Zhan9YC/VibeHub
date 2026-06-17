import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isBootstrapAdmin, resolveRole } from "@/lib/admin";
import type { Profile } from "@/lib/types";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

function buildUsername(user: User) {
  const base =
    user.email?.split("@")[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "") || "user";

  return `${base}_${user.id.replace(/-/g, "").slice(0, 8)}`;
}

export async function ensureProfile(supabase: AppSupabaseClient, user: User) {
  const bootstrapAdmin = isBootstrapAdmin({ id: user.id, email: user.email });
  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    const current = existing as Profile;
    const nextRole = resolveRole(current.role, { id: user.id, email: user.email });

    if (nextRole !== current.role) {
      const { data: repaired, error: repairError } = await supabase
        .from("profiles")
        .update({ role: nextRole })
        .eq("id", user.id)
        .select("*")
        .single();

      if (repairError) throw repairError;
      return repaired as Profile;
    }

    return current;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      username: buildUsername(user),
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: bootstrapAdmin ? "admin" : "user",
      is_banned: false
    })
    .select("*")
    .maybeSingle();

  if (insertError && insertError.code !== "23505") {
    throw insertError;
  }

  if (inserted) return inserted as Profile;

  const { data: retried, error: retryError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (retryError || !retried) {
    throw retryError ?? new Error("用户资料不存在。");
  }

  return retried as Profile;
}
