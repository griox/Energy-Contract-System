// hooks/useContract.ts
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { contractService } from "@/services/customerService/ContractService";
import type { ContractDto, ContractQueryParams, CreateContractParams, PagedResult } from "@/types/contract";
import { useAuthStore } from "@/stores/useAuthStore";
import { getUserRole } from "@/lib/authUtils";

// --- Hook Tạo Hợp Đồng ---
export const useCreateContract = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data: CreateContractParams) => contractService.create(data),
        onSuccess: () => {

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
    const { accessToken } = useAuthStore();
    const role = getUserRole(accessToken);
    return useQuery({
        queryKey: ['contracts', params,role],
        queryFn: async () => {
            if (role === "Admin") {
                return await contractService.getAll(params);
            }
            let allMyContracts = await contractService.getMyContracts();
            if (params.search) {
                const searchLower = params.search.toLowerCase();
                allMyContracts = allMyContracts.filter(c => 
                    c.contractNumber?.toLowerCase().includes(searchLower) ||
                    c.firstName?.toLowerCase().includes(searchLower) ||
                    c.lastName?.toLowerCase().includes(searchLower) ||
                    c.email?.toLowerCase().includes(searchLower)
                );
            }
            const pageNumber = params.pageNumber || 1;
            const pageSize = params.pageSize || 10;
            const totalCount = allMyContracts.length;
            const totalPages = Math.ceil(totalCount / pageSize);

            // Cắt mảng: Ví dụ trang 1 lấy 0-10, trang 2 lấy 10-20
            const paginatedItems = allMyContracts.slice(
                (pageNumber - 1) * pageSize, 
                pageNumber * pageSize
            );

            // 4. Trả về cấu trúc PagedResult chuẩn để UI không bị lỗi
            const result: PagedResult<ContractDto> = {
                items: paginatedItems,
                totalCount: totalCount,
                pageNumber: pageNumber,
                pageSize: pageSize,
                totalPages: totalPages,
            };

            return result;
        },
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
export const useMyContracts = () => {
    return useQuery({
        queryKey: ['my-contracts'], // Key riêng biệt
        queryFn: () => contractService.getMyContracts(),
        staleTime: 1000 * 60, // Data được coi là mới trong 1 phút (vì user ít khi tự đổi hợp đồng liên tục)
        retry: 1, // Thử lại 1 lần nếu lỗi mạng
    });
};