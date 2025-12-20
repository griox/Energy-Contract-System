// src/hooks/useContractHistory.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContractHistoryApi } from "@/services/customerService/HistoryService";
import type { ContractHistory, PagedResult } from "@/types/contract";

export const contractHistoryKeys = {
    all: ["contract-histories"] as const,
    byContract: (contractId: number, pageNumber: number, pageSize: number, search?: string) =>
        [...contractHistoryKeys.all, "by-contract", contractId, pageNumber, pageSize, search ?? ""] as const,
};

export function useContractHistoryByContract(params?: {
    contractId?: number;
    pageNumber?: number;
    pageSize?: number;
    search?: string;
}) {
    const contractId = params?.contractId;
    const pageNumber = params?.pageNumber ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const search = params?.search ?? "";

    return useQuery<PagedResult<ContractHistory>>({
        queryKey:
            contractId && contractId > 0
                ? contractHistoryKeys.byContract(contractId, pageNumber, pageSize, search)
                : [...contractHistoryKeys.all, "disabled"],
        enabled: !!contractId && contractId > 0,
        queryFn: async () => {
            const data = await ContractHistoryApi.getByContract(contractId!, {
                pageNumber,
                pageSize,
                search,
            });

            // phòng BE chưa sort
            return {
                ...data,
                items: [...(data.items ?? [])].sort(
                    (a: ContractHistory, b: ContractHistory) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                ),
            };
        },
        staleTime: 10_000,
    });
}

export function useDeleteContractHistory() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => ContractHistoryApi.remove(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractHistoryKeys.all });
        },
    });
}