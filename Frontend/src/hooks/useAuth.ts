import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {useAuthStore} from "@/stores/useAuthStore.ts";
import {authService} from "@/services/authService/authService.ts"; // Hoặc 'next/navigation' nếu dùng Next.js

// --- 1. Hook lấy thông tin User (useQuery) ---
export const useUser = () => {
    const { accessToken } = useAuthStore();

    return useQuery({
        queryKey: ['user'], // Key định danh cho cache
        queryFn: authService.fetchMe,
        // Chỉ chạy fetchMe khi đã có accessToken
        enabled: !!accessToken,
        // Không retry nếu lỗi 401 (Unauthorized)
        retry: (failureCount, error: any) => {
            if (error?.response?.status === 401) return false;
            return failureCount < 2;
        },
        staleTime: 5 * 60 * 1000, // Dữ liệu được coi là mới trong 5 phút
    });
};

// --- 2. Hook Đăng nhập (useMutation) ---
export const useLogin = () => {
    const setAccessToken = useAuthStore((s) => s.setAccessToken);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: ({ username, password }: any) => authService.signIn(username, password),
        onSuccess: (data) => {
            // 1. Lưu token vào store
            setAccessToken(data.accessToken);

            // 2. Set luôn data user vào cache (đỡ phải fetchMe lại 1 lần nữa nếu API login trả về user)
            if (data.user) {
                queryClient.setQueryData(['user'], data.user);
            }

            toast.success("Đăng nhập thành công!");
            navigate('/home'); // Chuyển trang
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.response?.data?.message || "Đăng nhập thất bại");
        }
    });
};

// --- 3. Hook Đăng ký (useMutation) ---
export const useRegister = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: ({ username, password, email, firstname, lastname }: any) =>
            authService.signUp(username, password, email, firstname, lastname),
        onSuccess: () => {
            toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
            navigate('/signin');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Đăng ký thất bại");
        }
    });
};

// --- 4. Hook Đăng xuất (useMutation) ---
export const useLogout = () => {
    const setAccessToken = useAuthStore((s) => s.setAccessToken);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: authService.signOut,
        onSettled: () => {
            setAccessToken(null);
            queryClient.clear(); // Xóa sạch cache của React Query
            navigate('/signin');
            toast.success("Đã đăng xuất");
        }
    });
};

// --- 5. Hook Refresh Token (Thường dùng ở App.tsx khi mới load trang) ---
export const useRefreshToken = () => {
    const setAccessToken = useAuthStore((s) => s.setAccessToken);

    return useMutation({
        mutationFn: authService.refresh,
        onSuccess: (data) => {
            setAccessToken(data.accessToken);
        },
        onError: () => {
            setAccessToken(null);
        }
    });
};