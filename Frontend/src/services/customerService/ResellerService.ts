import api_customer from "@/lib/api/api_customer.ts";
import type { 
    ResellerDto, 
    CreateResellerParams, 
    UpdateResellerParams,
    ResellerQueryParams, 
    PagedResult 
} from "@/types/reseller";

export const resellerService = {
    // 1. Create (POST)
    create: async (data: CreateResellerParams): Promise<number> => {
        const response = await api_customer.post('/resellers', data);
        return response.data; // Trả về ID
    },

    // 2. Get All (GET)
    getAll: async (params: ResellerQueryParams): Promise<PagedResult<ResellerDto>> => {
        const response = await api_customer.get('/resellers', { params });
        return response.data;
    },

    // 3. Get By ID (GET)
    getById: async (id: number): Promise<ResellerDto> => {
        const response = await api_customer.get(`/resellers/${id}`);
        return response.data;
    },

    // 4. Update (PUT)
    update: async (id: number, data: CreateResellerParams): Promise<void> => {
        // Backend yêu cầu ID trong body phải khớp với ID trên URL
        const updatePayload: UpdateResellerParams = { ...data, id };
        await api_customer.put(`/resellers/${id}`, updatePayload);
    },

    // 5. Delete (DELETE)
    delete: async (id: number): Promise<void> => {
        await api_customer.delete(`/resellers/${id}`);
    }
};