"use client";

// ============================================
// FILE: components/store/HeaderAuth.tsx
// PURPOSE: Login button or AccountDropdown depending on auth.
//          Reads from StoreUserProvider so we don't fire
//          another auth fetch (the provider handles it once).
// USED IN: components/store/Header.tsx
// ============================================

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useStoreUser } from "@/context/StoreUserProvider";
import AccountDropdown from "@/components/store/AccountDropdown";

export default function HeaderAuth() {
  const { ready, user } = useStoreUser();

  // Reserve space while we're checking the session so the header
  // doesn't shift once we know who the user is. The placeholder
  // matches the height of both states (h-10).
  if (!ready) {
    return (
      <div className="h-10 w-24 animate-pulse rounded-sm bg-white/70" />
    );
  }

  if (!user) {
    return (
      <Button
        asChild
        className="h-10 rounded-sm bg-[var(--brand-primary)] px-3 text-sm text-white hover:bg-[var(--brand-primary-hover)] sm:px-4"
      >
        <Link href="/auth/login" prefetch>
          Login
        </Link>
      </Button>
    );
  }

  return <AccountDropdown email={user.email} fullName={user.fullName} />;
}

HeaderAuth.displayName = "HeaderAuth";
