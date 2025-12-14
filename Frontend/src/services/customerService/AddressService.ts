import api_customer from "@/lib/api/api_customer.ts";
import type { 
    AddressDto, 
    CreateAddressParams, 
    UpdateAddressParams,
    AddressQueryParams, 
    PagedResult 
} from "@/types/address";

export const addressService = {
    // 1. Create (POST)
    create: async (data: CreateAddressParams): Promise<number> => {
        const response = await api_customer.post('/addresses', data);
        return response.data; // Trả về ID
    },

    // 2. Get All (GET)
    getAll: async (params: AddressQueryParams): Promise<PagedResult<AddressDto>> => {
        const response = await api_customer.get('/addresses', { params });
        return response.data;
    },

    // 3. Get By ID (GET)
    getById: async (id: number): Promise<AddressDto> => {
        const response = await api_customer.get(`/addresses/${id}`);
        return response.data;
    },

    // 4. Update (PUT)
    update: async (id: number, data: CreateAddressParams): Promise<void> => {
        // Backend yêu cầu ID trong body phải khớp với ID trên URL
        // Controller: if (id != command.Id) return BadRequest...
        const updatePayload: UpdateAddressParams = { ...data, id };
        await api_customer.put(`/addresses/${id}`, updatePayload);
    },

    // 5. Delete (DELETE)
    delete: async (id: number): Promise<void> => {
        await api_customer.delete(`/addresses/${id}`);
    }
};
