import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { resolveRole } from "@/lib/admin";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value: "", ...options });
      }
    }
  });

  const { data } = await supabase.auth.getUser();
  const protectedPath = ["/create", "/settings", "/profile", "/dashboard", "/apply-creator", "/notifications"].some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );
  const adminPath = request.nextUrl.pathname.startsWith("/admin");

  if ((protectedPath || adminPath) && !data.user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(redirect);
  }

  if (data.user && (request.nextUrl.pathname.startsWith("/create") || adminPath)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,is_banned")
      .eq("id", data.user.id)
      .maybeSingle();
    const effectiveRole = resolveRole(profile?.role, {
      id: data.user.id,
      email: data.user.email
    });

    if (profile?.is_banned) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/";
      redirect.search = "";
      return NextResponse.redirect(redirect);
    }

    if (adminPath && effectiveRole !== "admin") {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/";
      redirect.search = "";
      return NextResponse.redirect(redirect);
    }

    if (request.nextUrl.pathname.startsWith("/create") && !["creator", "admin"].includes(effectiveRole)) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/apply-creator";
      redirect.search = "";
      return NextResponse.redirect(redirect);
    }
  }

  return response;
}
