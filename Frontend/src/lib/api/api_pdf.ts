import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";
const api_pdf = axios.create({
    baseURL: import.meta.env.VITE_PDF_URL_API ,
    timeout: 50000,
    headers: {
        "Content-Type": "application/json"
    }
});
api_pdf.interceptors.request.use(
    (config) => {
        const accessToken = useAuthStore.getState().accessToken;
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
// Kiểm tra định dạng của API
api_pdf.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', response.data);
        return response;
    },
    (error) => {
        console.error('❌ API Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received. Backend might be down.');
        }
    }
);
export default api_pdf;