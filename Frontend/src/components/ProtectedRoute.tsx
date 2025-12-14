import { useEffect, useState, useRef } from 'react'; // 1. Thêm useRef
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from "@/stores/useAuthStore.ts";
import { authService } from "@/services/authService/authService.ts";

const ProtectedRoute = () => {
    const { accessToken, setAccessToken } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);
    const location = useLocation();

    // 2. Tạo biến ref để kiểm soát việc gọi API
    const isMounted = useRef(false);

    useEffect(() => {
        const checkAuth = async () => {
            // Nếu đã có token rồi thì thôi
            if (accessToken) {
                setIsChecking(false);
                return;
            }

            // 3. Chặn việc gọi 2 lần trong Strict Mode
            if (isMounted.current) return;
            isMounted.current = true;

            try {
                console.log("🔄 F5 detected: Refreshing token...");
                const data = await authService.refresh();

                if (data?.accessToken) {
                    setAccessToken(data.accessToken);
                    console.log("✅ Session restored success!");
                } else {
                    // Nếu API trả về 200 nhưng không có accessToken (hiếm gặp)
                    setAccessToken(null);
                }
            } catch (error) {
                console.error("❌ Session restore failed:", error);
                setAccessToken(null);
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 4. Để dependency rỗng để chỉ chạy lúc mount

    if (isChecking) {
        return (
            <div className='flex h-screen items-center justify-center flex-col gap-2'>
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-gray-500 text-sm">Restoring session...</p>
            </div>
        );
    }

    if (!accessToken) {
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;