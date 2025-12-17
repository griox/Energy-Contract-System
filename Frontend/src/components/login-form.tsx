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
import { useLogin } from "@/hooks/useAuth"

// Định nghĩa Schema Validation
const loginSchema = yup.object({
  username: yup.string().trim().required("Vui lòng nhập tên đăng nhập"),
  password: yup.string().trim().required("Vui lòng nhập mật khẩu"),
}).required();

type LoginFormData = yup.InferType<typeof loginSchema>;

// THÊM: Định nghĩa interface props mở rộng để nhận callback chuyển form
interface LoginFormProps extends React.ComponentProps<"form"> {
  onSwitchToSignup?: () => void;
}

export function LoginForm({
  className,
  onSwitchToSignup, // Nhận prop
  ...props
}: LoginFormProps) {

  const { mutate: login, isPending } = useLogin();

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

  const onSubmit = (data: LoginFormData) => {
    login({
      username: data.username,
      password: data.password
    });
  };

  return (
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

        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            type="text"
            placeholder="johndoe"
            {...register("username")}
            className={errors.username ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.username && (
            <span className="text-xs text-red-500 mt-1 block">
              {errors.username.message}
            </span>
          )}
        </Field>

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

        <Field>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Logging in..." : "Login"}
          </Button>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <FieldDescription className="text-center mt-2">
            Don&apos;t have an account?{" "}
            {/* SỬA: Thay đổi thẻ a để gọi hàm callback thay vì chuyển trang */}
            <span 
              onClick={onSwitchToSignup} 
              className="underline underline-offset-4 cursor-pointer text-primary hover:text-primary/80"
            >
              Sign up
            </span>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}