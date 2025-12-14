// types/contract.ts

// 1. Payload để tạo mới (Khớp 100% với JSON bạn đưa)
export interface CreateContractParams {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    startDate: string; // Định dạng ISO: "2025-12-13T02:14:56.688Z"
    endDate: string;   // Định dạng ISO
    companyName: string;
    bankAccountNumber: string;
    pdfLink: string;
    resellerId: number;
    addressId: number;
}

// 2. DTO trả về khi Get Detail hoặc List (Thường backend sẽ trả về thêm ID và ContractNumber)
export interface ContractDto {
    id: number;
    contractNumber: string; // Backend tự sinh
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    startDate: string;
    endDate: string;
    companyName: string;
    bankAccountNumber: string;
    pdfLink: string;
    resellerId: number;
    addressId: number;
    // Các field bổ sung nếu có relation
    reseller?: { id: number; name: string };
    address?: { id: number; street: string; city: string };
}

// 3. Query Params cho Filter (Giữ nguyên logic cũ)
export interface ContractQueryParams {
    search?: string;
    resellerId?: number;
    startDateFrom?: string;
    startDateTo?: string;
    pageNumber: number;
    pageSize: number;
    sortBy?: string;
    sortDesc?: boolean;
}

// 4. Kết quả phân trang
export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}
export interface UpdateContractParams extends CreateContractParams {
    id: number;
}