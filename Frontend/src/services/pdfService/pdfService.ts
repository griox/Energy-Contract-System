import api_pdf from "@/lib/api/api_pdf.ts"; // Giả định bạn đã có axios instance này
import type { CreateTemplateParams, GeneratePdfRequest, TemplateDto, UpdateTemplateParams } from "@/types/pdf";
// --- Template API (Quản lý mẫu) ---
export const TemplateApi = {
    // Lấy tất cả templates
    getAll: (): Promise<TemplateDto[]> =>
        api_pdf.get("/templates").then((res) => res.data),

    // Lấy 1 template theo id
    getById: (id: number): Promise<TemplateDto> =>
        api_pdf.get(`/templates/${id}`).then((res) => res.data),
    // Lấy template theo tên
    getByName: (name: string): Promise<TemplateDto> =>
        api_pdf.get(`/templates/by-name/${name}`).then((res) => res.data),

    // Tạo mới template
    create: (data: CreateTemplateParams): Promise<TemplateDto> =>
        api_pdf.post("/templates", data).then((res) => res.data),

    // Cập nhật template
    update: (id: number, data: UpdateTemplateParams): Promise<TemplateDto> =>
        api_pdf.put(`/templates/${id}`, data).then((res) => res.data),

    // Xoá template
    delete: (id: number): Promise<void> =>
        api_pdf.delete(`/templates/${id}`).then((res) => res.data),
};

// --- Contract PDF API (Sinh file PDF) ---
export const ContractPdfApi = {
    // Sinh file PDF từ hợp đồng và template
    // Trả về URL của file PDF (string)
    generate: (data: GeneratePdfRequest): Promise<string> =>
        api_pdf.post("/pdf-contract/generate", data).then((res) => res.data),

    // Kiểm tra health check (nếu cần)
    checkHealth: () => api_pdf.get("/health-check").then((res) => res.data),
};