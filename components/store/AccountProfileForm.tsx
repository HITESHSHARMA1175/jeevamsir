"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

type Props = {
  initialFullName: string;
  initialPhone: string;
  initialAddress: string;
};

export default function AccountProfileForm({
  initialFullName,
  initialPhone,
  initialAddress,
}: Props) {
  const router = useRouter();
  const [fullName, setFullName] = React.useState(initialFullName);
  const [phone, setPhone] = React.useState(initialPhone);
  const [address, setAddress] = React.useState(initialAddress);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    // When the server refreshes (router.refresh), the props can change but this
    // component stays mounted. Sync state so the UI reflects saved metadata.
    setFullName(initialFullName);
    setPhone(initialPhone);
    setAddress(initialAddress);
  }, [initialFullName, initialPhone, initialAddress]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
        },
      });
      if (error) throw error;

      // Supabase stores user metadata in the JWT claims. Refreshing the session
      // ensures server-rendered pages see the updated `user_metadata` immediately.
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;

      // Also read back what the server will read (auth.user_metadata) so the
      // user immediately sees the persisted values.
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const meta = (userData.user?.user_metadata ?? {}) as Record<string, unknown>;
      setFullName(typeof meta.full_name === "string" ? meta.full_name : "");
      setPhone(typeof meta.phone === "string" ? meta.phone : "");
      setAddress(typeof meta.address === "string" ? meta.address : "");

      setMsg("Saved");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="91XXXXXXXXXX"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address">Default address</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House, street, city, pincode"
        />
      </div>

      {msg && <div className="text-sm text-muted-foreground">{msg}</div>}

      <Button type="submit" variant="fk" className="w-full sm:w-auto" disabled={loading}>
        {loading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}

AccountProfileForm.displayName = "AccountProfileForm";

