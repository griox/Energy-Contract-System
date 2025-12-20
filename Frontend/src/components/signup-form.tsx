import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { useRegister } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"


// ===== Schema (giữ nguyên field, chỉ nâng validate) =====
const signupSchema = yup
  .object({
    firstname: yup
      .string()
      .transform((v) =>
        typeof v === "string" ? v.trim().replace(/\s+/g, " ") : v
      )
      .required("Vui lòng nhập họ")
      .min(1, "Họ không được để trống")
      .max(50, "Họ tối đa 50 ký tự"),

    lastname: yup
      .string()
      .transform((v) =>
        typeof v === "string" ? v.trim().replace(/\s+/g, " ") : v
      )
      .required("Vui lòng nhập tên")
      .min(1, "Tên không được để trống")
      .max(50, "Tên tối đa 50 ký tự"),

    username: yup
      .string()
      .transform((v) => (typeof v === "string" ? v.trim() : v))
      .required("Vui lòng nhập tên đăng nhập")
      .min(3, "Tối thiểu 3 ký tự")
      .max(30, "Tối đa 30 ký tự")
      .matches(/^[a-zA-Z0-9._-]+$/, "Username chỉ gồm chữ, số và các ký tự . _ -")
      .test(
        "no-space",
        "Username không được chứa khoảng trắng",
        (v) => !v || !/\s/.test(v)
      )
      .test(
        "no-edge-symbol",
        "Username không được bắt đầu/kết thúc bằng . _ -",
        (v) => {
          if (!v) return true
          return !/^[._-]|[._-]$/.test(v)
        }
      ),

    email: yup
      .string()
      .transform((v) => (typeof v === "string" ? v.trim() : v))
      .required("Vui lòng nhập email")
      .email("Email không hợp lệ")
      .max(100, "Email tối đa 100 ký tự"),

    password: yup
      .string()
      .required("Vui lòng nhập mật khẩu")
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .max(64, "Mật khẩu tối đa 64 ký tự")
      .test(
        "no-space",
        "Mật khẩu không được chứa khoảng trắng",
        (v) => !v || !/\s/.test(v)
      )
      .matches(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
      .matches(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
      .matches(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số")
      .matches(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),

    confirmPassword: yup
      .string()
      .required("Vui lòng nhập lại mật khẩu")
      .oneOf([yup.ref("password")], "Mật khẩu không khớp"),
  })
  .required()

type SignupFormData = yup.InferType<typeof signupSchema>

interface SignupFormProps extends React.ComponentProps<"form"> {
  onSwitchToLogin?: () => void
}

export function SignupForm({ className, onSwitchToLogin, ...props }: SignupFormProps) {
  const navigate = useNavigate()
  const { mutate: registerUser, isPending } = useRegister()
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    setError, // ✅ thêm để set lỗi "đã tồn tại" từ server
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = (data: SignupFormData) => {
    registerUser(
      {
        username: data.username,
        password: data.password,
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
      },
      {
        onSuccess: () => {
          alert(t("auth.signup.success", "Đăng ký thành công!"))

          if (onSwitchToLogin) {
            onSwitchToLogin()
          }

          // navigate("/")
          // navigate("/login")
        },
        onError: (error: any) => {
          console.error(error)


          const fieldErrors = error?.response?.data?.errors
          if (fieldErrors?.username?.[0]) {
            setError("username", { type: "server", message: String(fieldErrors.username[0]) })
            return
          }
          if (fieldErrors?.email?.[0]) {
            setError("email", { type: "server", message: String(fieldErrors.email[0]) })
            return
          }

          // ====== FALLBACK: Backend trả message chung ======
          const msg =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            ""

          const lower = String(msg).toLowerCase()

          // đoán theo message (khi backend không trả errors theo field)
          if (lower.includes("username") && (lower.includes("exist") || lower.includes("taken") || lower.includes("duplicate"))) {
            setError("username", { type: "server", message: "Username đã tồn tại" })
            return
          }

          if (lower.includes("email") && (lower.includes("exist") || lower.includes("taken") || lower.includes("duplicate"))) {
            setError("email", { type: "server", message: "Email đã tồn tại" })
            return
          }

          alert(t("auth.signup.failed", "Đăng ký thất bại."))
        },
      }
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn(
        "flex flex-col gap-6",
        "p-10 rounded-xl bg-white-40 backdrop-blur-md border border-white/10 shadow-2xl",
        className
      )}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="firstname">First Name</FieldLabel>
            <Input
              id="firstname"
              placeholder="your first name"
              {...register("firstname")}
              className={errors.firstname ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.firstname && (
              <span className="text-xs text-red-500 mt-1">{errors.firstname.message}</span>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="lastname">Last Name</FieldLabel>
            <Input
              id="lastname"
              placeholder="your last name"
              {...register("lastname")}
              className={errors.lastname ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.lastname && (
              <span className="text-xs text-red-500 mt-1">{errors.lastname.message}</span>
            )}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            placeholder="tranhalinh"
            {...register("username")}
            className={errors.username ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.username && (
            <span className="text-xs text-red-500 mt-1">{errors.username.message}</span>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register("email")}
            className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.email && (
            <span className="text-xs text-red-500 mt-1">{errors.email.message}</span>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            {...register("password")}
            className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.password && (
            <span className="text-xs text-red-500 mt-1">{errors.password.message}</span>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            {...register("confirmPassword")}
            className={errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.confirmPassword && (
            <span className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</span>
          )}
        </Field>

        <Field>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Creating account..." : "Create Account"}
          </Button>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <FieldDescription className="px-6 text-center mt-2">
            Already have an account?{" "}
            <span
              onClick={() => {
                if (onSwitchToLogin) onSwitchToLogin()
                // navigate("/login")
              }}
              className="underline underline-offset-4 cursor-pointer text-primary hover:text-primary/80"
            >
              Sign in
            </span>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}