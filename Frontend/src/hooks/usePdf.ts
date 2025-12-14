import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContractPdfApi, TemplateApi, } from "@/services/pdfService/pdfService";
import toast from "react-hot-toast";
import type { CreateTemplateParams, UpdateTemplateParams } from "@/types/pdf";

// ==================== PDF GENERATION HOOKS ====================

export function useGeneratePdf() {
    return useMutation({
        mutationFn: ContractPdfApi.generate,

        onSuccess: (data: any) => {
            toast.success("PDF generated successfully!");

            // 🔥 MỞ PDF
            if (data?.pdfUrl) {
                window.open(data.pdfUrl, "_blank", "noopener,noreferrer");
            } else {
                toast.error("PDF URL not found!");
            }
        },

        onError: (error: any) => {
            console.error("PDF Generation Error:", error);
            toast.error("Failed to generate PDF.");
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

