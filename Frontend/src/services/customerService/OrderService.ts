import api_customer from "@/lib/api/api_customer.ts";
import type { 
    OrderDto, 
    CreateOrderParams, 
    UpdateOrderParams,
    OrderQueryParams, 
    PagedResult 
} from "@/types/order";

export const orderService = {
    // 1. Create (POST)
    create: async (data: CreateOrderParams): Promise<number> => {
        const response = await api_customer.post('/orders', data);
        return response.data; // Trả về ID
    },

    // 2. Get All (GET)
    getAll: async (params: OrderQueryParams): Promise<PagedResult<OrderDto>> => {
        const response = await api_customer.get('/orders', { params });
        return response.data;
    },

    // 3. Get By ID (GET)
    getById: async (id: number): Promise<OrderDto> => {
        const response = await api_customer.get(`/orders/${id}`);
        return response.data;
    },

    // 4. Update (PUT)
    update: async (id: number, data: CreateOrderParams): Promise<void> => {
        // Backend yêu cầu ID trong body phải khớp với ID trên URL
        const updatePayload: UpdateOrderParams = { ...data, id };
        await api_customer.put(`/orders/${id}`, updatePayload);
    },

    // 5. Delete (DELETE)
    delete: async (id: number): Promise<void> => {
        await api_customer.delete(`/orders/${id}`);
    },
    
    getMyOrders: async (): Promise<OrderDto[]> => {
        const response = await api_customer.get('/orders/me');
        return response.data;
    }
};
