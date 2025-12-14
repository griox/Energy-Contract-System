import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "react-hot-toast"; // Hoặc thư viện toast bạn đang dùng
import { orderService } from "@/services/customerService/OrderService";
import type { OrderQueryParams, CreateOrderParams } from "@/types/order";


// --- Hook Tạo Order ---
export const useCreateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateOrderParams) => orderService.create(data),
        onSuccess: () => {
            toast.success("Tạo đơn hàng thành công!");
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
    return useQuery({
        queryKey: ['orders', params],
        queryFn: () => orderService.getAll(params),
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

