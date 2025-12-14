export interface GeneratePdfRequest {
    contractNumber: string;
    startDate: string;
    endDate: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    companyName: string;
    bankAccountNumber: string;
    addressLine: string;
    totalAmount: number;
    currency: string;
}

export interface GeneratePdfResponse {
    success: boolean;
    pdfUrl: string;
    fileName: string;
    errorMessage?: string;
}
// --- Types ---
export interface TemplateDto {
    id: number;
    name: string;
    description: string;
    htmlContent: string;
    isActive: boolean;
    previewImageUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateTemplateParams {
    name: string;
    description: string;
    htmlContent: string;
    isActive: boolean;
}

export interface UpdateTemplateParams {
    description: string;
    htmlContent: string;
    isActive: boolean;
}

export interface GeneratePdfRequest {
    contractId: number;
    templateId?: number; // Optional: nếu không gửi sẽ dùng template mặc định
    // Các trường khác nếu backend yêu cầu (ví dụ: language, options...)
}