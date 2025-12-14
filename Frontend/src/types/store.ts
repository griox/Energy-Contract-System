import type {User} from "@/types/user.ts";
export interface AuthState{
    accessToken: string | null;
    setAccessToken: (token: string | null) => void;
    isAuthenticated: boolean;
    clearState: () => void;
}
export interface LoginResponse {
    accessToken: string;
    user: User;
}