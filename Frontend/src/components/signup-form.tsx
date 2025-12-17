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
// 1. IMPORT useNavigate
import { useNavigate } from "react-router-dom";

// ... (Giữ nguyên phần Schema và Interface) ...
const signupSchema = yup.object({
  // ... giữ nguyên ...
  firstname: yup.string().trim().required("Vui lòng nhập họ"),
  lastname: yup.string().trim().required("Vui lòng nhập tên"),
  username: yup.string().trim().required("Vui lòng nhập tên đăng nhập").min(3, "Tối thiểu 3 ký tự"),
  email: yup.string().trim().email("Email không hợp lệ").required("Vui lòng nhập email"),
  password: yup.string().trim().required("Vui lòng nhập mật khẩu").min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  confirmPassword: yup.string().required("Vui lòng nhập lại mật khẩu").oneOf([yup.ref('password')], 'Mật khẩu không khớp'),
}).required();

type SignupFormData = yup.InferType<typeof signupSchema>;

interface SignupFormProps extends React.ComponentProps<"form"> {
  onSwitchToLogin?: () => void;
}

export function SignupForm({
  className,
  onSwitchToLogin,
  ...props
}: SignupFormProps) {

  // 2. KHỞI TẠO HOOK
  const navigate = useNavigate();
  const { mutate: registerUser, isPending } = useRegister();

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
    registerUser(
      {
        username: data.username,
        password: data.password,
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname
      }, 
      {
        // 3. XỬ LÝ KHI THÀNH CÔNG
        onSuccess: () => {
          alert("Đăng ký thành công!");
          
          // === LỰA CHỌN 1: Chuyển về Modal Login (UX tốt cho Popup) ===
          if (onSwitchToLogin) {
            onSwitchToLogin();
          }

          // === LỰA CHỌN 2: Chuyển hẳn về trang chủ "/" (Nếu muốn redirect) ===
          // navigate("/"); 
          
          // === LỰA CHỌN 3: Chuyển về trang đăng nhập riêng biệt (nếu có) ===
          // navigate("/login");
        },
        onError: (error: any) => {
          console.error(error);
          alert("Đăng ký thất bại.");
        }
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      // ... (Phần giao diện bên dưới giữ nguyên không đổi) ...
      className={cn("flex flex-col gap-6", "p-10 rounded-xl bg-white-40 backdrop-blur-md border border-white/10 shadow-2xl", className)}
      {...props}
    >
        {/* ... Các trường input giữ nguyên ... */}
        {/* ... Copy lại phần return của câu trả lời trước ... */}
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
            <Input id="firstname" placeholder="your first name" {...register("firstname")} className={errors.firstname ? "border-red-500 focus-visible:ring-red-500" : ""} />
            {errors.firstname && <span className="text-xs text-red-500 mt-1">{errors.firstname.message}</span>}
          </Field>
          <Field>
            <FieldLabel htmlFor="lastname">Last Name</FieldLabel>
            <Input id="lastname" placeholder="your last name" {...register("lastname")} className={errors.lastname ? "border-red-500 focus-visible:ring-red-500" : ""} />
            {errors.lastname && <span className="text-xs text-red-500 mt-1">{errors.lastname.message}</span>}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input id="username" placeholder="tranhalinh" {...register("username")} className={errors.username ? "border-red-500 focus-visible:ring-red-500" : ""} />
          {errors.username && <span className="text-xs text-red-500 mt-1">{errors.username.message}</span>}
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" {...register("email")} className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""} />
          {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email.message}</span>}
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" type="password" {...register("password")} className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""} />
          {errors.password && <span className="text-xs text-red-500 mt-1">{errors.password.message}</span>}
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <Input id="confirm-password" type="password" {...register("confirmPassword")} className={errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""} />
          {errors.confirmPassword && <span className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</span>}
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
                  // Logic nút bấm: Có thể dùng navigate hoặc switch modal
                  if(onSwitchToLogin) onSwitchToLogin();
                  // navigate('/login'); // Hoặc dùng cái này nếu muốn chuyển trang
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