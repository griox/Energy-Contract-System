import api_auth from "@/lib/api/api_auth";
import type { LoginResponse } from "@/types/store.ts";
import type { User } from "@/types/user";

export const authService = {
    signUp: async (username: string, password: string, email: string, firstname: string, lastname: string) => {
        const response = await api_auth.post('/register', {
            firstName: firstname,
            lastName: lastname,
            username: username, // Hoặc có thể backend yêu cầu 'userName'
            email: email,
            password: password
        });
        return response.data;
    },

    signIn: async (username: string, password: string): Promise<LoginResponse> => {
        const response = await api_auth.post('/login', { username, password });
        return response.data;
    },

    signOut: async () => {
        return await api_auth.post('/logout');
    },

    fetchMe: async (): Promise<User> => {
        // Axios interceptor nên được cấu hình để tự động gắn Bearer Token
        const response = await api_auth.get('/me');
        return response.data; // Server trả về object User
    },

    refresh: async (): Promise<{ accessToken: string }> => {
        const response = await api_auth.post('/refresh-token');
        return response.data;
    }
};