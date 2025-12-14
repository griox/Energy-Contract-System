import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { resellerService } from "@/services/customerService/ResellerService";
import type { ResellerQueryParams, CreateResellerParams } from "@/types/reseller";

// --- Hook Tạo Reseller ---
export const useCreateReseller = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateResellerParams) => resellerService.create(data),
        onSuccess: () => {
            toast.success("Tạo Reseller thành công!");
            // Làm mới danh sách
            queryClient.invalidateQueries({ queryKey: ['resellers'] });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.response?.data || "Lỗi khi tạo Reseller");
        }
    });
};

// --- Hook Cập Nhật Reseller ---
export const useUpdateReseller = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: CreateResellerParams }) => 
            resellerService.update(id, data),
            
        onSuccess: (_, variables) => {
            toast.success("Cập nhật Reseller thành công!");
            
            // 1. Làm mới danh sách tổng
            queryClient.invalidateQueries({ queryKey: ['resellers'] });
            
            // 2. Làm mới chi tiết (nếu đang xem modal/trang chi tiết)
            queryClient.invalidateQueries({ queryKey: ['reseller', variables.id] });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.response?.data || "Lỗi khi cập nhật Reseller");
        }
    });
};

// --- Hook Xóa Reseller ---
export const useDeleteReseller = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => resellerService.delete(id),
        
        onSuccess: () => {
            toast.success("Đã xóa Reseller!");
            queryClient.invalidateQueries({ queryKey: ['resellers'] });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.response?.data || "Lỗi khi xóa Reseller");
        }
    });
};

// --- Hook Lấy Danh Sách (Phân trang/Search) ---
export const useResellers = (params: ResellerQueryParams) => {
    return useQuery({
        queryKey: ['resellers', params],
        queryFn: () => resellerService.getAll(params),
        placeholderData: keepPreviousData, // Giữ data cũ khi chuyển trang
        staleTime: 5000, // Cache trong 5s
    });
};

// --- Hook Lấy Chi Tiết 1 Reseller ---
export const useReseller = (id: number) => {
    return useQuery({
        queryKey: ['reseller', id],
        queryFn: () => resellerService.getById(id),
        enabled: !!id, // Chỉ chạy khi có ID hợp lệ
    });
};
