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
// 1. Import các thư viện logic
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import {useLogin} from "@/hooks/useAuth";


// 2. Định nghĩa Schema Validation với Yup
const loginSchema = yup.object({
  username: yup.string().trim().required("Vui lòng nhập tên đăng nhập"),
  password: yup.string().trim().required("Vui lòng nhập mật khẩu"),
}).required();

// Định nghĩa kiểu dữ liệu cho Form dựa trên Schema
type LoginFormData = yup.InferType<typeof loginSchema>;

export function LoginForm({
                            className,
                            ...props
                          }: React.ComponentProps<"form">) {

  // 3. Gọi hook React Query để lấy hàm login và trạng thái loading
  const { mutate: login, isPending } = useLogin();

  // 4. Khởi tạo React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  // 5. Hàm xử lý khi submit form
  const onSubmit = (data: LoginFormData) => {
    // Gọi hàm mutate từ React Query hook
    login({
      username: data.username,
      password: data.password
    });
  };

  return (
      // Thay thế props của form mặc định bằng handleSubmit của RHF
      <form
          onSubmit={handleSubmit(onSubmit)}
          className={cn("flex flex-col gap-6",
              "p-8 rounded-xl bg-white-40 backdrop-blur-md border border-white/10 shadow-2xl",
              className)}
          {...props}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Login to your account</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Enter your credentials below to login
            </p>
          </div>

          {/* --- Username Field --- */}
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
                id="username"
                type="text"
                placeholder="johndoe"
                // Đăng ký input với RHF
                {...register("username")}
                // Thêm style nếu có lỗi
                className={errors.username ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {/* Hiển thị lỗi */}
            {errors.username && (
                <span className="text-xs text-red-500 mt-1 block">
              {errors.username.message}
            </span>
            )}
          </Field>

          {/* --- Password Field --- */}
          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              
            </div>
            <Input
                id="password"
                type="password"
                {...register("password")}
                className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.password && (
                <span className="text-xs text-red-500 mt-1 block">
              {errors.password.message}
            </span>
            )}
          </Field>

          {/* --- Submit Button --- */}
          <Field>
            {/* Disable nút khi đang call API (isPending) */}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Logging in..." : "Login"}
            </Button>
          </Field>

          <FieldSeparator>Or continue with</FieldSeparator>

          <Field>
            <FieldDescription className="text-center mt-2">
              Don&apos;t have an account?{" "}
              <a href="/" className="underline underline-offset-4">
                Sign up
              </a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
  )
}