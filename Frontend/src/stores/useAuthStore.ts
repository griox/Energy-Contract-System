import { create } from "zustand";
import type { AuthState } from "@/types/store.ts";

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    isAuthenticated: false,

    setAccessToken: (token: string | null) => {
        set({
            accessToken: token,
            isAuthenticated: !!token
        });
    },
    clearState:() =>{
        set({
            accessToken: null,
            isAuthenticated: false,
            // Nếu bạn có lưu user trong store (cách cũ) thì set user: null tại đây luôn
            // user: null 
        });
    }
}));