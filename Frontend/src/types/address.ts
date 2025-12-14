export interface AddressDto {
    id: number;
    zipCode: string;
    houseNumber: string;
    extension?: string;
    created?: string;
    lastModified?: string;
}

export interface CreateAddressParams {
    zipCode: string;
    houseNumber: string;
    extension?: string;
}

export interface UpdateAddressParams extends CreateAddressParams {
    id: number;
}

export interface AddressQueryParams {
    pageNumber: number;
    pageSize: number;
    search?: string;
    zipCode?: string;
    sortBy?: string;
    sortDesc?: boolean;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}