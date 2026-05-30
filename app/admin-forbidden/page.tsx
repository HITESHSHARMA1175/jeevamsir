// ============================================
// FILE: app/admin-forbidden/page.tsx
// PURPOSE: Shown when logged-in user is not an admin
// USED IN: Admin guard redirects
// INTERN NOTE: To make a user admin, set app_metadata.role="admin".
// ============================================

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminForbidden() {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 py-16 text-center">
      <div className="space-y-3">
        <div className="text-xl font-semibold">Admin access required</div>
        <div className="text-sm text-muted-foreground">
          Your account is signed in, but it does not have the admin role.
        </div>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Go to Store</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account">View Account</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

AdminForbidden.displayName = "AdminForbidden";

