// services/contractService.ts
import api_customer from "@/lib/api/api_customer.ts";
import type { 
    ContractDto, 
    CreateContractParams, 
    ContractQueryParams, 
    PagedResult 
} from "@/types/contract";

export const contractService = {
    // 1. Create (POST)
    create: async (data: CreateContractParams): Promise<number> => {
        // Axios sẽ tự convert object data thành JSON khớp với mẫu bạn đưa
        const response = await api_customer.post('/contracts', data);
        return response.data; // Trả về ID của contract vừa tạo
    },

    // 2. Get All (GET)
    getAll: async (params: ContractQueryParams): Promise<PagedResult<ContractDto>> => {
        const response = await api_customer.get('/contracts', { params });
        return response.data;
    },

    // 3. Get By ID (GET)
    getById: async (id: number): Promise<ContractDto> => {
        const response = await api_customer.get(`/contracts/${id}`);
        return response.data;
    },
    update: async (id: number, data: CreateContractParams): Promise<void> => {
        // Backend .NET thường yêu cầu ID trên URL và Body khớp nhau
        // Data truyền vào là thông tin cần sửa (trừ ID ra cũng được, tùy backend)
        await api_customer.put(`/contracts/${id}`, { ...data, id });
    },

    // 4. Delete (DELETE)
    delete: async (id: number): Promise<void> => {
        await api_customer.delete(`/contracts/${id}`);
    },
    
    getMyContracts: async (): Promise<ContractDto[]> => {
        // Gọi vào endpoint /me, Backend sẽ tự lấy email từ Token
        const response = await api_customer.get('/contracts/me');
        return response.data;
    }
};