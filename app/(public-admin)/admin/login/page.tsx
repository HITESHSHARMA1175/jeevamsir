import { LoginForm } from "@/components/login-form";
import { getSiteSettings } from "@/utils/store/queries";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const settings = await getSiteSettings();
  const companyName = settings?.site_name?.trim() || "your store";
  const companyLabel =
    companyName.length > 28 ? `${companyName.slice(0, 28).trim()}...` : companyName;

  return (
    <div className="admin-bg flex min-h-svh w-full items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-sm border border-blue-100 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.16)] lg:grid-cols-[0.88fr_1.12fr]">
        <div className="order-2 flex items-center justify-center p-5 sm:p-8 lg:order-1 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-6 border-l-2 border-blue-500 bg-blue-50/50 px-4 py-4 sm:mb-8 sm:px-5 sm:py-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700 sm:text-xs">
                {companyLabel} Admin Access
              </div>
              <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-3xl">
                Welcome back to your control center.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Manage {companyName} catalog, banners, orders, coupons, and brand settings.
              </p>
            </div>
            <LoginForm defaultRedirectTo="/admin" mode="admin" showSignUp={false} />
          </div>
        </div>

        <div className="order-1 border-b border-blue-100 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-3 sm:p-4 lg:order-2 lg:border-b-0 lg:border-l lg:p-5 flex flex-col items-center justify-center gap-4">
          <div className="w-full max-w-sm">
            <Image
              src="/logo.png"
              alt="ShopKart admin panel logo"
              width={400}
              height={400}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="border border-white/15 bg-white/10 p-4 text-center text-white shadow-2xl backdrop-blur-md sm:p-5 rounded-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100 sm:text-xs">
              Premium Admin Console
            </div>
            <div className="mt-2 text-lg font-semibold tracking-tight sm:text-2xl">
              Shop more, save more
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

