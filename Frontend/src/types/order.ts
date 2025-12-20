export const OrderType = {
    Gas: 0,
    Electricity: 1
} as const;

export type OrderType = typeof OrderType[keyof typeof OrderType];

export const OrderStatus = {
    Pending: 0,
    Active: 1,
    Completed: 2,
    Cancelled: 3
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export interface OrderDto {
    id: number;
    orderNumber: string;
    orderType: OrderType;
    status: OrderStatus;
    startDate: string; // ISO Date string
    endDate: string;   // ISO Date string
    topupFee: number;
    contractId: number;
    created?: string;
    lastModified?: string;
}

export interface CreateOrderParams {
    orderNumber: string;
    orderType: OrderType;
    status: OrderStatus;
    startDate: string;
    endDate: string;
    topupFee: number;
    contractId: number;
}

export interface UpdateOrderParams extends CreateOrderParams {
    id: number;
}

export interface OrderQueryParams {
    pageNumber: number;
    pageSize: number;
    search?: string;
    status?: OrderStatus;
    orderType?: OrderType;
    sortBy?: string;
    sortDesc?: boolean;
    contractId?: number;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}
