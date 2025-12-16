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
// 1. Import thư viện logic
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import {useRegister} from "@/hooks/useAuth";


// 2. Định nghĩa Schema Validation
const signupSchema = yup.object({
  firstname: yup.string().trim().required("Vui lòng nhập họ"),
  lastname: yup.string().trim().required("Vui lòng nhập tên"),
  username: yup.string().trim().required("Vui lòng nhập tên đăng nhập").min(3, "Tối thiểu 3 ký tự"),
  email: yup.string().trim().email("Email không hợp lệ").required("Vui lòng nhập email"),
  password: yup.string().trim().required("Vui lòng nhập mật khẩu").min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  confirmPassword: yup.string()
      .required("Vui lòng nhập lại mật khẩu")
      .oneOf([yup.ref('password')], 'Mật khẩu không khớp'), // Logic so sánh password
}).required();

type SignupFormData = yup.InferType<typeof signupSchema>;

export function SignupForm({
                             className,
                             ...props
                           }: React.ComponentProps<"form">) {

  // 3. Gọi hook đăng ký
  const { mutate: registerUser, isPending } = useRegister();

  // 4. Setup React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = (data: SignupFormData) => {
    // Gọi API thông qua React Query mutation
    registerUser({
      username: data.username,
      password: data.password,
      email: data.email,
      firstname: data.firstname, // Mapping đúng với backend
      lastname: data.lastname
    });
  };

  return (
      <form
          onSubmit={handleSubmit(onSubmit)}
          className={cn("flex flex-col gap-6",
              "p-10 rounded-xl bg-white-40 backdrop-blur-md border border-white/10 shadow-2xl",
              className)}
          {...props}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Fill in the form below to create your account
            </p>
          </div>

          {/* --- First Name & Last Name (2 cột) --- */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="firstname">First Name</FieldLabel>
              <Input
                  id="firstname"
                  placeholder="your first name"
                  {...register("firstname")}
                  className={errors.firstname ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.firstname && <span className="text-xs text-red-500 mt-1">{errors.firstname.message}</span>}
            </Field>
            <Field>
              <FieldLabel htmlFor="lastname">Last Name</FieldLabel>
              <Input
                  id="lastname"
                  placeholder="your last name"
                  {...register("lastname")}
                  className={errors.lastname ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.lastname && <span className="text-xs text-red-500 mt-1">{errors.lastname.message}</span>}
            </Field>
          </div>

          {/* --- Username --- */}
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
                id="username"
                placeholder="tranhalinh"
                {...register("username")}
                className={errors.username ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.username && <span className="text-xs text-red-500 mt-1">{errors.username.message}</span>}
          </Field>

          {/* --- Email --- */}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email")}
                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email.message}</span>}
            <FieldDescription>
              We&apos;ll use this to contact you.
            </FieldDescription>
          </Field>

          {/* --- Password --- */}
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
                id="password"
                type="password"
                {...register("password")}
                className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.password && <span className="text-xs text-red-500 mt-1">{errors.password.message}</span>}
            <FieldDescription>
              Must be at least 8 characters long.
            </FieldDescription>
          </Field>

          {/* --- Confirm Password --- */}
          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
            <Input
                id="confirm-password"
                type="password"
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.confirmPassword && <span className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</span>}
            <FieldDescription>Please confirm your password.</FieldDescription>
          </Field>

          {/* --- Submit Button --- */}
          <Field>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Creating account..." : "Create Account"}
            </Button>
          </Field>

          <FieldSeparator>Or continue with</FieldSeparator>

          <Field>
           
            <FieldDescription className="px-6 text-center mt-2">
              Already have an account? <a href="/" className="underline underline-offset-4">Sign in</a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
  )
}