import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-hot-toast"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/useAuthStore.ts"
import { authService } from "@/services/authService/authService.ts"
import { useTranslation } from "react-i18next"

// --- 1. Hook lấy thông tin User (useQuery) ---
export const useUser = () => {
    const { accessToken } = useAuthStore()

    return useQuery({
        queryKey: ["user"],
        queryFn: authService.fetchMe,
        enabled: !!accessToken,
        retry: (failureCount, error: any) => {
            if (error?.response?.status === 401) return false
            return failureCount < 2
        },
        staleTime: 5 * 60 * 1000,
    })
}

// --- 2. Hook Đăng nhập (useMutation) ---
export const useLogin = () => {
    const setAccessToken = useAuthStore((s) => s.setAccessToken)
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const { t } = useTranslation()

    return useMutation({
        mutationFn: ({ username, password }: any) => authService.signIn(username, password),
        onSuccess: (data) => {
            setAccessToken(data.accessToken)

            if (data.user) {
                queryClient.setQueryData(["user"], data.user)
            }

            toast.success(t("auth.login.success", "Login successful!"))
            navigate("/home")
        },
        onError: (error: any) => {
            console.error(error)
            toast.error(error?.response?.data?.message || t("auth.login.failed", "Login failed."))
        },
    })
}

// --- 3. Hook Đăng ký (useMutation) ---
export const useRegister = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()

    return useMutation({
        mutationFn: ({ username, password, email, firstname, lastname }: any) =>
            authService.signUp(username, password, email, firstname, lastname),
        onSuccess: () => {
            toast.success(t("auth.signup.success", "Đăng ký thành công! Vui lòng đăng nhập."))
            navigate("/")
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || t("auth.signup.failed", "Đăng ký thất bại"))
        },
    })
}

// --- 4. Hook Đăng xuất (useMutation) ---
export const useLogout = () => {
    const setAccessToken = useAuthStore((s) => s.setAccessToken)
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const { t } = useTranslation()

    return useMutation({
        mutationFn: authService.signOut,
        onSettled: () => {
            setAccessToken(null)
            queryClient.clear()
            navigate("/signin")
            toast.success(t("auth.logout.success", "Đã đăng xuất"))
        },
    })
}

// --- 5. Hook Refresh Token (Thường dùng ở App.tsx khi mới load trang) ---
export const useRefreshToken = () => {
    const setAccessToken = useAuthStore((s) => s.setAccessToken)

    return useMutation({
        mutationFn: authService.refresh,
        onSuccess: (data) => {
            setAccessToken(data.accessToken)
        },
        onError: () => {
            setAccessToken(null)
        },
    })
}