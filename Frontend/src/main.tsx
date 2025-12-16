import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import "./i18n"; // ✅ init i18n

import AppThemeProvider from "./theme/AppThemeProvider";

// 1. Import thư viện
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";


// 2. Tạo một instance của QueryClient
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1, // Số lần thử lại nếu call API thất bại (mặc định là 3)
            refetchOnWindowFocus: false, // Tắt tính năng tự refresh khi chuyển tab (tùy chọn)
        },
    },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        {/* 3. Bọc App bằng Provider và truyền client vào */}
        <QueryClientProvider client={queryClient}>
            <AppThemeProvider>
                <App />
            </AppThemeProvider>

            {/* (Tùy chọn) Công cụ debug hình bông hoa ở góc màn hình */}
            <ReactQueryDevtools initialIsOpen={false} />

        </QueryClientProvider>
    </React.StrictMode>,
)