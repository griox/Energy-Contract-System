// src/utils/authUtils.ts
import { jwtDecode } from "jwt-decode";

export const getUserRole = (token: string | null): string | null => {
    if (!token) return null;
    try {
        const decoded: any = jwtDecode(token);
        const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        return decoded[roleKey] || decoded.role || null;
    } catch (error) {
        return null;
    }
};