import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware"; // 1. Import cái này
import type { AuthState } from "@/types/store.ts";

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            isAuthenticated: false,

            setAccessToken: (token: string | null) => {
                set({
                    accessToken: token,
                    isAuthenticated: !!token
                });
            },
            clearState: () => {
                set({
                    accessToken: null,
                    isAuthenticated: false,
                });
                // Xóa key trong localStorage để chắc chắn sạch sẽ
                localStorage.removeItem("auth-storage");
            }
        }),
        {
            name: "auth-storage", // Tên key nằm trong Application -> Local Storage
            storage: createJSONStorage(() => localStorage), // Lưu vào localStorage
        }
    )
);