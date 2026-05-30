import { getSiteSettings } from "@/utils/store/queries";
import { LoginForm } from "@/components/login-form";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function Page() {
  const settings = await getSiteSettings();
  const companyName = settings?.site_name?.trim() || "your store";

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 p-4 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-sm border bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="order-2 flex items-center justify-center p-6 sm:p-10 lg:order-1">
          <div className="w-full max-w-md space-y-7">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                {companyName} Account
              </div>
              <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-slate-950">
                Login to track orders and checkout faster.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                View your purchases, save profile details, and continue shopping with a personal account.
              </p>
            </div>
            <LoginForm defaultRedirectTo="/account" mode="customer" />
          </div>
        </div>

        <div className="order-1 border-b bg-slate-950 p-4 text-white sm:p-6 lg:order-2 lg:border-b-0 lg:border-l lg:p-8">
          <div className="relative overflow-hidden rounded-sm border border-white/15 bg-white">
            <Image
              src="/customer login.png"
              alt={`${companyName} customer login`}
              width={1024}
              height={768}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="mt-4 border border-white/15 bg-white/10 p-4 backdrop-blur sm:p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100 sm:text-xs">
              Customer Benefits
            </div>
            <div className="mt-2 text-xl font-semibold leading-tight sm:text-2xl">
              Orders, delivery updates, and faster checkout in one place.
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-[0.14em] text-blue-100 sm:gap-3 sm:text-xs">
              <span className="border border-white/15 bg-white/10 px-3 py-2 sm:py-3">Orders</span>
              <span className="border border-white/15 bg-white/10 px-3 py-2 sm:py-3">Coupons</span>
              <span className="border border-white/15 bg-white/10 px-3 py-2 sm:py-3">Profile</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
