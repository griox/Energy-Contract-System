import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { addressService } from "@/services/customerService/AddressService";
import type { AddressQueryParams, CreateAddressParams } from "@/types/address";

// --- Hook Tạo Địa Chỉ ---
export const useCreateAddress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAddressParams) => addressService.create(data),
        onSuccess: () => {
            toast.success("Tạo địa chỉ thành công!");
            // Làm mới danh sách địa chỉ
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.response?.data || "Lỗi khi tạo địa chỉ");
        }
    });
};

// --- Hook Cập Nhật Địa Chỉ ---
export const useUpdateAddress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: CreateAddressParams }) => 
            addressService.update(id, data),
            
        onSuccess: (_, variables) => {
            toast.success("Cập nhật địa chỉ thành công!");
            
            // 1. Làm mới danh sách tổng
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            
            // 2. Làm mới chi tiết địa chỉ đó (nếu đang xem modal/trang chi tiết)
            queryClient.invalidateQueries({ queryKey: ['address', variables.id] });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.response?.data || "Lỗi khi cập nhật địa chỉ");
        }
    });
};

// --- Hook Xóa Địa Chỉ ---
export const useDeleteAddress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => addressService.delete(id),
        
        onSuccess: () => {
            toast.success("Đã xóa địa chỉ!");
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.response?.data || "Lỗi khi xóa địa chỉ");
        }
    });
};

// --- Hook Lấy Danh Sách (Phân trang/Search) ---
export const useAddresses = (params: AddressQueryParams) => {
    return useQuery({
        queryKey: ['addresses', params],
        queryFn: () => addressService.getAll(params),
        placeholderData: keepPreviousData, // Giữ data cũ khi chuyển trang để UX mượt hơn
        staleTime: 5000, // Cache trong 5s
    });
};

// --- Hook Lấy Chi Tiết 1 Địa Chỉ (Optional - dùng cho trang Detail/Edit) ---
export const useAddress = (id: number) => {
    return useQuery({
        queryKey: ['address', id],
        queryFn: () => addressService.getById(id),
        enabled: !!id, // Chỉ chạy khi có ID hợp lệ
    });
}
