"use client";

// ============================================
// FILE: components/ui/password-input.tsx
// PURPOSE: Password <Input> with a "show/hide" eye icon toggle.
// USED IN: components/login-form.tsx, components/sign-up-form.tsx,
//          and any other form with a password field.
// INTERN NOTE: Drop-in replacement for <Input type="password" />.
// ============================================

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export const PasswordInput = React.forwardRef<HTMLInputElement, Props>(
  function PasswordInput({ className, ...props }, ref) {
    const [show, setShow] = React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          // Reserve space on the right so typed text doesn't sit
          // underneath the toggle button.
          className={cn("pr-11", className)}
          {...props}
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          // tabIndex=-1 keeps form-tab order natural (email → pwd → submit).
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-sm text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
