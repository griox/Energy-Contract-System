export interface ResellerDto {
    id: number;
    name: string;
    type: string;
    created?: string;
    lastModified?: string;
}

export interface CreateResellerParams {
    name: string;
    type: string;
}

export interface UpdateResellerParams extends CreateResellerParams {
    id: number;
}

export interface ResellerQueryParams {
    pageNumber: number;
    pageSize: number;
    search?: string;
    type?: string;
    sortBy?: string;
    sortDesc?: boolean;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}
