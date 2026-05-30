import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AdminLoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AdminLoginBody;
    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "Invalid login details" },
        { status: 401 },
      );
    }

    const role = data.user.app_metadata?.role;
    if (role !== "admin") {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "This account is not allowed to access the admin panel" },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin_login] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

