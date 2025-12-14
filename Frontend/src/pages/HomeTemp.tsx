import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {useLogout, useUser} from "@/hooks/useAuth";

export default function HomePage() {
    // 1. Sử dụng hook useUser để lấy thông tin người dùng
    const { data: user, isLoading } = useUser();

    // 2. Sử dụng hook logout
    const { mutate: logout } = useLogout();

    // Màn hình chờ khi đang fetch user (tránh nhấp nháy giao diện)
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md text-center space-y-6">

                {/* --- TRƯỜNG HỢP 1: ĐÃ ĐĂNG NHẬP --- */}
                {user ? (
                    <Card className="w-full shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl text-green-600">
                                🎉 Welcome Back!
                            </CardTitle>
                            <CardDescription>
                                You are securely logged in.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-left">
                            <div className="rounded-md bg-slate-100 p-4 text-sm">
                                <p><strong>Username:</strong> {user.username}</p>
                                <p><strong>Email:</strong> {user.email}</p>
                                <p><strong>Full Name:</strong> {user.firstName} {user.lastName}</p>
                                {/* Debug Token nếu cần (chỉ dev) */}
                                {/* <p className="truncate text-xs text-gray-400 mt-2">ID: {user.id}</p> */}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button variant="default" className="w-full">
                                    Go to Dashboard
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => logout()}
                                >
                                    Log out
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* --- TRƯỜNG HỢP 2: CHƯA ĐĂNG NHẬP (GUEST) --- */
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
                                My Awesome App
                            </h1>
                            <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                A secure authentication system built with React Query, Zustand & Axios Interceptors.
                            </p>
                        </div>

                        <div className="flex justify-center gap-4">
                            <Link to="/signin">
                                <Button size="lg" className="w-32">
                                    Sign In
                                </Button>
                            </Link>
                            <Link to="/signup">
                                <Button variant="outline" size="lg" className="w-32">
                                    Sign Up
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}