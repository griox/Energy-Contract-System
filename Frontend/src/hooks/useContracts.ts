// hooks/useContract.ts
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { contractService } from "@/services/customerService/ContractService";
import type { ContractQueryParams, CreateContractParams } from "@/types/contract";

// --- Hook Tạo Hợp Đồng ---
export const useCreateContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateContractParams) => contractService.create(data),
        onSuccess: () => {
            toast.success("Tạo hợp đồng thành công!");
            // Làm mới danh sách hợp đồng ngay lập tức
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.response?.data || "Lỗi khi tạo hợp đồng");
        }
    });
};

export const useUpdateContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        // mutationFn nhận vào object chứa id và data
        mutationFn: ({ id, data }: { id: number; data: CreateContractParams }) => 
            contractService.update(id, data),
            
        onSuccess: (_, variables) => {
            toast.success("Cập nhật hợp đồng thành công!");
            
            // 1. Làm mới danh sách để thấy thay đổi
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            
            // 2. Làm mới chi tiết hợp đồng đó (nếu đang xem trang detail)
            queryClient.invalidateQueries({ queryKey: ['contract', variables.id] });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.response?.data || "Lỗi khi cập nhật hợp đồng");
        }
    });
};

// --- Hook Xóa Hợp đồng ---
export const useDeleteContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => contractService.delete(id),
        
        onSuccess: () => {
            toast.success("Đã xóa hợp đồng!");
            // Làm mới danh sách sau khi xóa
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error?.response?.data || "Lỗi khi xóa hợp đồng");
        }
    });
};

// --- Hook Lấy Danh Sách ---
export const useContracts = (params: ContractQueryParams) => {
    return useQuery({
        queryKey: ['contracts', params],
        queryFn: () => contractService.getAll(params),
        placeholderData: keepPreviousData, // Giữ data cũ khi chuyển trang
        staleTime: 5000, // Data coi là mới trong 5s
    });
};

// --- Hook Lấy Chi Tiết Hợp Đồng (Mới thêm) ---
export const useContract = (id: number) => {
    return useQuery({
        queryKey: ['contract', id],
        queryFn: () => contractService.getById(id),
        enabled: !!id, // Chỉ chạy query này khi có id hợp lệ
    });
};