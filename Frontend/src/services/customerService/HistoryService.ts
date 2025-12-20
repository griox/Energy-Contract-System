// src/services/customerService/HistoryService.ts
import api_history from "@/lib/api/api_customer";
import type { ContractHistory, PagedResult } from "@/types/contract";

/**
 * Swagger (ContractHistory)
 * POST   /api/contract-histories
 * GET    /api/contract-histories
 * GET    /api/contract-histories/contract/{contractId}
 * DELETE /api/contract-histories/{id}
 */

export type CreateContractHistoryPayload = {
    oldValue: string;
    newValue: string;
    contractId: number;
};

export type ContractHistoryQueryParams = {
    pageNumber?: number; // default 1
    pageSize?: number; // default 10
    search?: string;
};

const HISTORY_BASE = "/contract-histories";

function normalizePaging(params?: ContractHistoryQueryParams) {
    return {
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 10,
        search: params?.search?.trim() || undefined,
    };
}

export const ContractHistoryApi = {
    // POST /api/contract-histories
    // Swagger response: text/plain (Example: 0)
    create: async (payload: CreateContractHistoryPayload): Promise<number> => {
        const res = await api_history.post(HISTORY_BASE, payload, {
            headers: { "Content-Type": "application/json" },
            responseType: "text",
        });

        const n = Number((res as any).data);
        return Number.isFinite(n) ? n : 0;
    },

    // GET /api/contract-histories?pageNumber&pageSize&search
    getAll: async (params?: ContractHistoryQueryParams): Promise<PagedResult<ContractHistory>> => {
        const res = await api_history.get(HISTORY_BASE, { params: normalizePaging(params) });
        return (res as any).data ?? res;
    },

    // GET /api/contract-histories/contract/{contractId}?pageNumber&pageSize&search
    getByContract: async (
        contractId: number,
        params?: ContractHistoryQueryParams
    ): Promise<PagedResult<ContractHistory>> => {
        const res = await api_history.get(`${HISTORY_BASE}/contract/${contractId}`, {
            params: normalizePaging(params),
        });
        return (res as any).data ?? res;
    },

    // DELETE /api/contract-histories/{id}
    remove: async (id: number): Promise<number> => {
        const res = await api_history.delete(`${HISTORY_BASE}/${id}`, { responseType: "text" });
        const n = Number((res as any).data);
        return Number.isFinite(n) ? n : 0;
    },
};