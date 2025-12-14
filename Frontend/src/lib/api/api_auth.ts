import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore.ts";
// ❌ KHÔNG import authService ở đây để tránh lỗi Circular Dependency (Vòng lặp vô tận)

// 1. Tạo instance
const api_auth = axios.create({
    // ✅ Sửa lại tên biến môi trường có VITE_
    baseURL: import.meta.env.VITE_AUTH_URL_API,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true
});

// --- 2. Request Interceptor ---
api_auth.interceptors.request.use(
    (config) => {
        const accessToken = useAuthStore.getState().accessToken;
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// --- 3. Response Interceptor (Gộp Logic Log + Retry) ---
api_auth.interceptors.response.use(
    (response) => {
        // Log thành công (tùy chọn)
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // A. LOG LỖI (Để debug)
        if (error.response) {
            console.error(`❌ API Error [${error.response.status}]:`, error.response.data);
        } else if (error.request) {
            console.error('❌ Network Error: No response received.');
        } else {
            console.error('❌ Request Setup Error:', error.message);
        }

        // B. LOGIC RETRY (Khi gặp lỗi 401)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Đánh dấu đã thử lại

            try {
                console.log("🔄 Detecting 401. Refreshing token...");

                // --- QUAN TRỌNG: Gọi Refresh Token ---
                // Dùng axios.post thuần túy thay vì dùng authService để tránh vòng lặp import
                // URL này phải trỏ đúng vào endpoint refresh của backend
                const response = await axios.post(
                    `${import.meta.env.VITE_AUTH_URL_API}/refresh-token`,
                    {},
                    { withCredentials: true } // Quan trọng để gửi cookie
                );

                const newAccessToken = response.data.accessToken;

                // 1. Lưu token mới vào store
                useAuthStore.getState().setAccessToken(newAccessToken);

                // 2. Gắn token mới vào header của request cũ
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // 3. Gọi lại request cũ bằng instance api_auth
                return api_auth(originalRequest);

            } catch (refreshError) {
                console.error("❌ Session expired. Logging out...");
                // Refresh thất bại -> Logout
                useAuthStore.getState().clearState();
                // Tùy chọn: window.location.href = '/signin';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api_auth;