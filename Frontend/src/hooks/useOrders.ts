import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "react-hot-toast"; // Hoặc thư viện toast bạn đang dùng
import { orderService } from "@/services/customerService/OrderService";
import type { OrderQueryParams, CreateOrderParams, OrderDto } from "@/types/order";
import { getUserRole } from "@/lib/authUtils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { PagedResult } from "@/types/contract";
import { t } from "i18next";



// --- Hook Tạo Order ---
export const useCreateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateOrderParams) => orderService.create(data),
        onSuccess: () => {
            toast.success(t("order.toast.created"));
            // Làm mới danh sách đơn hàng
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.response?.data || "Lỗi khi tạo đơn hàng");
        }
    });
};

// --- Hook Cập Nhật Order ---
export const useUpdateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: CreateOrderParams }) =>
            orderService.update(id, data),

        onSuccess: (_, variables) => {
            toast.success("Cập nhật đơn hàng thành công!");

            // 1. Làm mới danh sách tổng
            queryClient.invalidateQueries({ queryKey: ['orders'] });

            // 2. Làm mới chi tiết đơn hàng đó (nếu đang xem chi tiết)
            queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.response?.data || "Lỗi khi cập nhật đơn hàng");
        }
    });
};

// --- Hook Xóa Order ---
export const useDeleteOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => orderService.delete(id),

        onSuccess: () => {
            toast.success("Đã xóa đơn hàng!");
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.response?.data || "Lỗi khi xóa đơn hàng");
        }
    });
};

// --- Hook Lấy Danh Sách (Phân trang/Search/Filter) ---
export const useOrders = (params: OrderQueryParams) => {
    const { accessToken } = useAuthStore();
    const role = getUserRole(accessToken);
    return useQuery({
        queryKey: ['orders', params,role],
        queryFn: async () => {
            // =========================================================
            // CASE A: ADMIN (Server-side Pagination & Filter)
            // =========================================================
            if (role === "Admin") {
                return await orderService.getAll(params);
            }

            // =========================================================
            // CASE B: USER (Client-side Pagination & Filter)
            // =========================================================
            // 1. Lấy toàn bộ orders của user
            let myOrders = await orderService.getMyOrders();

            // 2. Lọc dữ liệu (Client-side Filtering) - Mô phỏng logic Backend
            
            // a. Lọc theo Search (OrderNumber)
            if (params.search) {
                const searchLower = params.search.toLowerCase();
                myOrders = myOrders.filter(o => 
                    o.orderNumber?.toLowerCase().includes(searchLower)
                    // Có thể thêm filter theo ContractNumber nếu muốn
                );
            }
            if (params.contractId) {
                // Đảm bảo so sánh đúng kiểu số
                myOrders = myOrders.filter(o => o.contractId === Number(params.contractId));
            }

            // b. Lọc theo Status
            if (params.status !== undefined && params.status !== null) {
                // Lưu ý: params.status từ URL/Form có thể là string, cần ép kiểu hoặc so sánh lỏng lẻo
                myOrders = myOrders.filter(o => o.status === Number(params.status));
            }

            // c. Lọc theo OrderType
            if (params.orderType !== undefined && params.orderType !== null) {
                myOrders = myOrders.filter(o => o.orderType === Number(params.orderType));
            }

            // 3. Phân trang (Client-side Pagination)
            const pageNumber = params.pageNumber || 1;
            const pageSize = params.pageSize || 10;
            const totalCount = myOrders.length;
            const totalPages = Math.ceil(totalCount / pageSize);

            const paginatedItems = myOrders.slice(
                (pageNumber - 1) * pageSize,
                pageNumber * pageSize
            );

            // 4. Trả về cấu trúc PagedResult giả lập
            const result: PagedResult<OrderDto> = {
                items: paginatedItems,
                totalCount: totalCount,
                pageNumber: pageNumber,
                pageSize: pageSize,
                totalPages: totalPages
            };

            return result;
        },
        placeholderData: keepPreviousData, // Giữ data cũ khi chuyển trang/filter
        staleTime: 5000, // Cache trong 5s
    });
};

// --- Hook Lấy Chi Tiết 1 Order ---
export const useOrder = (id: number) => {
    return useQuery({
        queryKey: ['order', id],
        queryFn: () => orderService.getById(id),
        enabled: !!id,
    });
};

