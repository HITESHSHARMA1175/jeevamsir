import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 md:p-10">
      <div className="w-full max-w-sm rounded-[1.2rem] border border-amber-100 bg-white p-6 sm:p-8 shadow-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
