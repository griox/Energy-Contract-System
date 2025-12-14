

import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <SignupForm />
            </div>
          </div>
        </div>
          <div className="bg-white relative hidden lg:flex items-center justify-center overflow-hidden">
              <img
                  src="/ContractSystemLogo.png"
                  alt="Image"
                  // Chỉ sửa class của img
                  className="absolute inset-0 h-full w-full object-fill dark:brightness-[0.2] dark:grayscale"
              />
          </div>
      </div>
  )
}
