"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export function LoginForm({
  className,
  defaultRedirectTo = "/account",
  mode = "customer",
  showSignUp = true,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  defaultRedirectTo?: string;
  mode?: "customer" | "admin";
  showSignUp?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const nextPath = searchParams.get("next");
  const redirectTo =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : defaultRedirectTo;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "admin") {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Admin login failed");

        // Hard navigation so the guarded admin layout reads fresh cookies.
        window.location.assign(redirectTo);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Hard navigation here too. Soft router navigations to a
      // protected route (e.g. /account) can resolve from a cached
      // 302 → /auth/login that the prefetcher captured BEFORE we
      // had a session, which silently bounced the user back to
      // this page after a successful login.
      window.location.assign(redirectTo);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-blue-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-950">
            {mode === "admin" ? "Admin Login" : "Login"}
          </CardTitle>
          <CardDescription>
            {mode === "admin"
              ? "Enter your admin credentials to continue"
              : "Enter your email below to login to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  className="admin-input h-11"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {mode === "customer" && (
                    <Link
                      href="/auth/forgot-password"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  )}
                </div>
                <PasswordInput
                  id="password"
                  className="admin-input h-11"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                className="h-11 w-full bg-slate-950 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
            {showSignUp && (
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/sign-up"
                  className="underline underline-offset-4"
                >
                  Sign up
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
