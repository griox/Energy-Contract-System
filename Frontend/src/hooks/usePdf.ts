// Thêm import useQueryClient
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContractPdfApi, TemplateApi, } from "@/services/pdfService/pdfService";
import toast from "react-hot-toast";
import type { CreateTemplateParams, UpdateTemplateParams } from "@/types/pdf";
import { useTranslation } from "react-i18next";


// ==================== PDF GENERATION HOOKS ====================

export function useGeneratePdf() {
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (data: any) => {
            // Gọi API generate. 
            // Lưu ý: Timeout nên được cấu hình trong axiosClient, 
            // nhưng nếu cần thiết có thể override tại đây.
            return await ContractPdfApi.generate(data);
        },

       

        onError: (error: any) => {
            console.error("PDF Generation Error:", error);

            // 1. Bắt lỗi Timeout (Server phản hồi quá lâu > 50s)
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                toast.error(t("pdf.timeout_error") || "Request timed out. Server might be waking up.");
                return;
            }

            // 2. Bắt lỗi từ Server trả về (Tránh crash 'undefined is not an object')
            if (error.response && error.response.data) {
                // Ưu tiên hiển thị message từ backend gửi về
                const serverMsg = error.response.data.message || error.response.data.title;
                toast.error(serverMsg || t("contractDetail.toast.pdfGenerateFailed"));
            } else {
                // 3. Lỗi mạng hoặc Server sập hẳn
                toast.error(t("common.network_error") || "Network Error or Server is down.");
            }
        }
    });
}


export function usePdfHealth() {
    return useQuery({
        queryKey: ["pdf-health"],
        queryFn: ContractPdfApi.checkHealth,
    });
}

// ==================== TEMPLATE MANAGEMENT HOOKS ====================

export function useTemplates() {
    return useQuery({
        queryKey: ["templates"],
        queryFn: TemplateApi.getAll,
    });
}

export function useTemplate(id: number) {
    return useQuery({
        queryKey: ["template", id],
        queryFn: () => TemplateApi.getById(id),
        enabled: !!id,
    });
}

export function useCreateTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTemplateParams) => TemplateApi.create(data),
        onSuccess: () => {
            toast.success("Template created!");
            queryClient.invalidateQueries({ queryKey: ["templates"] });
        },
        onError: () => toast.error("Failed to create template."),
    });
}

export function useUpdateTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateTemplateParams }) =>
            TemplateApi.update(id, data),
        onSuccess: (_, variables) => {
            toast.success("Template updated!");
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            queryClient.invalidateQueries({ queryKey: ["template", variables.id] });
        },
        onError: () => toast.error("Failed to update template."),
    });
}

export function useDeleteTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => TemplateApi.delete(id),
        onSuccess: () => {
            toast.success("Template deleted!");
            queryClient.invalidateQueries({ queryKey: ["templates"] });
        },
        onError: () => toast.error("Failed to delete template."),
    });
}